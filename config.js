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
    protocol: 'http',
    port: 3001, // this should be 80 443 or undefined
    host: 'localhost',
    path: '/.well-known/webfinger', // this path has to be set
    ssl: {
      cert: '/etc/ssl/certs/ssl-cert-snakeoil.pem',
      key: '/etc/ssl/private/ssl-cert-snakeoil.key'
    }
  },
  storage: {
    protocol: 'http',
    port: 3002,
    host: 'localhost',
    path: '/storage/',
    ssl: {
      cert: '/etc/ssl/certs/ssl-cert-snakeoil.pem',
      key: '/etc/ssl/private/ssl-cert-snakeoil.key'
    }
  },
  protocol: 'http',
  port: 3004,
  host: 'localhost',
  ssl: {
    cert: '/etc/ssl/certs/ssl-cert-snakeoil.pem',
    key: '/etc/ssl/private/ssl-cert-snakeoil.key'
  },

  defaultUserName: 'me',
  initialTokens: {
    '4eb4b398c36e62da87469133e2f0cb3f9574d5b3865051': [':rw']
  }
}
