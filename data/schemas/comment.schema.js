const { Schema } = require('mongoose');
const { setReadonlyMiddleware } = require('../../dbUtils');

const USER_ID = 'userId';

const commentSchema = new Schema(
  {
    [USER_ID]: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

setReadonlyMiddleware(commentSchema, USER_ID);

module.exports = commentSchema;
