const mongoose = require('mongoose');

const topCollectorsSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  display_name: { type: String, required: true },
  count: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now }
});

const TopCollector = mongoose.model('TopCollector', topCollectorsSchema);
module.exports = TopCollector;
