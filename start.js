
var url = require('url');
var fs = require('fs');
var crypto = require('crypto');
var helpers = require('./helpers');
var config = require('./config').config;

var PROTOCOL_HANDLERS = {
  http: require('http'),
  https: require('https')
};

var HANDLERS = {
  auth: require('./oauth-server'),
  webfinger: require('./webfinger-server'),
  storage: require('./remotestorage-server').createServer(helpers.tokenStore, helpers.dataStore)
};

var portServers = {};
var hostnameCertificates = {};

function sniCallback(hostname) {
  console.log('using Certificates for',hostname,hostnameCertificates[hostname]);
  return hostnameCertificates[hostname];
}

var READ_CERT_KEYS = { cert: true, key: true, ca: true };
function maybeReadCert(key, value) {
  return READ_CERT_KEYS[key] ? fs.readFileSync(value, 'UTF-8') : value;
}

['auth', 'storage', 'webfinger'].forEach(function(server) {
  ['port','host','protocol','ssl'].forEach(function(property) {
    if(!config[server][property])
      config[server][property] = config[property]
  })
  if(!config[server].path)
    config[server].path = '/' + server + '/';
  config[server].handler = HANDLERS[config[server].handler || server];
  if(typeof(config[server].handler) !== 'function') {
    throw "Invalid handler: " + config[server].handler || server;
  }
  config[server].handler.config = config; // link back
  var port = config[server].port;
  if(! portServers[port]) {
    portServers[port] = {
      protocol: config[server].protocol,
      endpoints: [],
      serverOptions: {
        SNICallback: config[server].protocol === 'https' ? sniCallback : undefined
      }
    };
  }
  if(config[server].protocol != portServers[port].protocol) {
    throw new Error("Invalid configuration! Can't run server on port " + port + " with protocol " + config[server].protocol + ", already configured for protocol " + portServers[port].protocol);
  }
  if(config[server].protocol === 'https' && config[server].ssl) {
    if(hostnameCertificates[config[server].host]) {
      throw new Error("[in " + server + "] Already have a certificate for " + config[server].host);
    }
    var certs = {};
    for(var key in config[server].ssl) {
      certs[key] = maybeReadCert(key, config.ssl[key])
    }
    try {
      hostnameCertificates[config[server].host] = crypto.createCredentials(certs).context;
    } catch(e) {
      console.error(e.message);
      throw new Error("Failed to load certificates. Check your SSL configuration for hostname " + config[server].host + " (service: " + server + ")");
    }
  }
  portServers[port].endpoints.push(config[server]);
});

function createHandler(protocol, endpoints, serverOptions) {
  var n = endpoints.length;
  var f = function(req, res) {
    var urlObj = url.parse(req.url, true);
    var endpoint;
    console.log(req.method, req.headers.host, req.url);
    console.log('have ', n, endpoints);
    for(i=0;i<n;i++){
      endpoint = endpoints[i];
      if((endpoint.host ? req.headers.host.split(':')[0] === endpoint.host : true) && urlObj.path.indexOf(endpoint.path)===0) {
        endpoint.handler(req, res, urlObj);
        return;
      }
    }
    helpers.writeHead(res, 404); res.end('Not found?');
  };
  return protocol === 'https' ? [serverOptions, f] : [f];
}

for(var port in portServers) {
  console.log("Starting " + portServers[port].protocol + " server on port " + port + "...");

  var protocol = portServers[port].protocol, endpoints = portServers[port].endpoints, serverOptions = portServers[port].serverOptions;

  if(protocol === 'https') {
    if(! config.ssl) {
      throw new Error("No global SSL configuration given. This is required as fallback. Just choose a random one of your other certificate if you are unsure.");
    }
    for(var key in config.ssl) {
      serverOptions[key] = maybeReadCert(key, config.ssl[key]);
    }
  }

  PROTOCOL_HANDLERS[protocol].createServer.apply(PROTOCOL_HANDLERS[protocol], createHandler(protocol, endpoints, serverOptions)).listen(port);
  console.log("Done. Installed routes: " + portServers[port].endpoints.map(function(endpoint) { return (endpoint.host || '') + endpoint.path; }).join(', '));
}
