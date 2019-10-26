const { Schema, model } = require('mongoose');
const Board = require('./board.model');
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
    avatar: imageSchema,
    images: {
      type: [imageSchema],
      validate: Validate.maxCount(IMAGES_COUNT_LIMIT),
    },
    boards: {
      type: [{ type: String, ref: Board }],
      validate: Validate.uniqueArrayItem('boards') /*, autopopulate: true*/,
    }, // id's of boards which the user is a member of
    // posts: [{ type: Schema.Types.ObjectId, ref: Post }], //  id's of posts written by the user
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

// schema.plugin(require('mongoose-autopopulate'));

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

// userSchema.virtual('boards', {
//   ref: 'Board',
//   localField: 'boards._id',
//   foreignField: '_id',
//   options: { sort: { name: 1 } },
// });

// userSchema.virtual('boardsCount', {
//   ref: 'Board',
//   localField: 'boards._id',
//   foreignField: '_id',
//   count: true // only get the number of docs
// });

userSchema.post('save', function(doc) {
  if (this.isModified('_id')) {
    //TODO: Update userId across all DB
  }
});

const User = model('User', userSchema);

// User.createIndexes({ "email": 1 }, { unique: true });

module.exports = User;
