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

function clearBuffers(obj) {
  if (obj._doc) {
    Object.entries(obj._doc).forEach(([key, value]) => {
      if (value instanceof Buffer) {
        value = undefined;
      }
      if (typeof value === 'object' || Array.isArray(value)) {
        if (obj[key]) {
          clearBuffers(obj[key]);
        }
      }
    });
  }
  return obj;
}

const Validate = {
  unique: function(fieldName, model) {
    return {
      validator: async function(value) {
        if (!this.isNew) {
          return true;
        }
        const count = await this.model(model)
          .estimatedDocumentCount({ [fieldName]: value })
          .catch(err => err);
        return count === 0; // If `count` is not zero, "invalidate"
      },
      message: props => `${props.value} already exists.`,
    };
  },
  uniqueArrayItem: function(fieldName) {
    return {
      validator: function(arr) {
        return (
          this[fieldName].filter(value => value === arr[arr.length - 1])
            .length === 1
        );
      },
      message: props => `${props.value[props.value.length - 1]} already exists.`,
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
  clearBuffers,
  setReadonlyMiddleware,
  Validate,
};
