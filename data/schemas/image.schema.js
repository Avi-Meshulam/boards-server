const { Schema } = require('mongoose');

const imageSchema = new Schema(
  {
    description: String,
    image: { type: Buffer, required: true, select: false },
  },
  { timestamps: true },
);

module.exports = imageSchema;
