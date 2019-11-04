const mongoose = require('mongoose');
const DocUtils = require('./DocUtils');
const IDataService = require('./IDataService');
const QueryProxy = require('./QueryProxy');
const { clearBuffers } = require('./dbUtils');

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
    return this._model.find(filter, options).exec();
  }

  async getById(id) {
    return this._model.findById(id).exec();
  }

  async getSubDocument(ownerId, pathHierarchy, filter, options) {
    let [, subDocument, targetElement] = await getSubDocumentHelper(
      this._model,
      ownerId,
      pathHierarchy,
      true,
    );
    if (targetElement) {
      // => an array item
      subDocument = subDocument.find(item => item._id === targetElement);
    } else {
      DocUtils.filter(subDocument, filter);
      DocUtils.applyOptions(subDocument, options);
    }
    return subDocument;
  }

  async insert(data) {
    const result = await this._model.create(data);
    // TODO: check which return option is faster (both work)
    return this.getById(result._id);
    // return clearBuffers(result._doc);
  }

  // insert data to a subDocument array
  async insertSubDocument(ownerId, pathHierarchy, data) {
    let [document, subDocument] = await getSubDocumentHelper(
      this._model,
      ownerId,
      pathHierarchy,
    );

    const result = DocUtils.insert(subDocument, data);
    await document.save();
    // TODO: check which return option is faster (both work)
    return clearBuffers(result._doc);
    // return this.getSubDocument(ownerId, [...pathHierarchy, result.id]);
  }

  async update(filter, data) {
    return this._model.updateMany(filter, data, { timestamps: false }).exec();
  }

  async updateById(id, data) {
    return this._model
      .findByIdAndUpdate(id, data, { timestamps: false, new: true })
      .exec();
  }

  async updateSubDocument(ownerId, pathHierarchy, filter, data) {
    const [document, subDocument, targetElement] = await getSubDocumentHelper(
      this._model,
      ownerId,
      pathHierarchy,
    );

    const result = DocUtils.update(subDocument, filter, data, targetElement);
    if (subDocument.isMongooseArray) {
      document.markModified(subDocument.$path());
    }
    await document.save();
    return result;
  }

  async remove(filter) {
    return this._model.deleteMany(filter).exec();
  }

  async removeById(id) {
    await this._model.findByIdAndRemove(id).exec();
    return true;
  }

  async removeSubDocument(ownerId, pathHierarchy, filter) {
    const [document, subDocument, targetElement] = await getSubDocumentHelper(
      this._model,
      ownerId,
      pathHierarchy,
    );

    const result = DocUtils.remove(subDocument, filter, targetElement);
    await document.save();
    return result;
  }
}

// *** helper functions *** //

async function getSubDocumentHelper(
  model,
  ownerId,
  pathHierarchy,
  isGet = false,
) {
  const queryProxy = new QueryProxy(
    model.findById(ownerId),
    pathHierarchy,
    isGet,
  );
  const document = await queryProxy.exec().catch(err => {
    console.error(err);
    throw httpErrors.badRequest;
  });
  if (!document) {
    return [, ,];
  }
  const subDocument = DocUtils.extract(document, pathHierarchy);
  return [document, subDocument, queryProxy.targetElement];
}

module.exports = MongooseDataService;
