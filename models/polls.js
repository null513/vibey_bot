const mongoose = require('mongoose')

const pollSchema = new mongoose.Schema({
	active: {
		type: Boolean,
		default: true
	},
	polltext: String,
	choices: Array,
	voters: {
		type: Array,
		default: []
	},
	winner: String
})

module.exports = mongoose.model('polls', pollSchema)