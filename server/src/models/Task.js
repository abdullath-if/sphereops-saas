const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'review', 'completed'],
      default: 'todo',
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
    },
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FileRecord',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Task', taskSchema);
