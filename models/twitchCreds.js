const mongoose = require('mongoose')

const twitchCredsSchema = new mongoose.Schema({
	accessToken: String,
	refreshToken: String,
	expireAt: { type: Date, default: undefined }	
})

twitchCredsSchema.index({ "expireAt": 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('twitchCreds', twitchCredsSchema)