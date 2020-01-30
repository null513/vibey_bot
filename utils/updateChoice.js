const redis = require('../utils/redis-export')
module.exports = (message, channel, pollID, userstate) => {
    let voterSetArgs = [
        `Channel:${channel}:Poll:${pollID}:Voters`,
        `${userstate.username}`
    ]
    redis.sadd(voterSetArgs)
    // Get vote from chat
    let voteNum = parseInt(message[message.search(/\d/)], 10) - 1;
    let voteIndex = (voteNum * 5) + 4
    // Get current poll info
    redis.lrange(
        `Channel:${channel}:Poll:${pollID}`,
        0, -1,
        (err, choices) => {
            if (err) console.error(err)
            // Parse data to work with
            let choicesOnly = choices.slice(8)
            let choiceIncr = parseInt(choicesOnly[voteIndex], 10) + 1
            let updateIndex = ((voteNum * 5) + 4) + 8

            // Increase total
            let totalIncr = toString(parseInt(choices[7], 10) + 1)
            redis.lset(
                `Channel:${channel}:Poll:${pollID}`,
                7,
                totalIncr,
                (err, reply) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log('total updated')
                }
            )

            // update vote amount for specific choice
            redis.lset(
                `Channel:${channel}:Poll:${pollID}`,
                updateIndex,
                `${choiceIncr}`,
                (err, reply) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    console.log('Poll Updated')
                }
            )
            return
        }
    )
}
