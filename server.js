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
		if (a.label > b.label) {
			return 1;
		} else if (a.label < b.label) {
			return -1;
		}
		return 0;
	});

	res.type('application/json');
  	res.json(devices);

});





app.post('/identify', function(req, res) {

	var 
		label = req.body.label,
		name = req.body.name;

	if (!label || !name) {
		res.json('Invalid parameters.');
		return;
	}

	var updated = false;

	devices.forEach(function(device, index) {

		if (device.label == label) {
			device.name = name;
			updated = true;
		}

	});

	if (!updated) {
		devices.push({
			label: label,
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
