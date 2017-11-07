const admin = require('firebase-admin');
const serviceAccount = require('../user.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function getKarmaCollection() {
  return db.collection('karma');
}

function getDbKarma(person) {
  return getKarmaCollection().doc(person.userId);
}

function setDbKarma(person) {
  const docRef = getDbKarma(person);
  return docRef.get().then((doc) => {
    const data = {
      userId: person.userId,
      teamId: person.teamId,
    };

    if (!doc.exists) {
      data.karma = person.karma;
    } else {
      data.karma = doc.data().karma + person.karma;
    }

    docRef.set(data);

    return data.karma;
  })
    .catch(error => console.log(error));
}

function getChannelCollection() {
    return db.collection('channel');
  }
  
  function getDbChannel(channelId) {
    return getChannelCollection().doc(channelId);
  }
  
  function setDbChannel(channel) {
    const docRef = getDbChannel(channel.channelId);
    return docRef.get().then((doc) => {
      const data = {
        channelId: channel.channelId,
        teamId: channel.teamId,
      };
  
      if (!doc.exists) {
        data.positiveKarma = channel.positiveKarma || 0;
        data.negativeKarma = channel.negativeKarma || 0;
      } else {
        data.positiveKarma = doc.data().positiveKarma + channel.positiveKarma;
        data.negativeKarma = doc.data().negativeKarma + channel.negativeKarma;
      }
  
      docRef.set(data);
  
      return data;
    })
      .catch(error => console.log(error));
  }

  function getGiversCollection() {
    return db.collection('givers');
  }
  
  function getDbGivers(userId) {
    return getGiversCollection().doc(userId);
  }
  
  function setDbGivers(user) {
    const docRef = getDbGivers(user.userId);
    return docRef.get().then((doc) => {
      const data = {
        userId: user.userId,
        teamId: user.teamId,
      };
  
      if (!doc.exists) {
        data.positiveKarma = user.positiveKarma || 0;
        data.negativeKarma = user.negativeKarma || 0;
      } else {
        data.positiveKarma = doc.data().positiveKarma + user.positiveKarma;
        data.negativeKarma = doc.data().negativeKarma + user.negativeKarma;
      }
  
      docRef.set(data);
  
      return data;
    })
      .catch(error => console.log(error));
  }
  

module.exports = {
  getKarmaCollection,
  getDbKarma,
  setDbKarma,
  setDbChannel,
  setDbGivers,
};
