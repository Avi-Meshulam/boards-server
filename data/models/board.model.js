const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  _id: String,
  name: { type: String, required: true },
  description: String,
  address: String,
  latLng: { type: { lat: Number, lng: Number }, required: true },
  createdAt: { type: Date, default: new Date() },
  creatorId: {type: String, required: true },
  image: String,
  imageData: Buffer,
}, { versionKey: false });

const BoardModel = mongoose.model('Board', boardSchema);

module.exports = BoardModel;
