require('dotenv').config();
const Hapi = require('hapi');

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({ 
    host: 'localhost', 
    port: process.env.port || 3000 
});

// Add the route
server.route({
    method: 'POST',
    path:'/slack/karma', 
    handler: function (request, reply) {
        console.log(request);
        return reply('hello world');
    }
});

// Start the server
server.start((err) => {

    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});