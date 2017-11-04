require('dotenv').config();
const Hapi = require('hapi');

const admin = require('firebase-admin');

const serviceAccount = require('./user.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


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
            results += `${data.userName} has ${data.karma} karma\n`
        })
        return results;
    }).catch(error => console.log(error));

}

function getBottom(payload){
    var karmaRef = db.collection('karma');
    
     return karmaRef.where('teamId', '==', payload.team_id).orderBy('karma', 'desc').limit(5).get().then(snapshot => {
        var results = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            results += `${data.userName} has ${data.karma} karma\n`
        })
        return results;
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
    const [user, karma] = text.split(' ');
    let count = 0;
    if (!karma || (!karma.startsWith('++') && !karma.startsWith('--'))) {
        return help('Add either pluses or minuses after the user\'s name!');
    }

    if (karma.length > 5) {
        count = 5;
     } else {
        count = karma.length - 1;
    }

    if (karma[0] === '-') {
        count = -count;        
    } 

    const direction = count > 0 ? 'lost' : 'was given';
    setDbKarma(payload, user, count);

    return response(`${user} ${direction} ${count} karma.`);
}

function getDbKarma(payload) {
    return db.collection('karma').doc(payload.user_id);
}

function setDbKarma(payload, user, amount) {
    var docRef = getDbKarma(payload);
    docRef.get().then(doc => {
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