var
  express = require('express'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  expressSession = require('express-session'),
  browserSync = require('browser-sync'),
  passport = require('passport'),
  GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
  app = express(),
  config = require('./config.json'),
  HTTP_PORT = process.env.HTTP_PORT || 8888,
  SOCKET_PORT = process.env.SOCKET_PORT || 3000,
  server,
  io;

app.use(cookieParser());
app.use(expressSession({secret: config.sessionKey, resave: true, saveUninitialized: true}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(passport.initialize());
app.use(passport.session());

require('./routes/auth.js')(app, {
  config: config,
  passport: passport,
  GoogleStrategy: GoogleStrategy
});
require('./routes/user.js')(app);

app.use(express.static(__dirname + '/dist'));

server = app.listen(HTTP_PORT, function () {
  console.log('Express server listening on port %d', server.address().port);
});

// Socket.io server
io = require('socket.io')(server);
require('./server-socket.js')(app, {
  config: config,
  io: io
});

// Start server
io.listen(SOCKET_PORT);
console.log('Socket.io server listening on port %d', SOCKET_PORT);
