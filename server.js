var express = require('express'),
	bodyParser = require('body-parser'),
	fs = require('fs'),
	devices = require('./devices.json'),
	app = express();





app.use(bodyParser.urlencoded({extended: true}));





app.on('update', function() {

	fs.writeFileSync('./devices.json', JSON.stringify(devices));

	console.log('Updated devices.json');

});





app.get('/devices', function(req, res) {

	devices.sort(function(a, b) {
		if (a.identifier > b.identifier) {
			return 1;
		} else if (a.identifier < b.identifier) {
			return -1;
		}
		return 0;
	});

	res.type('application/json');
  	res.json(devices);

});





app.post('/identify', function(req, res) {

	var 
		identifier = req.body.identifier,
		name = req.body.name;

	if (!identifier || !name) {
		res.json('Invalid parameters.');
		return;
	}

	var updated = false;

	devices.forEach(function(device, index) {

		if (device.identifier == identifier) {
			device.name = name;
			updated = true;
		}

	});

	if (!updated) {
		devices.push({
			identifier: identifier,
			name: name,
			location: null,
			user: null
		});
	}

	app.emit('update');

	res.type('application/json');
	res.json('Identified succesfully.');

});





app.use(express.static(__dirname + '/dist'));

var server = app.listen(process.argv[2] || 80, function() {
    console.log('Listening on port %d', server.address().port);
});
