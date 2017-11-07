const db = require('./db');
const slackWebApi = require('./slack-web-api');

function response(message) {
  return {
    response_type: 'in_channel',
    text: message,
  };
}

function getUsersResults(payload, dir = 'desc') {
  const karmaRef = db.getKarmaCollection();

  return karmaRef.where('teamId', '==', payload.team_id).orderBy('karma', dir).limit(5).get()
    .then((snapshot) => {
      let results = [];
      snapshot.forEach((doc) => {
        results.push(doc.data());
      });

      const promises = results.map(person => slackWebApi.getUserInfo(person.userId));

      return Promise.all(promises).then((users) => {
        results = results.map((person, index) => {
          person.user = users[index];
          return person;
        });
        return results;
      }).then((results) => {
        let message = '';
        results.forEach((result) => {
          message += `${result.karma}  ${result.user.user.real_name}\n`;
        });
        return message;
      });
    })
    .catch(error => console.log(error));
}

function getChannelsResults(payload, dir = 'desc') {
  const channelRef = db.getChannelsCollection();

  return channelRef.where('teamId', '==', payload.team_id).orderBy('total', dir).limit(5).get()
    .then((snapshot) => {
      let results = [];
      snapshot.forEach((doc) => {
        results.push(doc.data());
      });

      const promises = results.map(channel => slackWebApi.getChannelInfo(channel.channelId));

      return Promise.all(promises).then((channels) => {
        results = results.map((channel, index) => {
          channel.channel = channels[index];
          return channel;
        });
        return results;
      }).then((results) => {
        let message = '';
        results.forEach((result) => {
          message += `${result.total}  ${result.channel.channel.name}\n`;
        });
        return message;
      });
    })
    .catch(error => console.log(error));
}

function help(message = '') {
  return `${message} \n
    Available /karma Commands:
    /karma top users          Show Top Karma Users
    /karma bottom users       Show Bottom Karma Users
    /karma top channels       Show Top Karma Users
    /karma bottom channels    Show Bottom Karma Users
    `;
}

function getTopUsers(payload) {
  return getUsersResults(payload, 'desc')
    .then(message => response(`The top 5 Karma++ Users: \n\n${message}`));
}

function getBottomUsers(payload) {
  return getUsersResults(payload, 'asc')
    .then(message => response(`The bottom Karma++ Users: \n\n${message}`));
}

function getTopChannels(payload) {
  return getChannelsResults(payload, 'desc')
    .then(message => response(`The top 5 Karma++ Channels: \n\n${message}`));
}

function getBottomChannels(payload) {
  return getChannelsResults(payload, 'asc')
    .then(message => response(`The bottom 5 Karma++ Channels: \n\n${message}`));
}

function karmaSlashCommand(request, reply) {
  const command = request.payload.text ? request.payload.text.toLowerCase() : '';

  if (command.startsWith('top users')) {
    return reply(getTopUsers(request.payload));
  } else if (command.startsWith('bottom users')) {
    return reply(getBottomUsers(request.payload));
  } else if (command.startsWith('top channels')) {
    return reply(getTopChannels(request.payload));
  } else if (command.startsWith('bottom channels')) {
    return reply(getBottomChannels(request.payload));
  }
  return reply(help());
}


module.exports = {
  karmaSlashCommand,
};
