const mongoose = require('mongoose')

const userSchema = new mongoose.Schema ({
	twitch_id: {
		type: Number,
		required: true
	},
    username: {
	  type: String,
	  required: true
	},
	display_name: {
		type: String,
		required: true
	},
    email: {
    	type: String,
      required: true
	},
	profile_pic_url: {
		type: String
	},
	provider: {
		type: String
	},
	twitch: {
		type: JSON
	},
	is_admin: {
		type: Boolean,
		default: false
	},
	accessToken: String,
	refreshToken: String,
	expireAt: { type: Date, default: undefined }
})

userSchema.index({ "expireAt": 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Users', userSchema)