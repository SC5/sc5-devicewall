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
	console.log(devices);
});

app.on('update-instances', function() {
	fs.writeFileSync('./instances.json', JSON.stringify(instances));
	console.log('Updated instances.json');
	console.log(instances);
});





app.get('/devices', function(req, res) {

	devices.sort(function(a, b) {
		if (a.location > b.location) {
			return 1;
		} else if (a.location < b.location) {
			return -1;
		} else {
			if (a.label > b.label) {
				return 1;
			} else if (a.label < b.label) {
				return -1;
			}
		}
		return 0;
	});

	res.type('application/json');
  	res.json(devices);

});





app.post('/identify', function(req, res) {

	var label = req.body.label;

	if (!label) {
		res.json({message: 'Label missing.'});
		return;
	}

	var updated = false;

	devices.forEach(function(device, index) {

		if (device.label == label) {
			device.updated = +new Date();
			updated = true;
		}

	});

	if (!updated) {
		devices.push({
			label: label,
			updated: +new Date()
		});
	}

	app.emit('update-devices');

	res.type('application/json');
	res.json({message: 'Identified succesfully.'});

});





app.get('/ping', function(req, res) {

	var 
		label = req.query.label,
		user = req.query.user,
		message = {};

	instances.forEach(function(instance, index) {
		if (label) {
			if (instance.labels.indexOf(label) >= 0 && instance.browserSync && instance.updated + 10000 > (+new Date())) {
				message.address = instance.browserSync;
			}
		} else if (user) {
			if (instance.user == user && instance.browserSync) {
				message.address = instance.browserSync;
			}
		}
	});

	res.type('application/json');
  	res.json(message);

});





app.post('/start', function(req, res) {

	var 
		user = req.body.user,
		address = req.body.address,
		labels = req.body.labels || [];

	console.log(user, address, labels);

	// Updating devices

	devices.forEach(function(device, deviceIndex) {
		labels.forEach(function(label, labelIndex) {
			if (device.label == label) {
				device.user = user;
				device.last_used = +new Date();
			}
		});
	});

	app.emit('update-devices');

	// Updating instances

	var updated = false;

	instances.forEach(function(instance, index) {
		if (instance.user == user) {
			updated = true;
			instance.address = address;
			instance.labels = labels;
			instance.browserSync = null;
			instance.updated = +new Date();
		}
	});

	if (!updated) {
		instances.push({
			user: user,
			address: address,
			labels: labels,
			browserSync: null,
			updated: +new Date()
		});
	}

	app.emit('update-instances');

	// Start Browser Sync

	var bs = browserSync.init(null, {
		proxy: address,
		browser: 'disable'
	});

	bs.events.on('init', function(api) {

		instances.forEach(function(instance, index) {
			if (instance.user == user) {
				instance.browserSync = api.options.url + '/';
				instance.updated = +new Date();
			}
		});

		app.emit('update-instances');

	});

	res.type('application/json');
	res.json({message: 'Started Browser Sync'});

});





app.post('/stop', function(req, res) {

	var label = req.body.label;

	// Update device

	devices.forEach(function(device, index) {
		if (device.label == label) {
			device.user = null;
		}
	});

	app.emit('update-devices');

	res.type('application/json');
	res.json({message: 'Removed tester'});

});






app.post('/save', function(req, res) {

	var 
		label = req.body.label,
		key = req.body.key,
		value = req.body.value;

	// Update device

	devices.forEach(function(device, index) {
		if (device.label == label) {
			device[key] = value;
		}
	});

	app.emit('update-devices');

	res.type('application/json');
	res.json({message: 'Saved value'});

});





app.use(express.static(__dirname + '/dist'));

var server = app.listen(process.argv[2] || 80, function() {
	console.log('Listening on port %d', server.address().port);
});
