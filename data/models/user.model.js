const mongoose = require('mongoose');
const fileSchema = require('../schemas/file.schema');

const userSchema = new mongoose.Schema(
  {
    _id: String, // user's nick name
    name: String,
    email: { type: String, required: true },
    images: { type: [fileSchema], select: false },
  },
  { timestamps: true },
);

userSchema.post('save', function(next) { 
  if(this.isModified('_id')) {
    //TODO: Update userId in all DB
  }
  next();
});

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
