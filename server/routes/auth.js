module.exports = function (app, options) {
  var config = options.config,
      passport = options.passport,
      GoogleStrategy = options.GoogleStrategy,
      users = {};

  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    done(null, users[id]);
  });

  passport.use(new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL
    },
    function (accessToken, refreshToken, profile, done) {
      var
        userId = profile.id,
        user = {
          id: userId,
          displayName: profile.displayName,
          emails: profile.emails
        };
      users[userId] = user;
      return done(null, user);
    }
  ));

  app.get('/auth/google', passport.authenticate('google', {scope: 'openid profile email'}));

  app.get('/auth/google/callback',
    passport.authenticate('google', {failureRedirect: '/'}),
    function (req, res) {
      res.redirect('/');
    }
  );
};