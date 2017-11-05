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

function response(message) {
    return {
        "response_type": "in_channel",
        "text": message
    }
}

// function karma(payload, text) {
//     let [user, karma] = text.split(' ');
//     let count = 0;

//     if (user.includes('+')) {
//         var index = user.indexOf('+');
//         karma = user.substr(index);
//         user = user.substr(0, index);
//     } else if (user.includes('-')) {
//         var index = user.indexOf('-');
//         karma = user.substr(index);
//         user = user.substr(0, index);
//     }

//     if (!karma || (!karma.startsWith('++') && !karma.startsWith('--'))) {
//         return help('Add either pluses or minuses after the user\'s name!');
//     }

//     if (user.substr(1) === payload.user_name) {
//         return response(`${user} tried to give themself karma.`);
//     }

//     if (karma.length > 5) {
//         count = 5;
//      } else {
//         count = karma.length - 1;
//     }

//     if (karma[0] === '-') {
//         count = -count;        
//     } 

//     const direction = count < 0 ? 'removed' : 'gave';
//     return setDbKarma(payload, user, count)
//         .then(karma => response(`${payload.user_name} ${direction} ${user} ${count} karma. They now have ${karma} karma.`));
// }

function getDbKarma(payload) {
    return db.collection('karma').doc(payload.user_id);
}

function setDbKarma(person) {
    var docRef = getDbKarma(payload);
    return docRef.get().then(doc => {
        let data = {
            userId: person.userId,
            teamId: person.teamId
        };

        if (!doc.exists) {
            data.karma = person.adminamount
        } else {
            data.karma = doc.data().karma + person.amount;
        }

        docRef.set(data);

        return data.karma;
    })
    .catch(error => console.log(error));
}


function getUserInfo(user) {
    return web.users.info(user, function(err, res) {
        if (err) {
          console.log('Error:', err);
        } 
        return res
       });       
}

function handleRtmMessage(message) {
    var karma = [];
    var channel = message.channel;
    
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
        })
        return karma
    }).then((karma) => {
        var usersPromises = karma.map(person => getUserInfo(person.userId))
        Promise.all(usersPromises).then(result => {
            karma = karma.map(person => {
                karma.user = person[index];
                return karma;
            });
            return karma;
        }).then((karma) => {
            
        });
    });
}

function sendMessage(karma, channel) {
    var message = '';
    karma.forEach(person => {
        console.log(person.user);
        message += `${person.userId} karma was ${person.karma > 0 ? 'increased' : 'decresed'} to ${person.total} `
    })

    rtm.sendMessage(message, channel);
}

/*

parse for karma
save to db and get new karma amount
get use names 
send message


*/




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

{ type: 'message',
2017-11-05T19:15:13.500627+00:00 app[web.1]:   channel: 'C7V8F4S8L',
2017-11-05T19:15:13.500628+00:00 app[web.1]:   user: 'U5G9H3N8J',
2017-11-05T19:15:13.500629+00:00 app[web.1]:   text: 'test',
2017-11-05T19:15:13.500629+00:00 app[web.1]:   ts: '1509909313.000040',
2017-11-05T19:15:13.500630+00:00 app[web.1]:   source_team: 'T3QDS4TNY',
2017-11-05T19:15:13.500630+00:00 app[web.1]:   team: 'T3QDS4TNY' }


*/