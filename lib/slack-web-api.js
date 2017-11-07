const { WebClient } = require('@slack/client');

const token = process.env.SLACK_API_TOKEN || '';
const web = new WebClient(token);

function getUserInfo(user) {
  return web.users.info(user).then(res => res);
}

function getChannelInfo(channel) {
  return web.channels.info(channel).then(res => res);
}

module.exports = {
  getUserInfo,
  getChannelInfo,
};
