const { model, Schema } = require('mongoose');
const fileSchema = require('../schemas/file.schema');
const postSchema = require('../schemas/post.schema');

const CREATED_BY = 'createdBy';

const boardSchema = new Schema(
  {
    _id: String, // name of the board
    description: String,
    address: String,
    latLng: { type: { lat: Number, lng: Number }, required: true },
    [CREATED_BY]: { type: String, required: true }, // userId (nick name)
    images: { type: [fileSchema], select: false },
    posts: { type: [postSchema], select: false },
  },
  { timestamps: true },
);

boardSchema.pre('findByIdAndUpdate', async function(next) {
  validate.call(this);
  next(this.error());
});

boardSchema.pre('findOneAndUpdate', async function(next) {
  validate.call(this);
  next(this.error());
});

boardSchema.pre('updateMany', async function(next) {
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
  if (current[CREATED_BY] !== update[CREATED_BY]) {
    this.error(new Error(`field ${CREATED_BY} is read-only`));
  }
}

const BoardModel = model('Board', boardSchema);

module.exports = BoardModel;
