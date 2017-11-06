const db = require('./db');
const slackWebApi = require('./slack-web-api');

function response(message) {
  return {
    response_type: 'in_channel',
    text: message,
  };
}

function getResults(payload, dir = 'desc') {
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

function help(message = '') {
  return `${message} \n
    Available /karma Commands:
    /karma top          Show Top Karma Users
    /karma bottom     Show Bottom Karma Users
    `;
}

function getTop(payload) {
  return getResults(payload, 'desc')
    .then(message => response(`The Top Karma++ Users: \n\n${message}`));
}

function getBottom(payload) {
  return getResults(payload, 'asc')
    .then(message => response(`The Bottom Karma++ Users: \n\n${message}`));
}

function karmaSlashCommand(request, reply) {
  const command = request.payload.text ? request.payload.text.toLowerCase() : '';

  if (command.startsWith('top')) {
    return reply(getTop(request.payload));
  } else if (command.startsWith('bottom')) {
    return reply(getBottom(request.payload));
  }
  return reply(help());
}


module.exports = {
  karmaSlashCommand,
};
