const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationType: {
      type: String,
      enum: ['direct', 'project'],
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Message cannot be empty'],
      trim: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Message', messageSchema);
