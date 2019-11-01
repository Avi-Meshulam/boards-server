const httpErrors = require('../../httpErrors');
const { sortArray } = require('../../utils');

class DocUtils {
  static extract(doc, pathHierarchy) {
    for (let index = 0; index < pathHierarchy.length; index++) {
      const segment = pathHierarchy[index];
      if (doc.isMongooseDocumentArray) {
        doc = doc.id(segment) || {};
      } else if (segment in doc) {
        doc = doc[segment] || [];
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
      if (!doc.isMongooseDocumentArray && key !== doc.$path()) {
        return; // move next
      }
      if (Array.isArray(value)) {
        if (newEntry) {
          value.forEach(item => {
            const newItem = newEntry[key].create(item);
            newEntry[key].push(newItem);
          });
        } else {
          doc.push(...value);
        }
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
    if (doc.isMongooseDocumentArray) {
      return doc.updateIf(
        item =>
          Object.entries(filter).every(
            ([key, value]) => item[key].toString() === value,
          ),
        data,
        DocUtils.equals,
        DocUtils.merge,
      );
    }

    if (doc.$isDocumentArrayElement || doc.$isSingleNested) {
      if (
        Object.entries(filter).every(
          ([key, value]) => doc[key].toString() === value,
        )
      ) {
        doc.set(data);
        return true;
      } else {
        return false;
      }
    }

    if (doc.isMongooseArray) {
      if (!data[doc.$path()] || Array.isArray(data[doc.$path()])) {
        throw httpErrors.badRequest;
      }
      if (targetElement) {
        doc[targetElement] = data[doc.$path()];
        return true;
      } else {
        return doc.updateIf(
          item =>
            Object.entries(filter).every(
              ([key, value]) => item.toString() === value,
            ),
          data[doc.$path()],
        );
      }
    }

    throw httpErrors.badRequest;
  }

  static remove(doc = {}, filter = {}, targetElement = undefined) {
    if (doc.isMongooseDocumentArray) {
      return doc.removeIf(item =>
        Object.entries(filter).every(
          ([key, value]) => item[key].toString() === value,
        ),
      );
    }

    if (doc.$isDocumentArrayElement || doc.$isSingleNested) {
      if (
        Object.entries(filter).every(
          ([key, value]) => doc[key].toString() === value,
        )
      ) {
        doc.remove();
        return true;
      } else {
        return false;
      }
    }

    if (doc.isMongooseArray) {
      if (targetElement) {
        if (doc.splice(doc.indexOf(targetElement), 1).length === 0) {
          return false;
        }
        return true;
      } else {
        return doc.removeIf(item =>
          Object.entries(filter).every(
            ([key, value]) => item.toString() === value,
          ),
        );
      }
    }

    throw httpErrors.badRequest;
  }

  static filter(doc = {}, filter = {}) {
    if (doc.isMongooseArray && Object.keys(filter).length > 0) {
      doc.removeIf(item =>
        Object.entries(filter).every(
          ([key, value]) => (item[key] || item).toString() !== value,
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

  static equals(doc, data) {
    const keys = Object.keys(doc._doc);
    if (Object.keys(data).some(key => !keys.includes(key))) {
      return false;
    }
    return JSON.stringify(doc._doc) == JSON.stringify({ ...doc._doc, ...data });
  }

  static merge(doc, data) {
    return { ...doc._doc, ...data };
  }
}

module.exports = DocUtils;
