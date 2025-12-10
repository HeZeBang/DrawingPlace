const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    x: Number,
    y: Number,
    w: Number,
    h: Number,
    c: String,
    user: String,
    create_at: Date,
    update_at: Date
}, {
    collection: 'points'
});

module.exports = mongoose.models.Point || mongoose.model('Point', schema);
