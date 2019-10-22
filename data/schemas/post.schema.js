const { Schema } = require('mongoose');
const imageSchema = require('./image.schema');
const commentSchema = require('./comment.schema');
const { setReadonlyMiddleware } = require('../../dbUtils');

const USER_ID = 'userId';

const postSchema = new Schema(
  {
    [USER_ID]: { type: String, required: true },
    title: { type: String, required: true },
    content: String,
    images: [imageSchema],
    comments: [commentSchema],
  },
  { timestamps: true },
);

setReadonlyMiddleware(postSchema, USER_ID);

module.exports = postSchema;
