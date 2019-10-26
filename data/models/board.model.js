const { model, Schema } = require('mongoose');
const User = require('./user.model');
const imageSchema = require('../schemas/image.schema');
const postSchema = require('../schemas/post.schema');
const { setReadonlyMiddleware } = require('../../dbUtils');
const { Validate } = require('../../dbUtils');

const CREATED_BY = 'createdBy';
const IMAGES_COUNT_LIMIT = 4;

const boardSchema = new Schema(
  {
    _id: String, // URI of the board
    name: { type: String, required: true, unique: true },
    description: String,
    address: String,
    latLng: { type: { lat: Number, lng: Number }, required: true },
    [CREATED_BY]: { type: String, required: true, ref: 'User' }, // User._id
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
  count: true // only get the number of docs
});

setReadonlyMiddleware(boardSchema, CREATED_BY);

const Board = model('Board', boardSchema);

module.exports = Board;
