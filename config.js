exports.config = {
  auth: {
    protocol: 'http',
    port: 3000,
    host: 'localhost',
    path: '/auth/',
    ssl: {
      cert: '/etc/ssl/certs/ssl-cert-snakeoil.pem',
      key: '/etc/ssl/private/ssl-cert-snakeoil.key'
    }
  },
  webfinger: {
    protocol: 'https',
    port: 3002, // this should be 80 443 or undefined
    host: 'local.dev',
    path: '/.well-known/webfinger', // this path has to be set
    ssl: {
      cert: 'certs/local-dev.cert',
      key: 'certs/local-dev.key'
    }
  },
  storage: {
    protocol: 'https',
    port: 3002,
    host: 'localhost',
    path: '/storage/',
    ssl: {
      cert: 'certs/localhost.cert',
      key: 'certs/localhost.key'
    }
  },
  protocol: 'http',
  port: 3004,
  host: 'localhost',
  ssl: {
    cert: 'certs/localhost.cert',
    key: 'certs/localhost.key'
  },

  defaultUserName: 'me',
  initialTokens: {
    '4eb4b398c36e62da87469133e2f0cb3f9574d5b3865051': [':rw']
  }
}
