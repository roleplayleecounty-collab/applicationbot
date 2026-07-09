const mongoose = require("mongoose");

const AppSchema = new mongoose.Schema({
userId: String,
answers: Object,
status: String,
channelId: String
});

module.exports = mongoose.model("applications", AppSchema);