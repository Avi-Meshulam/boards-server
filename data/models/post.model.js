const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  _id: String,
  boardId: { type: String, required: true },
  userId: { type: String, required: true },
  header: { type: String, required: true },
  text: String,
  createdAt: { type: Date, default: new Date() },
  image: String,
  imageData: Buffer
}, { versionKey: false });

const PostModel = mongoose.model('Post', postSchema);

module.exports = PostModel;
