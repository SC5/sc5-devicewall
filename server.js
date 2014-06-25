var express = require('express'),
	bodyParser = require('body-parser'),
	fs = require('fs'),
	browserSync = require('browser-sync'),
	devices = require('./devices.json'),
	instances = require('./instances.json'),
	app = express();





app.use(bodyParser.urlencoded({extended: true}));





app.on('update-devices', function() {
	fs.writeFileSync('./devices.json', JSON.stringify(devices));
	console.log('Updated devices.json');
});

app.on('update-instances', function() {
	fs.writeFileSync('./instances.json', JSON.stringify(instances));
	console.log('Updated instances.json');
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

	app.emit('update-devices');

	res.type('application/json');
	res.json('Identified succesfully.');

});





app.get('/ping', function(req, res) {

	var 
		label = req.query.label,
		pong = {};

	instances.forEach(function(instance, index) {
		if (instance.devices.indexOf(label) >= 0 && instance.browserSync) {
			pong.address = instance.browserSync;
		}
	});

	res.type('application/json');
  	res.json(pong);

});





app.post('/start', function(req, res) {

	var 
		user = req.body.user,
		address = req.body.address,
		devices = req.body.devices || [];

	console.log(user, address, devices);

	var updated = false;

	instances.forEach(function(instance, index) {
		if (instance.user == user) {
			updated = true;
			instance.address = address;
			instance.devices = devices;
			instance.browserSync = null;
		}
	});

	if (!updated) {
		instances.push({
			user: user,
			address: address,
			devices: devices,
			browserSync: null
		});
	}

	app.emit('update-instances');


	var bs = browserSync.init(null, {
		server: {
			baseDir: 'browsersync'
		}
	});

	bs.events.on('init', function(api) {

		instances.forEach(function(instance, index) {
			if (instance.user == user) {
				instance.browserSync = api.options.url;
			}
		});

		app.emit('update-instances');

	});

	res.type('application/json');
	res.json('Started Browser Sync.');

});





app.use(express.static(__dirname + '/dist'));

var server = app.listen(process.argv[2] || 80, function() {
	console.log('Listening on port %d', server.address().port);
});
