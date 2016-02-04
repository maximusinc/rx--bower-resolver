var semver = require('semver');
var request = require('./request');
var xmldoc = require('xmldoc');
var createError = require('./createError');
var string = require('mout/string');
var Q = require('q');

var NEXUS_PREFIX = "nexus://";
var LAST_REGXP = "~last~";

var hasLastDep = function (url) {
    return (new RegExp(LAST_REGXP)).test(url);
};

/**
 * Create from source url metadata.xml url
 * @author Maximus
 * @param   {string} url         source
 * @param   {object} bowerConfig bower config value
 * @returns {string} metadata.xml endpoint
 */
var getMetadataXmlRoute = function (url, bowerConfig) {
    var r = url.match(/g=([^&]+)/)[1],
        a = url.match(/a=([^&]+)/)[1];
    return bowerConfig.nexusRegistry + r.replace(/\./g,'/')+'/' + a + '/maven-metadata.xml';
};

var findLastBuildFromMetadata = function (source, metadataXmlEndpoint, config) {
    var deferred = Q.defer();
    request(metadataXmlEndpoint, config)
        .then(function (response) {
            var doc = new xmldoc.XmlDocument(response),
                arrVersions = doc.childNamed('versioning').childNamed('versions').childrenNamed('version'),
                child = arrVersions[ arrVersions.length - 1];
            deferred.resolve( source.replace(new RegExp(LAST_REGXP, 'g'), child.val) );
        }, function () {
            deferred.reject(createError('metadata.xml NOT FOUND', 'NOTFOUND', {
                details: 'Can\'t find metadata.xml from ' + metadataXmlEndpoint
            }));
        });
    return deferred.promise;
};

function clean(version) {
    var parsed = semver.parse(version);

    if (!parsed) {
        return null;
    }

    // Keep builds!
    return parsed.version + (parsed.build.length ? '+' + parsed.build.join('.') : '');
}

/**
 * Override for using metadata.xml
 */
function extractReleases(response) {

    try {
        var json = JSON.parse(response);
    } catch (e){
        throw createError('Malformed JSON', 'EBADJSON', {
            details: 'The JSON requested to extract package release is corrupted'
        });
    }

    var res = Object.keys(json.versions).map(function (tag) {
        return {
            release: clean(tag) || tag,
            target: tag,
            version: clean(tag)
        };
    });

    return res;
}

function getRegistryUrl(config) {
    var registryUrl = config.registry.register;

    if (registryUrl.indexOf('nexus') > -1) {
        return config.registry.register;
    }

    var found = config.registry.search.some(function (searchRegistry) {
        if (searchRegistry.indexOf('nexus') > -1) {
            registryUrl = searchRegistry;
            return true;
        }
    });

    if (found) {
      return registryUrl;
    }

    throw createError('Nexus registry not configured', 'ENOCONFIG', {
        details: 'You need to set Nexus registry in config.registry.register or config.registry.search of .bowerrc'
    });
};

function getRepositoryName(source) {
    var match = source.replace(NEXUS_PREFIX, "").split("/");

    if (match.length < 2) {
        throw createError('Invalid Nexus Package Name', 'EINVEND', {
            details: source + ' does not seem to be a valid Nexus package name: nexus://<package-name>/<version>'
        });
    }

    return match[0] + "/" + match[1];
};

function getNexusRegistry(config) {
    if (!config.nexusRegistry) {
        throw createError('No Nexus registry is defined', 'ENONEXUSREG', {
            details: 'You need to set nexusRegistry in .bowerrc'
        });
    }
    return config.nexusRegistry;
};

exports.clean = clean;
exports.extractReleases = extractReleases;
exports.getRegistryUrl = getRegistryUrl;
exports.getRepositoryName = getRepositoryName;
exports.NEXUS_PREFIX = NEXUS_PREFIX;
exports.getNexusRegistry = getNexusRegistry;
// add
exports.hasLastDeps = hasLastDep;
exports.getMetadataXmlRoute = getMetadataXmlRoute;
exports.findLastBuildFromMetadata = findLastBuildFromMetadata;
