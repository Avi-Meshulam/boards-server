const { Schema, model } = require('mongoose');
const { Validate } = require('../services/dbUtils');
const imageSchema = require('../schemas/image.schema');

const IMAGES_COUNT_LIMIT = 4;

const userSchema = new Schema(
  {
    _id: { type: String, lowercase: true }, // URI of the user
    googleId: {
      type: String,
      lowercase: true,
      // unique: true,
      validate: Validate.unique('googleId', 'User'),
    },
    name: { type: String, required: true },
    email: {
      type: String,
      lowercase: true,
      required: true,
      // unique: true,
      validate: Validate.unique('email', 'User'),
    },
    // password: { type: String, required: true },
    avatar: String,
    images: {
      type: [imageSchema],
      validate: Validate.maxCount(IMAGES_COUNT_LIMIT),
    },
    // id's of boards which the user is a member of
    boards: {
      type: [{ type: String, lowercase: true, ref: 'Board' }],
      validate: Validate.uniqueArrayItem,
    },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

// virtuals
userSchema.virtual('posts', {
  ref: 'Board',
  localField: '_id',
  foreignField: 'posts.userId',
  options: { sort: { createdAt: 1 } },
});

userSchema.virtual('postsCount', {
  ref: 'Board',
  localField: '_id',
  foreignField: 'posts.userId',
  count: true, // only get the number of docs
});

userSchema.virtual('liked', {
  ref: 'Board',
  localField: '_id',
  foreignField: 'posts.likes',
  options: { sort: { createdAt: 1 } },
});

// hooks
userSchema.post('save', function(doc) {
  if (this.isModified('_id')) {
    //TODO: Update userId across all DB
  }
});

// indexes
userSchema.index('email', { unique: true });
userSchema.index('googleId', { unique: true });

const User = model('User', userSchema);

// Waits for model's indexes to finish
User.on('index', function(err) {
  if (err) {
    throw new Error(err);
  }
});

module.exports = User;
