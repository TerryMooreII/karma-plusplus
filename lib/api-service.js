const db = require('./db');
const slackWebApi = require('./slack-web-api');

const LIMIT = 5;

function dbQuery(collectionName, teamId, query) {
  const ref = db.getCollection(collectionName);

  return ref.where('teamId', '==', teamId).orderBy(query.orderBy, query.dir || 'desc').limit(query.limit || LIMIT).get()
    .then((snapshot) => {
      const results = [];
      snapshot.forEach((doc) => {
        results.push(doc.data());
      });
      return results;
    });
}

function mapUsers(results) {
  const promises = results.map(person => slackWebApi.getUserInfo(person.userId));
  return Promise.all(promises).then((users) => {
    results = results.map((person, index) => {
      person.user = users[index];
      return person;
    });
    return results;
  });
}

function mapChannels(results) {
  const promises = results.map(channel => slackWebApi.getChannelInfo(channel.channelId));
  return Promise.all(promises).then((channels) => {
    results = results.map((channel, index) => {
      channel.channel = channels[index];
      return channel;
    });
    return results;
  });
}

const ApiService = {
  queryGivers(teamId, query) {
    query.orderBy = query.orderBy || 'total';

    return dbQuery('givers', teamId, query).then(mapUsers);
  },

  queryChannels(teamId, query) {
    query.orderBy = query.orderBy || 'total';

    return dbQuery('channel', teamId, query).then(mapChannels);
  },

  queryReceivers(teamId, query) {
    query.orderBy = query.orderBy || 'karma';

    return dbQuery('karma', teamId, query).then(mapUsers);
  },
};

module.exports = ApiService;
