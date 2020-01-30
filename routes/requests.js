require('dotenv').config();
const router = require('express').Router();
const config = require('../config/config')
const User = require('../models/users');
const SongRequest = require('../models/songRequests');
const mixReqs = require('../models/mixRequests');
const admins = config.admins;
const version = require('project-version');
const rqs = io.of('/req-namescape');

function loggedIn(req, res, next) {
    if (!req.user) {
        res.redirect('/login');
    } else {
        next();
    }
}

router.get('/', loggedIn, async (req, res) => {
    try {
        var user = await User.findOne({ twitch_id: req.user.id });
        if (user === null) {
            res.redirect('/login');
        }
        var feSongRequests = await SongRequest.find();
        var mixRequests = await mixReqs.find();
        if (admins.includes(user.username)) {
            res.render('requests', {
                feUser: user.username,
                profilePic: req.user['profile_image_url'],
                requests: feSongRequests,
                mixReqs: mixRequests,
                version: version
            });
        } else {
            res.redirect('/login');
        }
    } catch (err) {
        console.error(err);
        errTxt(err);
    }
});

router.get('/delete/:id', loggedIn, async (req, res) => {
    try {
        await SongRequest.deleteOne({ _id: req.params.id }).exec();
        res.status(200).send('Request deleted');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting song request');
        errTxt(err);
    }
});

router.get('/deleteall', loggedIn, (req, res) => {
    try {
        SongRequest.deleteMany({}).exec();
        res.status(200).send('Queue cleared');
    } catch (err) {
        res.status(500).send('Error clearing queue!');
        console.error(err);
        errTxt(err);
    }
});

module.exports = router;