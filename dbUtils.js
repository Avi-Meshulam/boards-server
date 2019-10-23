const httpErrors = require('./httpErrors');

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
      if (current[field] !== update[field]) {
        this.error(new Error(`field ${field} is read-only`));
      }
    });
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
  return JSON.stringify(removeTimestamp(obj1)) === JSON.stringify(removeTimestamp(obj2));
}

module.exports = {
  setReadonlyMiddleware,
  insertArrayItem,
  equals,
};
