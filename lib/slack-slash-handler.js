const ApiService = require('./api-service');

function response(message) {
  return {
    response_type: 'in_channel',
    text: message,
  };
}

function getUsersResults(payload, dir = 'desc') {
  return ApiService.queryReceivers(payload.team_id, { dir })
    .then((results) => {
      let message = '';
      results.forEach((result) => {
        message += `${result.karma}  ${result.user.user.real_name}\n`;
      });
      return message;
    })
    .catch(error => console.log(error));
}

function getChannelsResults(payload, dir = 'desc') {
  return ApiService.queryChannels(payload.team_id, { dir })
    .then((results) => {
      let message = '';
      results.forEach((result) => {
        message += `${result.total}  #${result.channel.channel.name}\n`;
      });
      return message;
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
