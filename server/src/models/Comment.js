const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ['project', 'task'],
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content cannot be empty'],
      trim: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Comment', commentSchema);
