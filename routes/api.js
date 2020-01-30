const router = require('express').Router();
const mixReqs = require('../models/mixRequests');
const Poll = require('../models/polls');
const User = require('../models/users');
const config = require('../config/config')
const twitchchan = config.twitchChan;
const pollsIO = io.of('/polls-namescape');
const redis = require('../utils/redis-export')

function loggedIn(req, res, next) {
	if (!req.user) {
		res.redirect('/login');
	} else {
		next();
	}
}

router.get('/polls', loggedIn, async (req, res) => {
	redis.exists(`Channel:#${req.user.username}`,
		(err, reply) => {
			if (err) {
				console.error(err)
				return
			}
			console.log(reply)
		})

	// try {
	// 	let polls = await Poll.find();
	// 	res.send(polls).status(200);
	// } catch (err) {
	// 	res.send('error').send(500)
	// 	console.error(err);
	// 	errTxt(err);
	// }
});

router.post('/polls/newpoll', loggedIn, async (req, res) => {
	try {
		// Find active poll
		redis.hexists(`Channel:${config.twitchChan}`, 'activePoll', (err, reply) => {
			if (err) {
				console.error(err)
				return
			}
			console.log('Active poll? ', reply)

			if (reply === 0) {
				// Make unique pollID
				let pollID = makeid(20)

				// Create or add PollID to Poll archive list for that channel
				redis.sadd(
					`Channel:${config.twitchChan}:Polls`,
					`${pollID}`,
					(err, reply) => {
						if (err) {
							console.error(err)
							return
						}
						if (reply === 0) {
							res.status(500).sendStatus('Error Creating Poll')
						}
					}
				)

				// Pull data from poll form
				let pollText = req.body['formData'][0].value;
				let choices = req.body['formData'].slice(1);
				let multiVote = req.body['multipleVotes'];
				let choiceArray = []

				// Add 'activePoll' field to channel hash
				redis.hset(`Channel:${config.twitchChan}`, 'activePoll',
					`${pollID}`, redis.print)

				// Create Poll list
				redis.rpush(
					`Channel:${config.twitchChan}:Poll:${pollID}`,
					'Poll Text',
					`${pollText}`,
					'Multiple Votes?',
					`${multiVote}`,
					'Winner:',
					'',
					'Vote Count:',
					'0',
				)

				// Add each choice to poll list
				choices.forEach((choice) => {
					let choiceID = makeid(10)

					let pollListArg = [
						`Channel:${config.twitchChan}:Poll:${pollID}`,
						// Unique ID to use on front End
						`${choice.name}:`,
						`${choiceID}`,
						`${choice.value}`,
						`votes:`,
						`0`
					]
					redis.rpush(pollListArg, (err, reply) => {
						if (err) {
							console.error(err)
						}
						console.log('Add choice to poll list', reply)
					})

					// Add to choice Array for Front End
					let choiceFE = {
						id: choiceID,
						text: choice.value,
						votes: 0
					}
					choiceArray.push(choiceFE)
				});
				let pollDoc = {
					_id: pollID,
					active: true,
					polltext: pollText,
					choices: choiceArray,
				}
				res.send(pollDoc)
				// Let chat know new poll is open
				botclient.say(
					twitchchan[0],
					'A new poll has started! Vote with the # of the choice you would like to win!'
				)
				botclient.say(twitchchan[0], `The poll is: ${pollText}`);
				choices.forEach(chatChoices)
				function chatChoices(choice, index) {
					let choiceNum = index + 1
					botclient.say(
						twitchchan[0],
						`${choiceNum} = ${choice.value}`
					)
				}
			} else {
				res.status(418).send('Poll Already Running!')
				console.log('Poll Already running')
			}
		})
	} catch (err) {
		res.status(500).send('Error creating poll')
		console.error(err);
		errTxt(err);
	}
});

// Song Poll
router.get('/createSongpoll', loggedIn, async (req, res) => {
	try {
		let poll = await Poll.find({ active: true });
		let mix = await mixReqs.find({});
		if (poll.length === 0) {
			let pollText = 'Which song?';
			let choices = mix;
			let choiceArray = [];
			let votes = [];
			let multipleVotes = req.query.multiplevotes
			choices.forEach(choiceAppend);

			function choiceAppend(element, index, array) {
				let choice = {
					id: makeid(10),
					text: choices[index].track[0].name,
					votes: 0
				};
				choiceArray.push(choice);
			}

			console.log(choiceArray);

			let newPoll = new Poll({
				active: true,
				polltext: pollText,
				choices: choiceArray,
				votes: votes,
				allow_multiple_votes: multipleVotes
			});
			await newPoll.save().then(doc => {
				res.send(doc);
				let num = 1;
				let choices = [];
				botclient.say(
					twitchchan[0],
					'A new poll has started! Vote with !c i.e.(!c 2)'
				);
				botclient.say(twitchchan[0], `The poll question is: ${pollText}`);

				doc.choices.forEach(choice => {
					botclient.say(twitchchan[0], `!c ${num} = ${choice.text}`);
					num++;
					let choiceArr = [`${choice.text}`, choice.votes];
					choices.push(choiceArr);
				});
				pollsIO.emit('pollOpen', {
					poll: doc
				});

				choices = [];
				num = 1;
			});
		} else {
			console.log(poll);
			res.status(418).send('Poll is already running');
		}
	} catch (err) {
		console.error(err);
		errTxt(err);
	}
});

router.get('/polls/close/:id', loggedIn, async (req, res) => {
	let pollID = req.params.id
	redis.lrange(`Channel:${config.twitchChan}:Poll:${pollID}`, 4, -1,
		(err, reply) => {
			if (err) {
				console.error(err)
				return
			}
			let voteCounts = [],
				choiceID = [],
				choiceText = []
			for (i = 4; i <= reply.length; i += 5) {
				voteCounts.push(parseInt(reply[i], 10))
				choiceID.push(reply[i - 3])
				choiceText.push(reply[i - 2])
			}
			let winIndex = findmax(voteCounts)
			let winID = choiceID[winIndex]
			let winner = pollID + winID
			res.status(200).send('Poll Closed')
			pollsIO.emit('pollClose', {
				pollID: pollID,
				win: winner,
				winText: choiceText[winIndex]
			});
			console.log(winID)
			console.log(winIndex)
		})


	// try {
	// 	let user = await User.findOne({ twitch_id: req.user.id });
	// 	let poll = await Poll.findOne({ _id: req.params.id });
	// 	let choiceArr = [];
	// 	poll.choices.forEach(choice => {
	// 		choiceArr.push(choice.votes);
	// 	});
	// 	console.log(choiceArr);
	// 	let i = choiceArr.indexOf(Math.max(...choiceArr));
	// 	let win = poll._id + poll.choices[i].id;
	// 	await Poll.findOneAndUpdate(
	// 		{ _id: req.params.id },
	// 		{ $set: { active: false }, winner: win },
	// 		{ useFindAndModify: false, new: true },
	// 		(err, doc) => {
	// 			console.log(doc.active);
	// 			if (err) {
	// 				errTxt(err);
	// 				return;
	// 			}
	// 			try {
	// 				res.sendStatus(200);

	// 				botclient.say(twitchchan[0], 'The poll is now closed');
	// 				botclient.say(
	// 					twitchchan[0],
	// 					`Poll: ${doc.polltext} Winner: ${doc.choices[i].text}`
	// 				);

	// 				pollsIO.emit('pollClose', {
	// 					pollID: doc._id,
	// 					win: win,
	// 					winText: poll.choices[i].text
	// 				});
	// 			} catch (err) {
	// 				console.error(err);
	// 				errTxt(err);
	// 			}
	// 		}
	// 	);
	// } catch (err) {
	// 	res.status(500).send('Error closing Poll');
	// 	console.error(err);
	// 	errTxt(err);
	// }
});

module.exports = router

function makeid(length) {
	let result = '';
	let characters =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

function findmax(array) {
	var max = 0,
		a = array.length,
		counter,
		maxIndex

	for (counter = 0; counter < a; counter++) {
		if (array[counter] > max) {
			max = array[counter]
			maxIndex = counter
		}
	}
	return maxIndex
}