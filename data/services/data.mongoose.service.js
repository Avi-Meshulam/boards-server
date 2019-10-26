const mongoose = require('mongoose');
const IDataService = require('./IDataService');
const httpErrors = require('../../httpErrors');
const { sortArray } = require('../../utils');
const { clearBuffers } = require('../../dbUtils');

const QUERY_OPTIONS = ['sort', 'limit', 'skip'];

function connectDB(dbName) {
  const DB_URL =
    process.env.MONGODB_URI || `mongodb://localhost:27017/${dbName}`;
  mongoose.connect(DB_URL, { useNewUrlParser: true });
  mongoose.connection.once('open', function() {
    console.log(`Successfully connected to MongoDB[${dbName}]`);
  });
  mongoose.connection.on(
    'error',
    console.error.bind(console, 'connection error:'),
  );
  mongoose.set('useFindAndModify', false);
}

class MongooseDataService extends IDataService {
  constructor(entityName) {
    super();
    this._model = require(`../models/${entityName}.model`);
  }

  isReady() {
    return (
      mongoose.connection.readyState === mongoose.ConnectionStates.connected
    );
  }

  async get(filter, options) {
    const query = this._model.find(filter);
    applyOptionsToQuery(options);
    return await query.exec();
  }

  async getById(id) {
    const query = this._model.findById(id);
    return await query.exec();
  }

  async getSubDocument(subDocumentInfo) {
    const [, subDocument] = await getSubDocumentHelper(
      this._model,
      subDocumentInfo,
    );
    return subDocument;
  }

  async insert(data) {
    const result = await this._model.create(data);
    return result._doc;
  }

  // insert data to a subDocument array OR many subDocument arrays
  async insertSubDocument(subDocumentInfo, data) {
    validateRequest('POST', subDocumentInfo, data);

    let [document, subDocument] = await getSubDocumentHelper(
      this._model,
      subDocumentInfo,
    );

    if (!Array.isArray(subDocument)) {
      throw httpErrors.badRequest;
    }

    let newEntry;
    if (subDocument.isMongooseDocumentArray) {
      newEntry = subDocument.create();
    }

    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // value.forEach(item => {
        //   insertArrayItem(newEntry[key], item);
        // });
        const newItems = newEntry ? newEntry[key].create(value) : value;
        (newEntry || subDocument).push(...newItems);
      } else {
        if (newEntry) {
          newEntry[key] = value;
        } else {
          subDocument.push(value);
        }
      }
    });

    if (newEntry) {
      subDocument.push(newEntry);
    }

    await document.save();
    return clearBuffers(newEntry || subDocument);
  }

  async update(filter, data) {
    const docs = await this.get(filter);
    const modified = docs.filter(
      doc => !equals(doc._doc, { ...doc._doc, ...data }),
    );
    if (modified.length === 0) {
      return {
        n: docs.length,
        nModified: 0,
      };
    }
    filter = { ...filter, _id: { $in: modified.map(doc => doc._id) } };
    const result = await this._model.updateMany(filter, data).exec();
    return {
      n: docs.length,
      nModified: result.nModified,
    };
  }

  async updateById(id, data) {
    const doc = await this.getById(id);
    if (equals(doc._doc, { ...doc._doc, ...data })) {
      return doc; // nothing to save
    } else {
      return await this._model
        .findByIdAndUpdate(id, data, { new: true })
        .exec();
    }
  }

  async updateSubDocument(subDocumentInfo, data) {
    validateRequest('PUT', subDocumentInfo, data);
    const [document, subDocument] = await getSubDocumentHelper(
      this._model,
      subDocumentInfo,
    );
    if (Array.isArray(subDocument)) {
      return await updateSubDocumentArray(document, subDocument, data);
    } else {
      await updateSingleSubDocument(document, subDocument, data);
      return await this.getSubDocument(subDocumentInfo);
    }
  }

  async remove(filter) {
    return await this._model.deleteMany(filter).exec();
  }

  async removeById(id) {
    await this._model.findByIdAndRemove(id).exec();
    return true;
  }

  async removeSubDocument(subDocumentInfo) {
    const [document, subDocument] = await getSubDocumentHelper(
      this._model,
      subDocumentInfo,
    );
    if (Array.isArray(subDocument)) {
      return await removeSubDocumentArray(document, subDocument);
    } else {
      return await removeSingleSubDocument(document, subDocument);
    }
  }
}

// *** helper functions *** //

async function updateSingleSubDocument(document, subDocument, data) {
  if (equals(subDocument._doc, { ...subDocument._doc, ...data })) {
    return subDocument; // nothing to update
  }
  subDocument.set(data);
  await document.save();
  return clearBuffers(subDocument);
}

async function updateSubDocumentArray(document, subDocumentArray, data) {
  let nModified = 0;
  subDocumentArray.forEach(item => {
    if (!equals(item._doc, { ...item._doc, ...data })) {
      item.set(data);
      nModified++;
    }
  });
  if (nModified > 0) {
    await document.save();
  }
  return {
    n: subDocumentArray.length,
    nModified,
  };
}

async function removeSingleSubDocument(document, subDocument) {
  subDocument.remove();
  await document.save();
  return true;
}

async function removeSubDocumentArray(document, subDocument) {
  let deletedCount = subDocument.length;
  while (subDocument.length > 0) {
    subDocument.pop();
  }
  await document.save();
  return {
    deletedCount,
  };
}

async function getSubDocumentHelper(model, { ownerId, path, filter, options }) {
  const query = model.findById(ownerId);
  applyPathToQuery(query, path);
  const document = await query.exec();
  let subDocument = applyPathToDocument(document, path);
  subDocument = applyFilterToArray(subDocument, filter);
  subDocument = applyOptionsToArray(subDocument, options);
  if (!subDocument) {
    throw new Error('Object not found');
  }
  return [document, subDocument];
}

function applyOptionsToQuery(query, options = {}) {
  Object.keys(options).forEach(key => {
    if (QUERY_OPTIONS.includes(key)) {
      query[key](options[key]);
    }
  });
}

function applyPathToQuery(query, path = []) {
  applyPathToQueryConditions(query, path);
  applyPathToQueryProjection(query, path);
}

function applyPathToQueryConditions(query, path = []) {
  if (path[1] && path[1].id) {
    query.and([{ [`${path[0]}._id`]: path[1].id }]);
  }
}

function applyPathToQueryProjection(query, path = []) {
  const subDocumentNames = [];
  // path is composed of subDocument names and id's alternately
  for (let index = 0; index < path.length; index += 2) {
    subDocumentNames.push(path[index]);
  }
  let expression = '';
  for (let index = 0; index < subDocumentNames.length; index++) {
    expression += `${expression ? ' ' : ''}+${subDocumentNames
      .slice(0, index + 1)
      .join('.')}`;
  }
  if (expression) {
    query.select(expression);
  }
}

function applyPathToDocument(document, path = []) {
  if (!document) {
    return;
  }
  path.forEach(element => {
    if (element.id) {
      document = document.id(element.id);
    } else {
      document = document[element];
    }
  });
  return document;
}

function applyFilterToArray(arr, filter = {}) {
  if (arr && Array.isArray(arr)) {
    Object.entries(filter).forEach(([key, value]) => {
      arr = arr.filter(rec => rec[key] === value);
    });
  }
  return arr;
}

function applyOptionsToArray(arr, options = {}) {
  if (arr && Array.isArray(arr)) {
    // let arrCopy = [...arr];
    Object.entries(options).forEach(([key, value]) => {
      switch (key) {
        case 'sort':
          sortMongooseArray(arr, value);
          break;
        case 'skip':
          arr = arr.slice(value);
          // return arr.splice(value);
          break;
        case 'limit':
          arr = arr.slice(0, value);
          break;
        default:
          break;
      }
    });
  }
  return arr;
}

function sortMongooseArray(arr, sortExp) {
  if (typeof sortExp === 'object') {
    Object.entries(sortExp).forEach(([key, value]) => {
      const isReverse = ['desc', 'descending', '-1'].includes(value);
      sortArray(arr, key, isReverse);
    });
  } else if (typeof sortExp === 'string') {
    const tokens = sortExp.split(' ');
    tokens.forEach(token => {
      const isReverse = token[0] === '-';
      const field = isReverse ? token.substr(1) : token;
      return sortArray(arr, field, isReverse);
    });
  } else {
    return sortAray(arr);
  }
}

function validateRequest(method, subDocumentInfo, data) {
  const path = subDocumentInfo.path;
  switch (method) {
    case 'POST':
      if (path[path.length - 1].id) {
        throw httpErrors.badRequest;
      }
      break;
    case 'PUT':
      if (path[path.length - 1].id) {
        Object.values(data).forEach(value => {
          if (Array.isArray(value)) {
            throw httpErrors.badRequest;
          }
        });
      }
      break;
    default:
      break;
  }
}

function insertArrayItem(arr, item) {
  if (!Array.isArray(arr)) {
    throw httpErrors.badRequest;
  }
  const newItem = arr.create(item);
  arr.push(newItem);
}

function removeTimestamp(obj) {
  const { createdAt, updatedAt, ...result } = obj;
  return result;
}

function equals(obj1, obj2) {
  return (
    JSON.stringify(removeTimestamp(obj1)) ===
    JSON.stringify(removeTimestamp(obj2))
  );
}

module.exports = {
  connectDB,
  MongooseDataService,
};
