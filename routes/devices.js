var fs = require('fs');

module.exports = function (app, path, devicesFile) {
  function send404(res, reason) {
    res.status(404).json({error: reason});
  }
  app.get(path, function (req, res) {
    var deviceLabel = req.param('deviceLabel');
    fs.exists(devicesFile, function (exists) {
      if (exists) {
        fs.readFile(devicesFile, function (err, data) {
          if (err) {
            send404(res, err.getMessage());
          } else {
            var deviceList = JSON.parse(data);
            if (deviceList.length > 0) {
              var found = false;
              for (var i = 0; i < deviceList.length; ++i) {
                if (deviceList[i].label === deviceLabel) {
                  console.log("device found");
                  res.json(deviceList[i]);
                  found = true;
                }
              }
              if (found === false) {
                console.log("device NOT found");
                send404(res, 'device not found');
              }
            }
          }
        });
      } else {
        send404(res, "devices not found from " + devicesFile);
      }
    });
  });
};
