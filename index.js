require('dotenv').config();
const Hapi = require('hapi');

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({ 
    port: process.env.PORT || 3000 
});

// Add the route
server.route({
    method: 'GET',
    path:'/', 
    handler: function (request, reply) {
        return reply('hello world');
    }
});

server.route({
    method: 'POST',
    path:'/slack/karma', 
    handler: karmaSlashCommand
});

// Start the server
server.start((err) => {

    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});

function karmaSlashCommand(request, reply){
    console.log(request.payload)
    const command = request.payload.text ? request.payload.text.toLowerCase() : '';

    if (command.startsWith('top')){
        return reply(getTop(request.payload));
    } else if (command.startsWith('bottom')){
        return reply(getBottom(request.payload));
    } else {
        return reply(help());
    }
}

function getTop(payload){
    return 'top';
}

function getBottom(payload){
    return 'bottom';
}

function help() {
    return `Available /karma Commands:
    /karma top          Show Top Karma Users
    /karma bottom       Show Bottom Karma Users
    `;
}