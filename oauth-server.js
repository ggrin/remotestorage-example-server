var crypto = require('crypto');

var helpers = require('./helpers');
var log = helpers.log, toHtml = helpers.toHtml;

function makeScopePaths(userName, scopes) {
  var scopePaths=[];
  for(var i=0; i<scopes.length; i++) {
    var thisScopeParts = scopes[i].split(':');
    if(thisScopeParts[0]=='*') {
      scopePaths.push(userName+'/:'+thisScopeParts[1]);
    } else {
      scopePaths.push(userName+'/'+thisScopeParts[0]+'/:'+thisScopeParts[1]);
      scopePaths.push(userName+'/public/'+thisScopeParts[0]+'/:'+thisScopeParts[1]);
    }
  }
  return scopePaths;
}

function createToken(userName, scopes, cb) {
  crypto.randomBytes(48, function(ex, buf) {
    var token = buf.toString('hex');
    var scopePaths = makeScopePaths(userName, scopes);
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
