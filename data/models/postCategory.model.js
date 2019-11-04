const { Schema, model } = require('mongoose');

const postCategorySchema = new Schema(
  {
    _id: { type: String, lowercase: true }, // category's name
    description: String,
  },
  { /*timestamps: true,*/ toJSON: { virtuals: true } },
);

postCategorySchema.virtual('posts', {
  ref: 'Board',
  localField: '_id',
  foreignField: 'posts.category',
  options: { sort: { createdAt: 1 } },
});

const PostCategory = model('PostCategory', postCategorySchema);

module.exports = {
  PostCategory,
  postCategorySchema,
};
