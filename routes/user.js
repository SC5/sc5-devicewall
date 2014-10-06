module.exports = function (app) {
  app.get('/user', function (req, res) {
    res.set('Cache-Control', 'no-cache');
    res.json({user: req.user});
  });
};
