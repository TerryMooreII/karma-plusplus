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
    } else if (command[0] === '@') {
        return reply(karma(command));
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

function help(message = '') {
    return `${message} \n
    Available /karma Commands:
    /karama <@user>   Give or remove karma with pluses or minuses
                      The more pluses or minues the more or less karma!
                      examples: 
                          /karma @tmoore +++
                          /karam @tmoore -- 
    /karma top        Show Top Karma Users
    /karma bottom     Show Bottom Karma Users
    `;
}

function karma(text) {
    const { user, karma } = text.split(' ');
    let count = 0;

    if (!karam.startsWith('++') || !karma.startsWith('--')){
        return help('Add either pluses or minuses after the user\'s name!');
    }

    if (karma.length > 5){
        count = 5;
     }else {
        count = karma.length - 1;
    }

    const direction;
    if (karma[0] === '-'){
        direction = 'removed';
    } else {
        direction = 'given'
    }


    return `${user} ${direction} ${count} karma.`
}