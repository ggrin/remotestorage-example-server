
var url = require('url');
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

['auth', 'storage', 'webfinger'].forEach(function(server) {
  ['port','host','protocol'].forEach(function(property) {
    if(!config[server][property])
      config[server][property] = config[property]
  })
  if(!config[server].path)
    config[server].path = '/' + server + '/';
  config[server].handler = HANDLERS[config[server].handler || server];
  if(typeof(config[server].handler) !== 'function') {
    throw "Invalid handler: " + config[server].handler || server;
  }
  config[server].handler.config = config; // link back... // WHY?
  var port = config[server].port;
  if(!portServers[port]) {
    portServers[port] = {
      protocol: config[server].protocol,
      endpoints: []
    };
  }
  if(config[server].protocol != portServers[port].protocol) {
    throw new Error("Invalid configuration! Can't run server on port " + port + " with protocol " + config[server].protocol + ", already configured for protocol " + portServers[port].protocol);
  }
  portServers[port].endpoints.push(config[server]);
});

function createHandler(endpoints) {
  var n = endpoints.length;
  return function(req, res) {
    var urlObj = url.parse(req.url, true);
    var endpoint;
    console.log(req.method, req.headers.host, req.url);
    for(i=0;i<n;i++) {
      endpoint = endpoints[i];
      if( // match host
        (endpoint.host ? req.headers.host.split(':')[0] === endpoint.host : true) &&
          // match path
         urlObj.path.indexOf(endpoint.path) === 0) {
        endpoint.handler(req, res, urlObj);
        return;
      }
    }
    res.writeHead(404);
    console.log('404');
    var n = (Math.random() * 10000) % 100;
    res.end('Not found' + (n > 66 ? '.' : (n > 33 ? '!' : '?')));
  };
}

for(var port in portServers) {
  console.log("Starting " + portServers[port].protocol + " server on port " + port + "...");
  PROTOCOL_HANDLERS[portServers[port].protocol].createServer(
    createHandler(portServers[port].endpoints)
  ).listen(port);
  console.log("Done. Installed routes: " + portServers[port].endpoints.map(function(endpoint) { return (endpoint.host || '') + endpoint.path; }).join(', '));
}
