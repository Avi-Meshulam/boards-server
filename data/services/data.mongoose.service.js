const mongoose = require('mongoose');
const IDataService = require('./IDataService');
const httpErrors = require('../../httpErrors');
const isEqual = require('../../utils').isEqual;
const sortArray = require('../../utils').sortArray;

const DB_NAME = 'boards';
const DB_URL = process.env.MONGODB_URI || `mongodb://localhost:27017/${DB_NAME}`;
const QUERY_OPTIONS = ['sort', 'limit', 'skip'];

// connect and configure db
mongoose.connect(DB_URL, { useNewUrlParser: true });
mongoose.connection.once('open', function() {
  console.log(`Successfully connected to MongoDB[${DB_NAME}]`);
});
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.set('useFindAndModify', false);

class MongooseDataService extends IDataService {
  constructor(entityName) {
    super();
    this._model = require(`../models/${entityName}.model`);
  }

  isReady() {
    return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
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
    const [, subDocument] = await getSubDocumentHelper(this._model, subDocumentInfo);
    return subDocument;
  }

  async insert(data) {
    const result = await this._model.create(data);
    return result._doc;
  }

  // insert data to a subDocument array OR many subDocument arrays
  async insertSubDocument(subDocumentInfo, data) {
    validateRequest('POST', subDocumentInfo, data);
    let [document, subDocument] = await getSubDocumentHelper(this._model, subDocumentInfo);
    if (!Array.isArray(subDocument)) {
      throw new Error(httpErrors.badRequest);
    }
    const newItem = subDocument.create(data);
    subDocument.push(newItem);
    await document.save();
    return subDocument.id(newItem._id);
  }

  async update(filter, data) {
    const docs = await this.get(filter);
    const modified = docs.filter(doc => !isEqual(doc._doc, { ...doc._doc, ...data }));
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
    if (isEqual(doc._doc, { ...doc._doc, ...data })) {
      return doc; // nothing to save
    } else {
      return await this._model.findByIdAndUpdate(id, data, { new: true }).exec();
    }
  }

  async updateSubDocument(subDocumentInfo, data) {
    validateRequest('PUT', subDocumentInfo, data);
    const [document, subDocument] = await getSubDocumentHelper(this._model, subDocumentInfo);
    if (Array.isArray(subDocument)) {
      return await updateSubDocumentArray(document, subDocument, data);
    } else {
      return await updateSingleSubDocument(document, subDocument, data);
    }
  }

  async remove(filter) {
    return await this._model.remove(filter).exec();
  }

  async removeById(id) {
    await this._model.findByIdAndRemove(id).exec();
    return true;
  }

  async removeSubDocument(subDocumentInfo) {
    const [document, subDocument] = await getSubDocumentHelper(this._model, subDocumentInfo);
    if (Array.isArray(subDocument)) {
      return await removeSubDocumentArray(document, subDocument);
    } else {
      return await removeSingleSubDocument(document, subDocument);
    }
  }
}

// *** helper functions *** //

async function updateSingleSubDocument(document, subDocument, data) {
  if (isEqual(subDocument._doc, { ...subDocument._doc, ...data })) {
    return subDocument; // nothing to save
  }
  subDocument.set(data);
  await document.save();
  return subDocument;
}

async function updateSubDocumentArray(document, subDocument, data) {
  let nModified = 0;
  subDocument.forEach(item => {
    if (!isEqual(item._doc, { ...item._doc, ...data })) {
      item.set(data);
      nModified++;
    }
  });
  if (nModified > 0) {
    await document.save();
  }
  return {
    n: subDocument.length,
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
  if (path[1] && path[1].id) {
    query.and([{ [`${path[0]}._id`]: path[1].id }]);
  }
  let fields = [];
  for (let index = 0; index < path.length; index+=2) {
    fields.push(path[index]);
  }
  let expression = '';
  for (let index = 0; index < fields.length; index++) {
    expression += `${expression ? ' ' : ''}+${fields.slice(0,index + 1).join('.')}`;
  }
  query.select(expression);
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
        throw new Error(httpErrors.badRequest);
      }
      break;
    case 'PUT':
      if (path[path.length - 1].id) {
        Object.values(data).forEach(value => {
          if (typeof value === 'string') {
            try {
              value = JSON.parse(value);
            } catch (error) {}
            if (Array.isArray(value)) {
              throw new Error(httpErrors.badRequest);
            }
          }
        });
      }
      break;
    default:
      break;
  }
}

module.exports = MongooseDataService;
