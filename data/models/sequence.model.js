const mongoose = require('mongoose');

const sequenceSchema = new mongoose.Schema({
  _id: String,
  value: { type: Number, required: true }
}, { versionKey: false });

const SequenceModel = mongoose.model('Sequence', sequenceSchema);

module.exports = SequenceModel;
