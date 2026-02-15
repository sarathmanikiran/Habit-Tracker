require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Device, Slot, HabitSegment, HabitEntry } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/habitintel';

app.use(cors());
app.use(express.json());

// Connect DB
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// --- HELPERS ---
const getPreviousDate = (dateStr) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

// --- ROUTES ---

// 1. Device
app.post('/api/device/create', async (req, res) => {
  try {
    const { deviceId, username } = req.body;
    let device = await Device.findOne({ deviceId });
    if (!device) {
      device = await Device.create({ deviceId, username });
    }
    res.json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/device/:deviceId', async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.deviceId });
    res.json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Slots
app.get('/api/slots/:deviceId', async (req, res) => {
  try {
    const slots = await Slot.find({ deviceId: req.params.deviceId }).sort('order');
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/slots', async (req, res) => {
  try {
    const { deviceId, time, order } = req.body;
    const slot = await Slot.create({ deviceId, time, order });
    res.json(slot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/slots/reorder', async (req, res) => {
  try {
    const { slots } = req.body;
    // Batch update orders
    const ops = slots.map((s, idx) => ({
      updateOne: {
        filter: { _id: s._id },
        update: { order: idx }
      }
    }));
    await Slot.bulkWrite(ops);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/slots/:id', async (req, res) => {
    try {
        await Slot.findByIdAndDelete(req.params.id);
        // Clean up segments and entries related to this slot
        const segments = await HabitSegment.find({ slotId: req.params.id });
        const segmentIds = segments.map(s => s._id);
        await HabitSegment.deleteMany({ slotId: req.params.id });
        await HabitEntry.deleteMany({ segmentId: { $in: segmentIds }});
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Segments
app.get('/api/segments/:deviceId', async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    
    // Calculate accurate end of month
    const [year, mon] = month.split('-').map(Number);
    const daysInMonth = new Date(year, mon, 0).getDate();
    
    const startOfMonth = `${month}-01`;
    const endOfMonth = `${month}-${daysInMonth}`;

    // Find segments that overlap with this month
    // Created BEFORE end of month AND (Ended AFTER start of month OR No End Date)
    const segments = await HabitSegment.find({
      deviceId: req.params.deviceId,
      startDate: { $lte: endOfMonth },
      $or: [
        { endDate: { $gte: startOfMonth } },
        { endDate: null }
      ]
    });
    res.json(segments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/segments', async (req, res) => {
  try {
    const { deviceId, slotId, name, color, startDate } = req.body;
    
    // Logic: Find current active segment for this slot and close it
    // "Closing" means setting endDate = new startDate - 1 day
    const existing = await HabitSegment.findOne({
      deviceId,
      slotId,
      endDate: null // Currently active
    });

    if (existing) {
        // Simple date math to subtract 1 day from startDate string
        const d = new Date(startDate);
        d.setDate(d.getDate() - 1);
        const prevEndDate = d.toISOString().split('T')[0];
        
        // Only update if new start date is after existing start date
        if (new Date(startDate) > new Date(existing.startDate)) {
             existing.endDate = prevEndDate;
             await existing.save();
        }
    }

    const segment = await HabitSegment.create({
      deviceId, slotId, name, color, startDate, streak: 0, lastCompletedDate: null
    });
    res.json(segment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/segments/:id', async (req, res) => {
  try {
    const { name, color } = req.body;
    const segment = await HabitSegment.findByIdAndUpdate(
      req.params.id, 
      { name, color },
      { new: true }
    );
    res.json(segment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/segments/:id', async (req, res) => {
  try {
    await HabitSegment.findByIdAndDelete(req.params.id);
    await HabitEntry.deleteMany({ segmentId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Entries
app.get('/api/entries/:deviceId', async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    // Basic string match for the date field
    const entries = await HabitEntry.find({
      deviceId: req.params.deviceId,
      date: { $regex: `^${month}` }
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/entries/toggle', async (req, res) => {
  try {
    const { deviceId, segmentId, date, completed } = req.body;
    
    // Upsert entry
    const entry = await HabitEntry.findOneAndUpdate(
      { deviceId, segmentId, date },
      { completed },
      { new: true, upsert: true }
    );

    // Recalculate Streak
    // 1. Fetch all completed entries for this segment, sorted desc
    const completedEntries = await HabitEntry.find({ 
      segmentId, 
      completed: true 
    }).sort({ date: -1 });

    let streak = 0;
    let lastCompletedDate = null;

    if (completedEntries.length > 0) {
      lastCompletedDate = completedEntries[0].date;
      streak = 1;
      let currentDate = lastCompletedDate;
      
      for (let i = 1; i < completedEntries.length; i++) {
        const prevDate = getPreviousDate(currentDate);
        if (completedEntries[i].date === prevDate) {
          streak++;
          currentDate = prevDate;
        } else {
          break;
        }
      }
    }

    // Update Segment
    await HabitSegment.findByIdAndUpdate(segmentId, { streak, lastCompletedDate });

    res.json({ entry, streak, lastCompletedDate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));