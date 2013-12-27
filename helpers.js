
var helpers = {
  // obj helpers
  cmpObjs: function(a,b) {
    if(typeof a !== 'object' || typeof b !== 'object' )
      throw new Error("not an object "+ a +', '+ b);
    for(var k in a) {
      if(typeof a[k] == 'object' && typeof b[k] == 'object' && !helpers.cmpObjs(a[k],b[k]))
        return false;
      if(a[k] !== b[k])
        return false
    }
    for(var k in b) {
      if( !(k in a))
        return false
    }
    return true;
  },

  // html helpers

  toHtml: function(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  // storage
  kv: (function() {
    var store = {};
    return {
      set: function(k, v) { store[k] = v; },
      get: function(k) { return store[k]; },
      clear: function(prefix) { 
        if(!prefix) {
          store = {};
          return
        } 
        else {
          for(var item in store) {
            if(item.slice(prefix.length) == prefix)
              delete store[item]
          } 
        }
      }
    };
  })(),
  tokenStore: {
    get: function(k) { return helpers.kv.get('token:'+k); },
    set: function(k, v) { return helpers.kv.set('token:'+k, v); },
    clear: function() { return helpers.kv.clear('token:')}
  },
  dataStore: {
    get: function(k) { return helpers.kv.get('data:'+k); },
    set: function(k, v) { return helpers.kv.set('data:'+k, v); },
    clear: function() { return helpers.kv.clear('data:')}
  },

  // scopes
  makeScopePaths: function(userName, scopes) {
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
  },

  addToken: function(token, scope) {
    helpers.tokenStore.set(token, scope);
  },

  // logging
  _log: true,
  enableLogs: function() {
    _log = true;
  },
  disableLogs: function() {
    _log = false;
  },
  log: function() {
    if(_log)
      console.log.apply(console, arguments);
  },

  // http write

  writeHead: function(res, status, origin, revision, contentType, contentLength) {
    console.log('writeHead', status, origin, revision, contentType, contentLength);
    var headers = {
      'Access-Control-Allow-Origin': (origin?origin:'*'),
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Origin',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE',
      'Expires': '0'
    };
    if(typeof(revision) != 'undefined') {
      headers['etag']= '"'+revision.toString()+'"';
    }
    if(contentType) {
      headers['content-type']= contentType;
    }
    if(contentLength) {
      headers['content-length']= contentLength;
    }
    res.writeHead(status, headers);
  },

  writeRaw: function(res, contentType, content, origin, revision) {
    helpers.writeHead(res, 200, origin, revision, contentType, content.length);
    res.write(content);
    res.end();
  },

  writeJSON: function(res, obj, origin, revision) {
    helpers.writeRaw(res, 'application/json', JSON.stringify(obj), origin, revision);
  },

  writeHTML: function(res, title, html) {
    res.writeHead(200, {
      'content-type': 'text/html'
    });
    res.write('<!DOCTYPE html lang="en"><head><title>'+title+'</title><meta charset="utf-8"></head><body>'+html+'</body></html>');
    res.end();
  }

}

module.exports = helpers
