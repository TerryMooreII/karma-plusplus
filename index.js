require('dotenv').config();
const Hapi = require('hapi');

const admin = require('firebase-admin');

const serviceAccount = require('./user.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

var bot_token = process.env.SLACK_API_TOKEN || '';

var rtm = new RtmClient(bot_token);

// The client will emit an RTM.AUTHENTICATED event on successful connection, with the `rtm.start` payload if you want to cache it
rtm.on(RTM_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
  console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
});

rtm.start();

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
    if (message.text === "Hello.") {
      var channel = "#general"; //could also be a channel, group, DM, or user ID (C1234), or a username (@don)
      rtm.sendMessage("Hello <@" + message.user + ">!", message.channel);
    }
  });
    

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

server.route({
    method: 'POST',
    path:'/slack/event', 
    handler: function (request, reply) {
        reply({challenge: request.payload.challenge});
    }
});

// Start the server
server.start((err) => {

    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});

function karmaSlashCommand(request, reply){
    
    const command = request.payload.text ? request.payload.text.toLowerCase() : '';

    if (command.startsWith('top')){
        return reply(getTop(request.payload));
    } else if (command.startsWith('bottom')){
        return reply(getBottom(request.payload));
    } else if (command[0] === '@') {
        return reply(karma(request.payload, command));
    } else {
        return reply(help());
    }
}

function getTop(payload) {
    var karmaRef = db.collection('karma');
    
     return karmaRef.where('teamId', '==', payload.team_id).orderBy('karma', 'asc').limit(5).get().then(snapshot => {
        var results = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            results += `${data.karma} ${data.userName}\n`
        })
        return response(results);
    }).catch(error => console.log(error));

}

function getBottom(payload){
    var karmaRef = db.collection('karma');
    
     return karmaRef.where('teamId', '==', payload.team_id).orderBy('karma', 'desc').limit(5).get().then(snapshot => {
        var results = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            results += `${data.karma} ${data.userName}\n`
        })
        return response(results);
    }).catch(error => console.log(error));
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

function karma(payload, text) {
    let [user, karma] = text.split(' ');
    let count = 0;

    if (user.includes('+')) {
        var index = user.indexOf('+');
        karma = user.substr(index);
        user = user.substr(0, index);
    } else if (user.includes('-')) {
        var index = user.indexOf('-');
        karma = user.substr(index);
        user = user.substr(0, index);
    }

    if (!karma || (!karma.startsWith('++') && !karma.startsWith('--'))) {
        return help('Add either pluses or minuses after the user\'s name!');
    }

    if (user.substr(1) === payload.user_name) {
        return response(`${user} tried to give themself karma.`);
    }

    if (karma.length > 5) {
        count = 5;
     } else {
        count = karma.length - 1;
    }

    if (karma[0] === '-') {
        count = -count;        
    } 

    const direction = count < 0 ? 'removed' : 'gave';
    return setDbKarma(payload, user, count)
        .then(karma => response(`${payload.user_name} ${direction} ${user} ${count} karma. They now have ${karma} karma.`));
}

function getDbKarma(payload) {
    return db.collection('karma').doc(payload.user_id);
}

function setDbKarma(payload, user, amount) {
    var docRef = getDbKarma(payload);
    return docRef.get().then(doc => {
        let data = {
            userName: user,
            channelId: payload.channel_id,
            channelName: payload.channel_name,
            teamId: payload.team_id,
            teamDomain: payload.team_domain
        };

        if (!doc.exists) {
            data.karma = amount
        } else {
            data.karma = doc.data().karma + amount;
        }
        docRef.set(data);
        return data.karma;
    }).catch(error => console.log(error));
}

function response(message) {
    return {
        "response_type": "in_channel",
        "text": message
        // "attachments": [
        //     {
        //         "text":"Partly cloudy today and tomorrow"
        //     }
        // ]
    }
}


/*



{ 
   token: '5SFzFzk3lcvfUzXbeYXG0Phe',
   team_id: 'T3QDS4TNY',
   team_domain: 'broadvine',
   channel_id: 'G7V3SMHFE',
   channel_name: 'privategroup',
   user_id: 'U5G9H3N8J',
   user_name: 'tmoore',
   command: '/karma',
   text: 'top',
   response_url: 'https://hooks.slack.com/commands/T3QDS4TNY/267162849044/KUYCHqCUeUVeJhp529AB9J76',
   trigger_id: '266596392065.126468163780.3c12c4452f6d8b1a0b201eaeed74102f' 
}

*/