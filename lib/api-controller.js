const ApiService = require('./api-service');
const Boom = require('boom');

const ApiController = {
  givers(request, reply) {
    return reply(ApiService.queryGivers(request.params.teamId, request.query)
      .catch((error) => {
        console.error(error);
        return Boom.badImplementation();
      }));
  },

  receivers(request, reply) {
    reply(ApiService.queryReceivers(request.params.teamId, request.query)
      .catch((error) => {
        console.error(error);
        return Boom.badImplementation();
      }));
  },

  channels(request, reply) {
    reply(ApiService.queryChannels(request.params.teamId, request.query)
      .catch((error) => {
        console.error(error);
        return Boom.badImplementation();
      }));
  },
};

module.exports = ApiController;
