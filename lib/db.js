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

module.exports = {
  getKarmaCollection,
  getDbKarma,
  setDbKarma,
};
