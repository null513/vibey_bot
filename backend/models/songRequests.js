const mongoose = require("mongoose");

const srSchema = new mongoose.Schema({
  track: [
    {
      name: String,
      artist: String,
      link: String,
      uri: String
    }
  ],
  requestedBy: {
    type: String
  },
  timeOfReq: {
    type: String
  },
  source: {
    type: String
  },
  fulfilled: {
    type: Boolean,
    default: false
  },
  dateFulfilled: {
    type: String
  },
  lyrics: {
   type: String
  }
});

module.exports = mongoose.model("SongRequests", srSchema);
