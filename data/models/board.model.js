const { model, Schema } = require('mongoose');
const imageSchema = require('../schemas/image.schema');
const postSchema = require('../schemas/post.schema');
const { setReadonlyMiddleware } = require('../../dbUtils');

const CREATED_BY = 'createdBy';

const boardSchema = new Schema(
  {
    _id: String, // name of the board
    description: String,
    address: String,
    latLng: { type: { lat: Number, lng: Number }, required: true },
    [CREATED_BY]: { type: String, required: true }, // userId (nick name)
    image: [imageSchema],
    posts: { type: [postSchema], select: false },
  },
  { timestamps: true },
);

setReadonlyMiddleware(boardSchema, CREATED_BY);

const BoardModel = model('Board', boardSchema);

module.exports = BoardModel;
