export default {
  env: 'test',
  jwt: {
    secret: '382a4b7a5745454f3b44346d27744b2d305b3b58394f4d75375e7d7670',
    expiresInSeconds: 86400
  },
  email: {
    user: 'felix.in.tum',
    pass: 'hYW7qHj9sfBkvyzVt2jW',
    host: 'imap.gmail.com',
    port: 993
  },
  db: 'mongodb://localhost:27017/emailapp',
  port: 4000
};
