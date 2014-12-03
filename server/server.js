var
  express = require('express'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  expressSession = require('express-session'),
  passport = require('passport'),
  GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
  https = require('https'),
  http = require('http'),
  config = require('../config.json'),
  url = require('url'),
  fs = require('fs'),
  io;

if (process.env.NODE_ENV === "test") {
  config = require('../config.test.json');
  if (fs.existsSync(config.devicesJson)) {
    fs.unlinkSync(config.devicesJson);
  }
  if (fs.existsSync(config.instancesJson)) {
    fs.unlinkSync(config.instancesJson);
  }
}

https.globalAgent.maxSockets = config.maxSockets || 5;
http.globalAgent.maxSockets = config.maxSockets || 5;

// Admin server starts
var adminServer = express();
adminServer.use(cookieParser());
adminServer.use(expressSession({secret: config.sessionKey, resave: true, saveUninitialized: true}));
adminServer.use(bodyParser.urlencoded({extended: true}));
adminServer.use(passport.initialize());
adminServer.use(passport.session());

require('./routes/auth.js')(adminServer, {
  config: config,
  passport: passport,
  GoogleStrategy: GoogleStrategy
});
require('./routes/user.js')(adminServer);
require('./routes/devices.js')(adminServer, '/api/devices/:deviceLabel', config.devicesJson);

// Performance testing
adminServer.use('/perf-test', express.static(__dirname + '/perf-test'));

// Testing
if (process.env.NODE_ENV === "test") {
  require('./routes/test.js')(adminServer);
}

adminServer.use(express.static(__dirname + '/../dist'));
adminServer.use('/*', express.static(__dirname + '/../dist'));

// HTTPS
var options = {
  key: fs.readFileSync(config.sslKey, 'utf8'),
  cert: fs.readFileSync(config.sslCert, 'utf8')
};
var server;
if (config.protocol === 'https') {
  server = https.createServer(options, adminServer);
} else {
  server = http.createServer(adminServer);
}

server.listen(config.port, function () {
  console.log('Control server listening on port %d', config.port);
});

// Socket IO
require('./socket.js')(server, {
  config: config
});
