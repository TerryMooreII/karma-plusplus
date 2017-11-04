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
    const command = request.payload.text;
    if (!command){
        return reply(help());
    }

    if (command.toLowerCase().includes('top')){
        return reply(getTop(request.payload));
    }

    if (command.toLowerCase().includes('top')){
        return reply(getBottom(request.payload));
    }
}

function getTop(payload){
    return 'top';
}

function getBottom(payload){
    return 'bottom';
}

function help(){
    return 
    `Available /karma Commands:
        /karma top          Show Top Karma Users
        /karma bottom       Show Bottom Karma Users
    `;
}