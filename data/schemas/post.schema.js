const { Schema } = require('mongoose');
const imageSchema = require('./image.schema');
const postCategorySchema = require('../models/postCategory.model');
const { setReadonlyMiddleware } = require('../services/dbUtils');
const { Validate } = require('../services/dbUtils');

const USER_ID = 'userId';
const IMAGES_COUNT_LIMIT = 4;

const commentSchema = new Schema(
  {
    [USER_ID]: { type: String, required: true, ref: 'User' },
    body: String,
    images: {
      type: [imageSchema],
      validate: Validate.maxCount(IMAGES_COUNT_LIMIT),
    },
    likes: [{ type: String, ref: 'User' }], // Id's of users who liked the post
  },
  { timestamps: true },
);

// middleware
setReadonlyMiddleware(commentSchema, USER_ID);

commentSchema.add({ comments: [commentSchema] });

commentSchema
  .path('comments')
  .discriminator('Comment', new Schema({ comments: [commentSchema] }));

const postSchema = commentSchema.clone();

postSchema.add({
  title: { type: String, required: true },
  category: { type: String, enum: ['General'], /*required: true*/ },
});

module.exports = postSchema;
