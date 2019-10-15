const mongoose = require('mongoose');
const IDataService = require('./IDataService');
const SequenceModel = require('../models/sequence.model');

const DB_NAME = 'boards';
const DB_URL = process.env.MONGODB_URI || `mongodb://localhost:27017/${DB_NAME}`;

// connect and configure db
mongoose.connect(DB_URL, { useNewUrlParser: true });
mongoose.connection.once('open', function () {
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

  async get(filter = {}, options = undefined) {
    const query = this._model.find(filter);
    applyOptions(query, options);
    const result = await query.exec();
    return result;
  }

  async getById(id, options = undefined) {
    const query = this._model.findOne({ _id: id });
    applyOptions(query, options);
    const result = await query.exec();
    return result;
  }

  async insert(data) {
    while (true) {
      const _id = await this.getNextId();
      let result;
      try {
        result = await this._model.create({ _id, ...data });
      } catch (error) {
        if (error.code == 11000 /* dup key */) {
          continue; // try again with a new id
        } else {
          throw error;
        }
      }
      return result._doc;
    }
  }

  async update(filter, data) {
    const result = await this._model.findOneAndUpdate(filter, data, { new: true }).exec();
    return result._doc;
  }

  async updateById(id, data) {
    const result = await this._model.findByIdAndUpdate(id, data, { new: true }).exec();
    return result._doc;
  }

  async remove(filter) {
    await this._model.findOneAndRemove(filter).exec();
    return true;
  }

  async removeById(id) {
    await this._model.findByIdAndRemove(id).exec();
    return true;
  }

  async getNextId() {
    const result = await SequenceModel.findByIdAndUpdate(
      this._model.modelName,
      { $inc: { value: 1 } },
      {
        new: true,
        upsert: true
      }
    ).exec();
    return result.value;
  }

  async getImageData(imageName) {
    const result = await this._model.findOne({ image: imageName })
      .select({ imageData: 1 }).exec();
    return result && result._doc.imageData;
  }
}

// *** helper functions *** //
function applyOptions(query, options) {
  if (!options) {
    return query;
  }
  if (options.projection) {
    query.select(options.projection);
  }
  if (options.sort) {
    query.sort(options.sort);
  }
  return query;
}

module.exports = MongooseDataService;
