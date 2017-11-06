const slackWebApi = require('./slack-web-api');
const db = require('./db');
const RtmClient = require('@slack/client').RtmClient;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const bot_token = process.env.SLACK_BOT_TOKEN || '';

const rtm = new RtmClient(bot_token);
rtm.on(RTM_EVENTS.MESSAGE, handleRtmMessage);
rtm.start();

function handleRtmMessage(message) {
    var karma = [];
    var channel = message.channel;
    var split = message.text.split(' ');
    split.forEach((part, index) => {
      var next = split[index + 1] || '';
      
      if (part.startsWith('<@') && part.endsWith('>') && (next.startsWith('++') || next.startsWith('--'))) {
        let points = 0
        
        if (next.startsWith('--')){
          points = -(next.length > 5 ? 5 : next.length - 1);
        }
        
        if (next.startsWith('++')){
          points = next.length > 5 ? 5 : next.length - 1;
        }
        
        var person = {
            userId: part.substring(2, part.length - 1),
            karma: points,
            teamId: message.team
        }
        karma.push(person);
      }
    });

    const savePromises = karma.map(person => db.setDbKarma(person))
    Promise.all(savePromises).then(result => {
        karma = karma.map((person, index) => {
            person.total = result[index];
            return person;
        });
        return karma
    }).then((karma) => {
        var usersPromises = karma.map(person => slackWebApi.getUserInfo(person.userId))
        Promise.all(usersPromises).then(result => {
            karma = karma.map((person, index) => {
                person.user = result[index];
                return person;
            });
            return karma;
        }).then((karma) => {
            sendMessage(karma, channel);
        });
    });
}

function sendMessage(karma, channel) {
    var message = '';
    karma.forEach(person => {
        message += `${person.user.user.real_name}'s karma was ${person.karma > 0 ? 'increased' : 'decresed'} to ${person.total}\n `;
    })

    rtm.sendMessage(message, channel);
}