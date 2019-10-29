const { Schema, model } = require('mongoose');
const imageSchema = require('../schemas/image.schema');
const { Validate } = require('../../dbUtils');

const IMAGES_COUNT_LIMIT = 4;

const userSchema = new Schema(
  {
    _id: String, // URI of the user
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true, // Sets an index. Not a validator!
      validate: Validate.unique('email', 'User'),
    },
    avatar: { type: imageSchema, default: () => ({}) },
    images: {
      type: [imageSchema],
      validate: Validate.maxCount(IMAGES_COUNT_LIMIT),
    },
    // id's of boards which the user is a member of
    boards: {
      type: [{ type: String, ref: 'Board' }],
      validate: Validate.uniqueArrayItem,
    },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

userSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'userId',
  options: { sort: { createdAt: -1 } },
});

userSchema.virtual('postsCount', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'userId',
  count: true, // only get the number of docs
});

userSchema.post('save', function(doc) {
  if (this.isModified('_id')) {
    //TODO: Update userId across all DB
  }
});

const User = model('User', userSchema);

// User.createIndexes({ "email": 1 }, { unique: true });

// Waits for model's indexes to finish
User.on('index', function(err) {
  if (err) {
    throw new Error(err);
  }
});

module.exports = User;
