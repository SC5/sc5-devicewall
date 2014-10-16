var
  express = require('express'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  expressSession = require('express-session'),
  browserSync = require('browser-sync'),
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

adminServer.use(express.static(__dirname + '/dist'));

var admin = adminServer.listen(config.controlPort, function () {
  console.log('Control server listening on port %d', admin.address().port);
});
// Admin server ends

// Socket.io server starts
io = require('socket.io')(admin);
require('./server-socket.js')(adminServer, {
  config: config,
  io: io
});

// Start server
io.listen(config.socketPort);
console.log('Socket.io server listening on port %d', config.socketPort);
// Socket.io server ends

// App server starts
var appServer = express();
appServer.use(deviceWallApp);
appServer.use('/return', deviceWallApp);
appServer.use('/main', deviceWallApp);

var app = appServer.listen(config.clientPort, function () {
  console.log('Client server listening on port %d', app.address().port);
});
// App server ends
