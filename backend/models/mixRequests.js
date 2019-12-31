const mongoose = require('mongoose')

const mixSchema = new mongoose.Schema ({
	track: [{
		name: String,
		artist: String,
		link: String,
		uri: String
	}],
	requestedBy: {
		type: String
	},
	timeOfReq: {
		type: Date
	},
	source: {
		type: String
	}
})

module.exports = mongoose.model('mixRequests', mixSchema)