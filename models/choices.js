const mongoose = require('mongoose')

const choiceSchema = new mongoose.Schema({
	id: String,
	choiceText: String,
	votes: {
		type: Number,
		default: 0
	}
})

module.exports = mongoose.model('choices', choiceSchema)