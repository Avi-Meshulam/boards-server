const mongoose = require('mongoose');
const imageSchema = require('../schemas/image.schema');

const userSchema = new mongoose.Schema(
  {
    _id: String, // user's nick name
    name: String,
    email: { type: String, required: true },
    image: [imageSchema],
  },
  { timestamps: true },
);

userSchema.post('save', function(next) {
  if (this.isModified('_id')) {
    //TODO: Update userId in all DB
  }
  next();
});

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
