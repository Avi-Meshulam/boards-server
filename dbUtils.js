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

module.exports = {
  setReadonlyMiddleware,
};
