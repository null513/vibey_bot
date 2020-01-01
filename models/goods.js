const mongoose = require('mongoose')

const goodSchema = new mongoose.Schema({
	user: String,
	userPic: String,
	news: String,
})

module.exports = mongoose.model('goods', goodSchema)