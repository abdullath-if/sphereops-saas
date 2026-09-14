const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    client: {
      type: String,
      default: '',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'on_hold', 'completed'],
      default: 'planning',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project manager is required'],
      index: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    budget: {
      type: Number,
      default: 0,
    },
    technologies: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Project', projectSchema);
