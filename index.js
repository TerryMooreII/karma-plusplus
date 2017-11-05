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
var WebClient = require('@slack/client').WebClient;
var token = process.env.SLACK_API_TOKEN || '';
var bot_token = process.env.SLACK_BOT_TOKEN || '';

var rtm = new RtmClient(bot_token);
var web = new WebClient(token);

rtm.on(RTM_EVENTS.MESSAGE, handleRtmMessage);

rtm.start();
    

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
    // } else if (command[0] === '@') {
    //     return reply(karma(request.payload, command));
    } else {
        return reply(help());
    }
}

function getTop(payload) {
    return getResults(payload, 'asc');
}

function getBottom(payload){
   return getResults(payload, 'desc');
}

function getResults(payload, dir = 'asc'){
    var karmaRef = db.collection('karma');
    
     return karmaRef.where('teamId', '==', payload.team_id).orderBy('karma', dir).limit(5).get().then(snapshot => {
        
        let results = []; 
        snapshot.forEach(doc => {
            results.push( doc.data());
        });

        const promises = results.map(person => getUserInfo(person.userId));

        return Promise.all(promises).then(users => {
            results = results.map((person, index) => {
                person.user = users[index];
                return person;
            })
            return results;
        }).then(results => {
            let message = '';
            results.forEach(result => {
                message += `${result.karma}  ${result.user.user.real_name}`;
            })
            return message;
        }).then(message => response(message));

    }).catch(error => console.log(error));
}

function help(message = '') {
    return `${message} \n
    Available /karma Commands:
    /karma top        Show Top Karma Users
    /karma bottom     Show Bottom Karma Users
    `;
}

function response(message) {
    return {
        "response_type": "in_channel",
        "text": message
    }
}


function getDbKarma(person) {
    return db.collection('karma').doc(person.userId);
}

function setDbKarma(person) {
    var docRef = getDbKarma(person);
    return docRef.get().then(doc => {
        let data = {
            userId: person.userId,
            teamId: person.teamId
        };

        if (!doc.exists) {
            data.karma = person.karma
        } else {
            data.karma = doc.data().karma + person.karma;
        }

        docRef.set(data);
    
        return data.karma;
    })
    .catch(error => console.log(error));
}


function getUserInfo(user) {
    return web.users.info(user).then(res => {
        return res
    });       
}

function handleRtmMessage(message) {
    var karma = [];
    var channel = message.channel;
    var split = message.text.split(' ');
    split.forEach((part, index) => {
      
      var next = split[index + 1] || '';
      
      if (part.startsWith('<@') && part.endsWith('>') && (next.startsWith('++') || next.startsWith('--'))) {
        let points = 0
        
        if (next.startsWith('--')){
          points = -(next.length > 5 ? 5 : next.length - 1);
        }
        
        if (next.startsWith('++')){
          points = next.length > 5 ? 5 : next.length - 1;
        }
        
        var person = {
            userId: part.substring(2, part.length - 1),
            karma: points,
            teamId: message.team
        }
        karma.push(person);
      }
    });

    const savePromises = karma.map(person => setDbKarma(person))
    Promise.all(savePromises).then(result => {
        karma = karma.map((person, index) => {
            person.total = result[index];
            return person;
        });
        return karma
    }).then((karma) => {
        var usersPromises = karma.map(person => getUserInfo(person.userId))
        Promise.all(usersPromises).then(result => {
            karma = karma.map((person, index) => {
                person.user = result[index];
                return person;
            });
            return karma;
        }).then((karma) => {
            sendMessage(karma, channel);
        });
    });
}

function sendMessage(karma, channel) {
    var message = '';
    karma.forEach(person => {
        message += `${person.user.user.real_name} karma was ${person.karma > 0 ? 'increased' : 'decresed'} to ${person.total} `
    })

    rtm.sendMessage(message, channel);
}
