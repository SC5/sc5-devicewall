var express = require('express'),
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	expressSession = require('express-session'),
	fs = require('fs'),
	browserSync = require('browser-sync'),
	passport = require('passport'),
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
	devices = require('./devices.json'),
	instances = require('./instances.json'),
	app = express(),
	users = {};

var
	GOOGLE_CLIENT_ID = '1020013470882-3u5sumpg19k4t4hm8kcltju0prl8fgud.apps.googleusercontent.com',
	GOOGLE_CLIENT_SECRET = '4-kV0DljkbtvpV4GlPIR9S3j';





app.use(cookieParser());
app.use(expressSession({secret:'devicewall12345', resave: true, saveUninitialized: true}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(passport.initialize());
app.use(passport.session());






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





passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new GoogleStrategy(
	{
		clientID: GOOGLE_CLIENT_ID,
    	clientSecret: GOOGLE_CLIENT_SECRET,
    	callbackURL: 'http://devicewall.sc5.io:8888/auth/google/callback'
	},
	function(accessToken, refreshToken, profile, done) {
		users[profile.id] = {
			id: profile.id,
			displayName: profile.displayName,
			emails: profile.emails
		};
		return done(null, true);
	}
));





app.get('/auth/google', passport.authenticate('google', {scope: 'openid profile email'}));

app.get('/auth/google/callback',
	passport.authenticate('google', {failureRedirect: '/'}),
	function(req, res) {
		console.log(req);
		res.redirect('/');
	}
);





app.get('/profile', function(req, res) {
	res.set('Cache-Control', 'no-cache');
  	res.json({profile: req.session.profile});
});





app.get('/login', function(req, res) {

	res.type('application/json');
	res.set('Cache-Control', 'no-cache');
  	res.json({user: null});

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
	res.set('Cache-Control', 'no-cache');
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
