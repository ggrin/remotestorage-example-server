var crypto = require('crypto');

var helpers = require('./helpers');
var log = helpers.log, toHtml = helpers.toHtml;

function createToken(userName, scopes, cb) {
  crypto.randomBytes(48, function(ex, buf) {
    var token = buf.toString('hex');
    var scopePaths = helpers.makeScopePaths(userName, scopes);
    log('createToken ',userName,scopes);
    log('adding ',scopePaths,' for',token);
    helpers.tokenStore.set(token, scopePaths);
    cb(token);
  });
}

function oauth(req, res, urlObj) {
  var scopes = decodeURIComponent(urlObj.query['scope']).split(' ');
  var clientId = decodeURIComponent(urlObj.query['client_id']);
  var redirectUri = decodeURIComponent(urlObj.query['redirect_uri']);
  var clientIdToMatch;
  var userName = urlObj.pathname.substring(oauth.config.auth.path.length);
  createToken(userName, scopes, function(token) {
    helpers.writeHTML(res, "Authorize!", '<a href="'+toHtml(redirectUri)+'#access_token='+helpers.toHtml(token)+'">Allow</a>');
  });
}

module.exports = oauth;
