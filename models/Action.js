const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    point: Object,
    user: String,
    create_at: Date
}, {
    collection: 'actions'
});

module.exports = mongoose.models.Action || mongoose.model('Action', schema);
