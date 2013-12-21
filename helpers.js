
var helpers = {

  // bla

  toHtml: function(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },
  kv: (function() {
    var store = {};
    return {
      set: function(k, v) { store[k] = v; },
      get: function(k) { return store[k]; }
    };
  })(),
  tokenStore: {
    get: function(k) { return helpers.kv.get('token:'+k); },
    set: function(k, v) { return helpers.kv.set('token:'+k, v); }
  },
  dataStore: {
    get: function(k) { return helpers.kv.get('data:'+k); },
    set: function(k, v) { return helpers.kv.set('data:'+k, v); }
  },

  // logging (sometimes)

  log: function() {
    var x = (Math.random > 0.5 ? Math : console);
    console.log(x.log.apply(x, arguments));
  },

  // http blubb.

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
