const httpErrors = require('../../httpErrors');
const { sortArray } = require('../../utils');

class DocUtils {
  static extract(doc, pathHierarchy) {
    for (let index = 0; index < pathHierarchy.length; index++) {
      const segment = pathHierarchy[index];
      if (doc.isMongooseDocumentArray) {
        doc = doc.id(segment);
      } else if (doc[segment]) {
        doc = doc[segment];
      // } else if (doc.isMongooseArray) {
      } else if (Array.isArray(doc)) {
        break;
      } else {
        throw httpErrors.badRequest;
      }
    }
    return doc;
  }

  static insert(doc = {}, data = {}) {
    if (!doc.isMongooseArray) {
      throw httpErrors.badRequest;
    }

    let newEntry;
    if (doc.isMongooseDocumentArray) {
      newEntry = doc.create();
    }

    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        const newItems = newEntry ? newEntry[key].create(value) : value;
        (newEntry || doc).push(...newItems);
      } else if (newEntry) {
        newEntry[key] = value;
      } else {
        doc.push(value);
      }
    });

    if (newEntry) {
      doc.push(newEntry);
    }

    return newEntry || doc;
  }

  static update(doc = {}, filter = {}, data = {}, targetElement = undefined) {
    if (doc.isMongooseArray) {
      if (Object.keys(filter).length > 0) {
        return doc.updateIf(item =>
          Object.entries(filter).every(
            ([key, value]) => (item[key] || item) === value,
            data,
            doc.isMongooseDocumentArray ? DocUtils.equals : undefined,
          ),
        );
      }
      // no filter
      else if (targetElement) {
        return doc.updateIf(item => item === targetElement, Object.values(data)[0]);
      } else {
        return doc.updateIf(() => true, Object.values(data)[0]);
      }
    }

    if (doc.$isDocumentArrayElement) {
      if (targetElement) {
        doc[targetElement] = Object.values(data)[0];
      } else {
        doc.set(data);
      }
      return true;
    }

    throw httpErrors.badRequest;
  }

  static remove(doc = {}, filter = {}, targetElement = undefined) {
    if (doc.isMongooseArray) {
      if (Object.keys(filter).length > 0) {
        return doc.removeIf(item =>
          Object.entries(filter).every(
            ([key, value]) => (item[key] || item) === value,
          ),
        );
      }
      // no filter
      else if (targetElement) {
        doc.splice(doc.indexOf(targetElement), 1);
        return true;
      } else {
        const deletedCount = doc.length;
        while (doc.length > 0) {
          doc.pop();
        }
        return { deletedCount };
      }
    }

    if (doc.$isDocumentArrayElement) {
      if (targetElement) {
        doc[targetElement] = undefined;
        // delete doc[targetElement];
      } else {
        doc.remove();
      }
      return true;
    }

    throw httpErrors.badRequest;
  }

  static filter(doc = {}, filter = {}) {
    if (doc.isMongooseArray && Object.keys(filter).length > 0) {
      doc.removeIf(item =>
        Object.entries(filter).every(
          ([key, value]) => (item[key] || item) !== value,
        ),
      );
    }
  }

  static applyOptions(doc = [], options = {}) {
    if (!doc.isMongooseArray) {
      return;
    }
    Object.entries(options).forEach(([key, value]) => {
      switch (key) {
        case 'sort':
          DocUtils.sort(doc, value);
          break;
        case 'skip':
          doc.splice(0, value);
          // return doc.slice(value);
          break;
        case 'limit':
          doc.splice(value);
          // return doc.slice(0, value);
          break;
        default:
          break;
      }
    });
  }

  static sort(doc, sortExp) {
    if (typeof sortExp === 'object') {
      Object.entries(sortExp).forEach(([key, value]) => {
        const isReverse = ['desc', 'descending', '-1'].includes(value);
        sortArray(doc, key, isReverse);
      });
    } else if (typeof sortExp === 'string') {
      const tokens = sortExp.split(' ');
      tokens.forEach(token => {
        const isReverse = token[0] === '-';
        const field = isReverse ? token.substr(1) : token;
        return sortArray(doc, field, isReverse);
      });
    } else {
      return sortArray(doc);
    }
  }

  static removeTimestamp(doc) {
    const { createdAt, updatedAt, ...result } = doc;
    return result;
  }

  static equals(doc1, doc2) {
    return (
      JSON.stringify(removeTimestamp(doc1)) ===
      JSON.stringify(removeTimestamp(doc2))
    );
  }
}

module.exports = DocUtils;
