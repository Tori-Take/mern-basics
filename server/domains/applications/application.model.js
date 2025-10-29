const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  permissionKey: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
}, { timestamps: true });

const Application = mongoose.model('Application', applicationSchema);

module.exports = { Application };
