const { Schema } = require('mongoose');
const imageSchema = require('./image.schema');
const commentSchema = require('./comment.schema');

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

postSchema.pre('save', function(next) {
  if (this.isModified(USER_ID)) {
    throw new Error(`field ${USER_ID} is read-only`);
  }
  next();
});

module.exports = postSchema;
