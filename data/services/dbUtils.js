const mongoose = require('mongoose');
const { getDuplicates } = require('../../utils');
const { dbURI } = require('../../config/keys').mongodb;

function connectDB(dbName) {
  mongoose.connect(dbURI, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  });
  mongoose.connection.once('open', function() {
    console.log(`Successfully connected to MongoDB[${dbName}]`);
  });
  mongoose.connection.on(
    'error',
    console.error.bind(console, 'connection error:'),
  );
}

function setReadonlyMiddleware(schema, ...readOnlyFields) {
  schema.pre('findByIdAndUpdate', async function(next) {
    validate.call(this);
    next(this.error());
  });

  schema.pre('findOneAndUpdate', async function(next) {
    validate.call(this);
    next(this.error());
  });

  schema.pre('updateMany', async function(next) {
    const docsToUpdate = await this.model.find(this.getQuery());
    for (const doc of docsToUpdate) {
      validate.call(this, doc);
      if (this.error()) {
        break;
      }
    }
    next(this.error());
  });

  async function validate(doc) {
    const current = doc || (await this.model.findOne(this.getQuery()));
    const update = this.getUpdate();
    readOnlyFields.forEach(field => {
      if (update[field] && current[field] !== update[field]) {
        this.error(new Error(`field ${field} is read-only`));
      }
    });
  }
}

function clearBuffers(obj) {
  Object.entries(obj).forEach(([key, value]) => {
    if (value instanceof Buffer) {
      obj[key] = undefined;
    }
    if (
      value &&
      (value._doc ||
        (value.isMongooseDocumentArray && value.length > 0) ||
        value.constructor.name === 'EmbeddedDocument')
    ) {
      clearBuffers(value._doc || value);
    }
  });
  return obj;
}

const Validate = {
  unique: function(fieldName, model) {
    return {
      validator: async function(value) {
        if (!this.isNew) {
          return true;
        }
        if (typeof value === 'string') {
          value = value.toLowerCase();
        }
        const count = await this.model(model)
          .estimatedDocumentCount({ [fieldName]: value })
          .catch(err => err);
        return count <= 1; // If `count` is not zero, "invalidate"
      },
      message: props => `${props.value} already exists.`,
    };
  },
  get uniqueArrayItem() {
    let duplicates;
    return {
      validator: function(arr) {
        if (arr.length <= 1) {
          return true;
        }
        duplicates = getDuplicates(arr);
        return duplicates.length === 0;
      },
      message: function(props) {
        return `${duplicates} already exist(s).`;
      },
    };
  },
  maxCount: function(limit) {
    return [
      value => value.length <= limit,
      `{PATH} count exceeds the limit of ${limit}`,
    ];
  },
};

module.exports = {
  connectDB,
  clearBuffers,
  setReadonlyMiddleware,
  Validate,
};
