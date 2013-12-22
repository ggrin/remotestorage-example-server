exports.config = {
  protocol: 'https',
  port: 443,
  host: 'localhost',
  ssl: {
    cert: 'certs/localhost.cert',
    key: 'certs/localhost.key'
  },

  defaultUserName: 'me',
  initialTokens: {
    '4eb4b398c36e62da87469133e2f0cb3f9574d5b3865051': [':rw']
  },

  auth: {
    // these default to the global values:
    //protocol: 'https',
    //port: 443,
    //host: 'localhost',
    //ssl: {...},
    
    // the path defaults to the service name, like this:
    //path: '/auth/'
  },

  webfinger: {
    // see 'auth' section for available options
    path: '/.well-known/webfinger' // !important this path has to be set to exactly this
  },

  storage: {
    // see 'auth' section for available options
  }
}
