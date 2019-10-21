const { Schema } = require('mongoose');

const USER_ID = 'userId';

const commentSchema = new Schema(
  {
    [USER_ID]: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

commentSchema.pre('save', function(next) {
  if (this.isModified(USER_ID)) {
    throw new Error(`field ${USER_ID} is read-only`);
  }
  next();
});

module.exports = commentSchema;
