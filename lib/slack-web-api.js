const WebClient = require('@slack/client').WebClient;

const token = process.env.SLACK_API_TOKEN || '';
const web = new WebClient(token);

function getUserInfo(user) {
  return web.users.info(user).then(res => res);
}


module.exports = {
  getUserInfo,
};
