const Hapi = require('hapi');
const slackSlashHandler = require('./slack-slash-handler');
const ApiController = require('./api-controller');

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({
  port: process.env.PORT || 3000,
});

// Endpoints for Slack Bot
server.route({
  method: 'POST',
  path: '/slack/karma',
  handler: slackSlashHandler.karmaSlashCommand,
});

server.route({
  method: 'POST',
  path: '/slack/event',
  handler(request, reply) {
    reply({ challenge: request.payload.challenge });
  },
});

// Endpoints for Api
server.route({
  method: 'GET',
  path: '/api/givers/{teamId}',
  handler: ApiController.givers,
});

server.route({
  method: 'GET',
  path: '/api/receivers/{teamId}',
  handler: ApiController.receivers,
});

server.route({
  method: 'GET',
  path: '/api/channels/{teamId}',
  handler: ApiController.channels,
});

// Start the server
server.start((err) => {
  if (err) {
    throw err;
  }
  console.log('Server running at:', server.info.uri);
});

