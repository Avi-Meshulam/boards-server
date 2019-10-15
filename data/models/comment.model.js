const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  _id: String,
  postId: { type: String, required: true },
  userId: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: new Date() }
}, { versionKey: false });

const CommentModel = mongoose.model('Comment', commentSchema);

module.exports = CommentModel;
