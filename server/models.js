const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const SlotSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, index: true },
  time: { type: String, required: true },
  order: { type: Number, required: true }
});

const HabitSegmentSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, index: true },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
  startDate: { type: String, required: true, index: true }, // YYYY-MM-DD
  endDate: { type: String, default: null } // YYYY-MM-DD or null
});

const HabitEntrySchema = new mongoose.Schema({
  deviceId: { type: String, required: true, index: true },
  segmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'HabitSegment', required: true },
  date: { type: String, required: true, index: true }, // YYYY-MM-DD
  completed: { type: Boolean, default: false }
});

// Composite index for quick entry lookups
HabitEntrySchema.index({ segmentId: 1, date: 1 }, { unique: true });

module.exports = {
  Device: mongoose.model('Device', DeviceSchema),
  Slot: mongoose.model('Slot', SlotSchema),
  HabitSegment: mongoose.model('HabitSegment', HabitSegmentSchema),
  HabitEntry: mongoose.model('HabitEntry', HabitEntrySchema)
};