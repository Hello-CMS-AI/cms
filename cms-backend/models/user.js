const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  role: { type: String },
  language: { type: String },
  sendNotification: { type: Boolean },
});

// Pre-save hook to convert username to lowercase
userSchema.pre('save', function (next) {
  this.username = this.username.toLowerCase();
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
