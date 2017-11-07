const admin = require('firebase-admin');
const serviceAccount = require('../user.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function getCollection(name) {
  if (!name) throw new Error('Name is require to retreive a collection');
  return db.collection(name);
}

function setDbKarma(person) {
  const docRef = getCollection('karma').doc(person.userId);
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

function setDbChannel(channel) {
  const docRef = getCollection('channel').doc(channel.channelId);
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

    data.total = data.positiveKarma - data.negativeKarma;
    docRef.set(data);

    return data;
  })
    .catch(error => console.log(error));
}

function setDbGivers(user) {
  const docRef = getCollection('givers').doc(user.userId);
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

    data.total = data.positiveKarma - data.negativeKarma;
    docRef.set(data);

    return data;
  })
    .catch(error => console.log(error));
}

module.exports = {
  setDbKarma,
  setDbChannel,
  setDbGivers,
  getCollection,
};
