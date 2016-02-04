var tmp = require('tmp');
tmp.setGracefulCleanup();

var bower = require('bower');
var request = require('./request');
var utils = require('./utils');

/**
 * Factory function for resolver
 * It is called only one time by Bower, to instantiate resolver.
 * You can instantiate here any caches or create helper functions.
 */
module.exports = function resolver (bower) {

  function getFragments(source) {
      return {
          registryUrl: utils.getRegistryUrl(bower.config),
          repositoryName: utils.getRepositoryName(source)
      }
  };

  // Resolver factory returns an instance of resolver
  return {

    // Match method tells whether resolver supports given source
    // It can return either boolean or promise of boolean
    // source = angular-ui-router (bower install angular-ui-router)
    match: function (source) {
      return utils.hasLastDeps(source);
    },

    locate: function (source) {
        if (utils.hasLastDeps(source)) {
            var metadataUrl = utils.getMetadataXmlRoute(source, bower.config);
            return utils.findLastBuildFromMetadata(source, metadataUrl, bower.config)
                .then(function(url){
                    return url;
                }, function (e) {
                    console.log(e);
                });
        } else {
            return source;
        }
    }
  }
}
