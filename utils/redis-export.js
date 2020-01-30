module.exports = require('redis').createClient({
    password: process.env.REDIS_PASS
});