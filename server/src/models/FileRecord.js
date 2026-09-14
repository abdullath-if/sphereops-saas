const mongoose = require('mongoose');

const fileRecordSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    relatedTo: {
      entityType: {
        type: String,
        enum: ['project', 'task', 'employee', 'general'],
        default: 'general',
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FileRecord', fileRecordSchema);
