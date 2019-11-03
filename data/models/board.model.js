const { model, Schema } = require('mongoose');
const imageSchema = require('../schemas/image.schema');
const postSchema = require('../schemas/post.schema');
const { setReadonlyMiddleware } = require('../services/dbUtils');
const { Validate } = require('../services/dbUtils');

const CREATED_BY = 'createdBy';
const IMAGES_COUNT_LIMIT = 4;

const boardSchema = new Schema(
  {
    _id: String, // URI of the board
    name: { type: String, required: true },
    location: {
      address: String,
      info: String,
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    // community: String, // same as members?
    description: String,
    [CREATED_BY]: { type: String, required: true, ref: 'User' },
    images: {
      type: [imageSchema],
      validate: Validate.maxCount(IMAGES_COUNT_LIMIT),
    },
    posts: { type: [postSchema], select: false },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

boardSchema.virtual('members', {
  ref: 'User',
  localField: '_id',
  foreignField: 'boards',
  options: { sort: { name: 1 } },
});

boardSchema.virtual('membersCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'boards',
  count: true, // only get the number of docs
});

setReadonlyMiddleware(boardSchema, CREATED_BY);

const Board = model('Board', boardSchema);

// Waits for model's indexes to finish
Board.on('index', function(err) {
  if (err) {
    throw new Error(err);
  }
});

module.exports = Board;
