const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: String,
  name: { type: String, required: true },
  email: { type: String, required: true },
  joinDate: { type: Date, default: new Date() },
  image: String,
  imageData: Buffer,
}, { versionKey: false });

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
