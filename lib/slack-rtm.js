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

function getKarma(part, next, team) {
  let points = 0;

  if (next.startsWith('--')) {
    points = -(next.length > 5 ? 5 : next.length - 1);
  }

  if (next.startsWith('++')) {
    points = next.length > 5 ? 5 : next.length - 1;
  }

  const person = {
    userId: part.replace(/<@/, '').replace(/>/, ''),
    karma: points,
    teamId: team,
  };
  return person;
}

function handleRtmMessage(message) {
  let karma = [];
  const { channel } = message;
  const split = message.text.split(' ');

  split.forEach((part, index) => {
    let next = split[index + 1] || '';

    if (part.startsWith('<@') && part.endsWith('>') && (next.startsWith('++') || next.startsWith('--'))) { 
      karma.push(getKarma(part, next, message.team));
    } else if (part.startsWith('<@') && (part.endsWith('++') || part.endsWith('--'))) {
      [part, next] = part.split('>');
      karma.push(getKarma(part, next, message.team));
    }
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
