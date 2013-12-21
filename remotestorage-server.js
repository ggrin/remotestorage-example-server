var fs = require('fs');
var  url = require('url');
var crypto = require('crypto');
var helpers = require('./helpers');
var writeJSON = helpers.writeJSON;
var writeHead = helpers.writeHead;
var writeRaw = helpers.writeRaw;
var log = helpers.log;

exports.createServer = function(tokenStore, dataStore) {

  function mayRead(authorizationHeader, path) {
    if(authorizationHeader) {
      var scopes = tokenStore.get(authorizationHeader.substring('Bearer '.length));
      if(scopes) {
        for(var i=0; i<scopes.length; i++) {
          var scopeParts = scopes[i].split(':');
          if(path.substring(0, scopeParts[0].length)==scopeParts[0]) {
            return true;
          } else {
            log(path.substring(0, scopeParts[0].length)+' != '+ scopeParts[0]);
          }
        }
      }
    } else {
      var pathParts = path.split('/');
      console.log('pathParts are', pathParts);
      return (pathParts[0]=='me' && pathParts[1]=='public' && path.substr(-1) != '/');
    }
  }

  function mayWrite(authorizationHeader, path) { 
    if(path.substr(-1)=='/') {
      return false;
    }
    if(authorizationHeader) {
      var scopes = tokenStore.get(authorizationHeader.substring('Bearer '.length));
      if(scopes) {
        for(var i=0; i<scopes.length; i++) {
          var scopeParts = scopes[i].split(':');
          if(scopeParts.length==2 && scopeParts[1]=='rw' && path.substring(0, scopeParts[0].length)==scopeParts[0]) {
            return true;
          }
        }
      }
    }
  }

  function give404(res, origin) {
    log('404');
    computerSaysNo(res, origin, 404);
    res.end();
  }

  function computerSaysNo(res, origin, status, timestamp) {
    log('COMPUTER_SAYS_NO - '+status);
    var errorMsg = {
      304: '304 Not Modified',
      401: '401 Unauthorized',
      404: '404 Not Found'
    };
    if(!errorMsg[status]) {
      errorMsg[status] = status + ' Computer says no';
    }
    writeHead(res, status, origin, timestamp, 'text/plain', errorMsg[status].length);
    res.end(errorMsg[status]);
  }

  function getVersion(path) {
    if(dataStore.get('version:'+path)) {
      return dataStore.get('version:'+path);
    }
    if(path.substr(-1)=='/') {
      return 'empty-dir';
    }
  }

  function condMet(cond, path) {
    if(cond.ifNoneMatch=='*') {//if-none-match is either '*'...
      if(dataStore.get('content:'+path)) {
        return false;
      }
    } else if(cond.ifNoneMatch && getVersion(path)) {//or a comma-separated list of etags
      if(cond.ifNoneMatch.split(',').indexOf(String('"'+getVersion(path)+'"'))!=-1) {
        return false;
      }
    }
    if(cond.ifMatch) {//if-match is always exactly 1 etag
      console.log(path, cond.ifMatch, dataStore);
      if(String('"'+dataStore.get('version:'+path)+'"') != cond.ifMatch) {
        return false;
      }
    }
    return true;
  }

  function toJsonLd(revisions) {
    var items = {};
    for(var i in revisions) {
      items[i] = { ETag: revisions[i] };
    }
    return {
      '@context': 'http://remotestorage.io/spec/folder-description',
      items: items
    };
  }

  function storage(req, res) {
    var urlObj =  url.parse(req.url, true);
    var path=urlObj.pathname.substring('/storage/'.length);
    var cond = {
      ifNoneMatch: req.headers['if-none-match'],
      ifMatch: req.headers['if-match']
    };
    var capt = {
      method: req.method,
      path: path
    };

    switch(req.method) {
    case 'OPTIONS':
      log('OPTIONS ', req.headers);
      writeHead(res, 204, req.headers.origin);
      res.end();
      break;

    case 'HEAD':
    case 'GET':
      log(req.method);
      // check access
      if(!mayRead(req.headers.authorization, path)) {
        computerSaysNo(res, req.headers.origin, 401);
        // check conditions
      } else if(!condMet(cond, path)) {
        computerSaysNo(res, req.headers.origin, 304, dataStore.get('version:'+path));
        // assemble response head
      } else {
        if(dataStore.get('content:'+path)) {
          if(path.substr(-1)=='/') {
            writeJSON(res, toJsonLd(dataStore.get('content:'+path)), req.headers.origin, dataStore.get('version:'+path), cond);
          } else {
            writeRaw(res, dataStore.get('contentType:'+path), req.method === 'GET' ? dataStore.get('content:'+path) : '', req.headers.origin, dataStore.get('version:'+path), cond);
          }
        } else {
          if(path.substr(-1) == '/') {//empty dir
            writeJSON(res, {}, req.headers.origin, getVersion(path), cond);
          } else {
            give404(res, req.headers.origin);
          }
        }
      }
      break;

    case 'PUT':
      log('PUT');
      if(path.substr(-1)=='/') {
        computerSaysNo(res, req.headers.origin, 400);
      } else if(!mayWrite(req.headers.authorization, path)) {
        computerSaysNo(res, req.headers.origin, 401);
      } else if(!condMet(cond, path)) {
        computerSaysNo(res, req.headers.origin, 412, dataStore.get('version:'+path));
      } else {
        var dataStr = '';
        req.on('data', function(chunk) {
          dataStr+=chunk;
        });
        req.on('end', function() {
          var timestamp = new Date().getTime();
          dataStore.set('content:'+path, dataStr);
          dataStore.set('contentType:'+path, req.headers['content-type']);
          log('stored '+path, dataStore.get('content:'+path), dataStore.get('contentType:'+path));
          dataStore.set('version:'+path, timestamp);
          var pathParts=path.split('/');
          log(pathParts);
          var fileItself=true;
          while(pathParts.length > 1) {
            var thisPart = pathParts.pop();
            if(fileItself) {
              fileItself=false;
            } else {
              thisPart += '/';
            }
            var obj = dataStore.get('content:'+pathParts.join('/')+'/');
            if(!obj) {
              obj = {};
            }
            obj[thisPart] = timestamp;
            dataStore.set('content:'+pathParts.join('/')+'/', obj);
            dataStore.set('version:'+pathParts.join('/')+'/', timestamp);
          }
          writeJSON(res, null, req.headers.origin, timestamp);
        });
      }
      break;

    case 'DELETE':
      log('DELETE');
      if(path.substr(-1)=='/') {
        computerSaysNo(res, req.headers.origin, 400);
      } else if(!mayWrite(req.headers.authorization, path)) {
        computerSaysNo(res, req.headers.origin, 401);
      } else if(!condMet(cond, path)) {
        computerSaysNo(res, req.headers.origin, 412, dataStore.get('version:'+path));
      } else if(typeof(dataStore.get('content:'+path)) == 'undefined') {
        computerSaysNo(res, req.headers.origin, 404);
      } else {
        var timestamp = dataStore.get('version:'+path);
        dataStore.set('content:'+path, undefined);
        dataStore.set('contentType:'+path, undefined);
        dataStore.set('version:'+path, undefined);
        var pathParts=path.split('/');
        var thisPart = pathParts.pop();
        while(1) {
          var parentPath = pathParts.join('/') + '/';
          var parentListing = dataStore.get('content:'+parentPath);
          log('delete content[' + parentPath + ']['+thisPart+']');
          delete parentListing[thisPart];
          if(Object.keys(parentListing).length != 0 ||
             pathParts.length == 1) {
            dataStore.set('version:'+parentPath, new Date().getTime());
            break;
          } else {
            dataStore.set('content:'+parentPath, undefined);
            dataStore.set('version:'+parentPath, undefined);
            thisPart = pathParts.pop() + '/';
          }
        }
        writeJSON(res, null, req.headers.origin, timestamp);
      }
      break;

    default:
      log('ILLEGAL '+req.method);
      computerSaysNo(res, req.headers.origin, 405);
    }
  }

  return storage;
};
