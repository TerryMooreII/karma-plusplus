const Hapi = require('hapi');
const slackSlashHandler = require('./slack-slash-handler');

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({
  port: process.env.PORT || 3000,
});

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

// Start the server
server.start((err) => {
  if (err) {
    throw err;
  }
  console.log('Server running at:', server.info.uri);
});

