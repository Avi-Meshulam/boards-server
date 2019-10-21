const { Schema } = require('mongoose');

const fileSchema = new Schema({
  // data: { type: Buffer, select: false },
  data: Buffer,
});

module.exports = fileSchema;
