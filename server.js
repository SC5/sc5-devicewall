var
  express = require('express'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  expressSession = require('express-session'),
  passport = require('passport'),
  GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
  https = require('https'),
  http = require('http'),
  config = require('./config.json'),
  deviceWallApp = require('sc5-devicewall-app'),
  io;

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
require('./routes/devices.js')(adminServer, '/api/devices/:deviceLabel', './data/devices.json');

adminServer.use(express.static(__dirname + '/dist'));

// Client App uses '/client' prefix to separate requests from control panel
adminServer.use('/client', deviceWallApp);
adminServer.use('/client/return', deviceWallApp);

var admin = adminServer.listen(config.port, function () {
  console.log('Control server listening on port %d', admin.address().port);
});

// Socket IO
require('./server-socket.js')(admin, {
  config: config
});

adminServer.use('/perf-test', express.static(__dirname + '/perf-test'));
