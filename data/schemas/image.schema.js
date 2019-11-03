const { Schema } = require('mongoose');

const imageSchema = new Schema(
  {
    title: String,
    description: String,
    image: { type: Buffer, required: true, select: false },
  },
  { timestamps: true },
);

module.exports = imageSchema;
