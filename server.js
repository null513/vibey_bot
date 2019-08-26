const config = require('./config/config');

const express = require('express')
const app = express()
const server = require('http').Server(app)
const logger = require('morgan')
const passport = require('passport')
const twitchStrategy = require('passport-twitch-new').Strategy
const bodyParser = require('body-parser')
const cookieSession = require('cookie-session')
const spotifyUri = require('spotify-uri');
const Spotify = require('node-spotify-api');
const YouTube = require('simple-youtube-api');
const youtube = new YouTube(config.ytAPI);
const moment = require('moment');
const Pusher = require('pusher');

// Real time data
var channels_client = new Pusher({
  appId: '826343',
  key: '94254303a6a5048bf191',
  secret: '66b39f01edb0769876cf',
  cluster: 'us2',
  useTLS: true
});

//Spotify Credentials
const spotify = new Spotify({
  id: config.spID,
  secret: config.spSecret
});

app.set('trust proxy', 1)
app.set('views', './views')
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(logger('dev'));

app.use(bodyParser.urlencoded({ extended: true}));
app.use(cookieSession({ secret: `${config.sessionSecret}`, saveUninitialized: false, resave: false}));
app.use(passport.initialize());

// Databae
const mongoose = require('mongoose')
mongoose.connect(config.databaseURI, {useNewUrlParser: true}).catch(function (reason) {
	// TODO: Throw error page if DB doesn't connect
	console.log('Unable to connect to the mongodb instance. Error: ', reason);
});

const db = mongoose.connection
db.on('error', error => console.error(error))
db.once('open', () => console.log('Connected to Mongoose ' + Date()))

// Twitch auth
const User = require('./models/users')
passport.use(new twitchStrategy({
	clientID: config.twitchClientID,
	clientSecret: config.twitchSecret,
	callbackURL: `${config.appURL}/auth/twitch/callback`,
	scope: "user:read:email"
},
async function(accessToken, refreshToken, profile, done) {
	try {
		User.findOne({ twitch_id: profile.id }).exec()
		.then(function(UserSearch){
			if (UserSearch === null) {
				let user = new User ({
					twitch_id: profile.id,
					username: profile.login,
					display_name: profile.display_name,
					email: profile.email,
					profile_pic_url: profile.profile_image_url,
					provider: 'twitch',
					twitch: profile
				})
				console.log('New user created')
				user.save();
				return done(null, profile)
			} else {
				console.log('User already exists')
				console.log(UserSearch.twitch_id)
				return done(null, profile)
			}
		})
	} catch (err) {
		console.error(err)
	}
}
));

passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

app.get("/auth/twitch", passport.authenticate("twitch"));
app.get("/auth/twitch/callback", passport.authenticate("twitch", { failureRedirect: "/fail" }), function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/dashboard");
});

// Front page
app.get('/', (req, res, next) => {
		res.render('index')
		next();
})
	
// Logout
app.get('/logout', function (req, res){
	req.logout();
	console.log(req.session.passport.user)
  res.redirect('/');
});

//Dashboard
const mixReqs = require('./models/mixRequests')
app.get('/dashboard', async (req, res) => {
	try {
		var user = await User.findOne({ twitch_id: req.session.passport.user.id });
		console.log(user.username)
			var admins = config.admins;
			var feSongRequests = await SongRequest.find();
			var mixRequests = await mixReqs.find();
			if (admins.includes(user.username)) {
				res.render('dashboard', {
					feUser: user.username,
					requests: feSongRequests,
					mixReqs: mixRequests
				})
			} else {
				res.redirect('/login');
			}
	} catch (err) {
		console.error(err)
	}
});

// Stream Widget
app.get('/widget', async (req, res) => {
		var mixRequests = await mixReqs.find();
		res.render('widget',{
			mixReqs: mixRequests
		})
});

app.get('/dashboard/delete/:id', async(req, res) => {
	if (req.session && req.session.passport.user) {
		try {
			await SongRequest.deleteOne({ _id: req.params.id}).exec();
			res.status(200).send('Request deleted')
		} catch (err) {
			console.error(err)
			res.status(500).send('Error deleting song request')
		}
	} else {
		res.redirect('/index')
	}
});

app.get('/dashboard/mix/deleteall', async (req, res) => {
	if (req.session && req.session.passport.user) {
		try {
			await mixReqs.deleteMany({}).exec();
			channels_client.trigger('sr-channel', 'clear-mix', {});
			res.status(200).send('Mix cleared')
		} catch (err) {
			res.status(500).send('Error clearing mix!')
			console.error(err)
		}
			
	} else {
		res.redirect('/index')
	}
});

app.get('/dashboard/deleteall', (req, res) => {
	if (req.session && req.session.passport.user) {
		try {
			SongRequest.deleteMany({}).exec();
			res.status(200).send('Queue cleared')
		} catch (err) {
			res.status(500).send('Error clearing queue!')
			console.error(err)
		}
			
	} else {
		res.redirect('/index')
	}
});

app.get('/mix/add/:id', async(req, res) => {
	if (req.session && req.session.passport.user) {
			await SongRequest.findById(req.params.id, (err, request) => {
				var mixAdd = new mixReqs ({track:{name: request.track[0].name, artist: request.track[0].artist, link: request.track[0].link, uri: request.track[0].uri}, requestedBy: request.requestedBy, timeOfReq: request.timeOfReq, source: request.source})
				mixAdd.save().then((doc) => {
					try {
						res.status(200).send('Added to Mix');
						channels_client.trigger('sr-channel', 'mix-event', {
							"id": `${doc.id}`,
							"reqBy": `${doc.requestedBy}`,
							"track": `${doc.track[0].name}`,
							"artist": `${doc.track[0].artist}`,
							"uri": `${doc.track[0].uri}`,
							"link": `${doc.track[0].link}`,
							"source": `${doc.source}`
						});
					} catch (err) {
						console.error(err)
						res.status(500).send('Error Adding song to mix')
					};
				});
			});
	} else {
		res.redirect('/index')
	}
});

app.get('/mix/remove/:id', async(req, res) => {
	if (req.session && req.session.passport.user) {
		try {
			await mixReqs.deleteOne({ _id: req.params.id}).exec();
			channels_client.trigger('sr-channel', 'mix-remove', {
				"id":`${req.params.id}`
			});
			res.status(200).send('Song Removed from mix')
		} catch (err) {
			console.error(err)
			res.status(500).send('Error removing song from mix')
		}
	} else {
		res.redirect('/index')
	}
});

// Twitch Client
const tmi = require("tmi.js");
const twitchclientid = config.twitchClientID;
const twitchuser = config.twitchUser;
const twitchpass = config.twitchPass;
const twitchchan = config.twitchChan;

const tmiOptions = {
    options: {
        debug: true,
        clientId: twitchclientid
    },
    connection: {
        reconnect: true
    },
    identity: {
        username: twitchuser,
        password: twitchpass
    },
    channels: twitchchan,
};

const botclient = new tmi.client(tmiOptions);

// Connect the twitch chat client to the server..
botclient.connect();

// Bot says hello on connect
// botclient.on('connected', (address, port) => {
//   botclient.say(twitchchan[0], `Hey Chat! Send me those vibes`)
// });

// Regex
var URLRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
var spRegex = /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-){22})/;
var ytRegex = /(?:https?:\/\/)?(?:(?:(?:www\.?)?youtube\.com(?:\/(?:(?:watch\?.*?(v=[^&\s]+).*)|(?:v(\/.*))|(channel\/.+)|(?:user\/(.+))|(?:results\?(search_query=.+))))?)|(?:youtu\.be(\/.*)?))/;

// Song Requests
const SongRequest = require('./models/songRequests')
botclient.on('chat', (channel, userstate, message, self) => {
	if (self) return;
	var message = message.trim().split(" ");
	if (message[0] === '!sr' || message[0] === '!songrequest') {
		if (URLRegex.test(message[1])) {
			if (spRegex.test(message[1])) {
				var spID = spotifyUri.parse(message[1])
				var spURI = spotifyUri.formatURI(message[1])
				spotify
					.request(`https://api.spotify.com/v1/tracks/${spID.id}`)
					.then(function(data) {
						var newSpotSR = new SongRequest ({track:{name: data.name, artist: data.artists[0].name, link: message[1], uri: spURI}, requestedBy: userstate.username, timeOfReq: moment.utc(), source: 'spotify'});
						newSpotSR.save()
							.then((doc) => {
								botclient.say(channel, `@${doc.requestedBy} requested ${doc.track[0].name} by ${doc.track[0].artist}`);
								// Real time data push to front end
								channels_client.trigger('sr-channel', 'sr-event', {
									"id": `${doc.id}`,
									"reqBy": `${doc.requestedBy}`,
									"track": `${doc.track[0].name}`,
									"artist": `${doc.track[0].artist}`,
									"uri": `${doc.track[0].uri}`,
									"link": `${doc.track[0].link}`,
									"source": `${doc.source}`
								});
							})
							.catch(err => {console.error(err)});
					})
					.catch(function(err) {
						console.error('Error occurred: ' + err); 
					});
				
			}

			if (ytRegex.test(message[1])) {
				youtube.getVideo(message[1])
					.then(video => {
						var newYTSR = new SongRequest ({track:{name: video.title, link: message[1]}, requestedBy: userstate.username, timeOfReq: moment.utc(), source: 'youtube'});
						newYTSR.save()
							.then((doc) => {botclient.say(channel, `@${doc.requestedBy} requested ${doc.track[0].name}`);
								// Real time data push to front end
								channels_client.trigger('sr-channel', 'sr-event', {
									"id": `${doc.id}`,
									"reqBy": `${doc.requestedBy}`,
									"track": `${doc.track[0].name}`,
									"link": `${doc.track[0].link}`,
									"source": `${doc.source}`
								});
							})
							.catch(err => {console.error(err)});
					});
			}
		};
			// Searches YouTube when no URL is provided
			var query = message.slice(1).join(" ")
			youtube.search(query, 1)
				.then(results => {
					var newYTSR = new SongRequest ({track:{name: results[0].title, link: `https://www.youtube.com/watch?v=${results[0].id}`}, requestedBy: userstate.username, timeOfReq: moment.utc(), source: 'youtube'});
						newYTSR.save()
							.then((doc) => {botclient.say(channel, `@${doc.requestedBy} requested ${doc.track[0].name}`);
								// Real time data push to front end
								channels_client.trigger('sr-channel', 'sr-event', {
									"id": `${doc.id}`,
									"reqBy": `${doc.requestedBy}`,
									"track": `${doc.track[0].name}`,
									"link": `${doc.track[0].link}`,
									"source": `${doc.source}`
								});
							})
							.catch(err => {console.error(err)});
				})
				.catch(console.error)
	}

	// if (message[0] === '!whosthechillest') {
	// 	botclient.say(twitchchan[0])
	// }
})


server.listen(3000)