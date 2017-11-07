const slackWebApi = require('./slack-web-api');
const db = require('./db');
const { RtmClient } = require('@slack/client');
const { RTM_EVENTS } = require('@slack/client');

const botToken = process.env.SLACK_BOT_TOKEN || '';
const rtm = new RtmClient(botToken);

function sendMessage(karma, channel) {
  let message = '';
  karma.forEach((person) => {
    message += `${person.user.user.real_name}'s karma was ${person.karma > 0 ? 'increased' : 'decreased'} to ${person.total}\n `;
  });

  rtm.sendMessage(message, channel);
}


function handleRtmMessage(message) {
  let karma = [];
  const { channel } = message;
  const split = message.text.split(' ');

  let positiveKarma = 0;
  let negativeKarma = 0;

  split.forEach((part, index) => {
    const next = split[index + 1] || '';

    if (part.startsWith('<@') && part.endsWith('>') && (next.startsWith('++') || next.startsWith('--'))) {
      let points = 0;

      if (next.startsWith('--')) {
        points = -(next.length > 5 ? 5 : next.length - 1);
        negativeKarma += -points;
      }

      if (next.startsWith('++')) {
        points = next.length > 5 ? 5 : next.length - 1;
        positiveKarma += points;
      }

      const person = {
        userId: part.substring(2, part.length - 1),
        karma: points,
        teamId: message.team,
      };
      karma.push(person);
    }
  });

  // Update the channel table with karma amounts
  db.setDbChannel({
    positiveKarma,
    negativeKarma,
    channelId: channel,
    teamId: message.team,
  });

  // Update the giver table with karma amounts
  db.setDbGiverl({
    positiveKarma,
    negativeKarma,
    userId: message.user,
    teamId: message.team,
  });

  const savePromises = karma.map(person => db.setDbKarma(person));
  Promise.all(savePromises).then((result) => {
    karma = karma.map((person, index) => {
      person.total = result[index];
      return person;
    });
    return karma;
  }).then((karma) => {
    const usersPromises = karma.map(person => slackWebApi.getUserInfo(person.userId));
    Promise.all(usersPromises).then((result) => {
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

rtm.on(RTM_EVENTS.MESSAGE, handleRtmMessage);
rtm.start();
