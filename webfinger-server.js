
var helpers = require('./helpers');
var log = helpers.log, writeJSON = helpers.writeJSON;

function webfinger(req, res, urlObj) {
  log('WEBFINGER');
  if(urlObj.query['resource']) {
    userAddress = urlObj.query['resource'].substring('acct:'.length);
    userName = userAddress.split('@')[0];
  }
  var storage = webfinger.config.storage;
  var auth = webfinger.config.auth
  writeJSON(res, {
    links:[{
      href: storage.protocol+'://'+storage.host+':'+storage.port+storage.path+userName,
      rel: "remotestorage",
      properties: {
        'http://remotestorage.io/spec/version': 'draft-dejong-remotestorage-02',
        'http://tools.ietf.org/html/rfc6749#section-4.2': auth.protocol +'://'+ auth.host + ( auth.port ? ':'+auth.port : '') + auth.path + userName,
        'http://tools.ietf.org/html/rfc6750#section-2.3': false,
        'http://tools.ietf.org/html/rfc2616#section-14.16': false
      }
    }]
  });
}
module.exports = webfinger;

