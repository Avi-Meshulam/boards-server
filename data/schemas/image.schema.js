const { Schema } = require('mongoose');

const imageSchema = new Schema(
  {
    image: { type: Buffer, required: true, select: false },
  },
  { timestamps: true },
);

module.exports = imageSchema;
