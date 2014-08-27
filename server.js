var express = require('express'),
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	expressSession = require('express-session'),
	fs = require('fs'),
	browserSync = require('browser-sync'),
	passport = require('passport'),
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
	app = express(),
	users = {},
	devices = [],
	instances = [];

if (fs.existsSync('./data/devices.json')) {
  devices = require('./data/devices.json');
}

if (fs.existsSync('./data/instances.json')) {
  instances = require('./data/instances.json');
}

var
	GOOGLE_CLIENT_ID = '1020013470882-3u5sumpg19k4t4hm8kcltju0prl8fgud.apps.googleusercontent.com',
	GOOGLE_CLIENT_SECRET = '4-kV0DljkbtvpV4GlPIR9S3j',
	GOOGLE_CALLBACK_URL = 'http://devicewall.sc5.io:8888/auth/google/callback';





app.use(cookieParser());
app.use(expressSession({secret:'devicewall12345', resave: true, saveUninitialized: true}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(passport.initialize());
app.use(passport.session());






app.on('update-devices', function() {
	fs.writeFileSync('./data/devices.json', JSON.stringify(devices));
	console.log('Updated devices.json');
	console.log(devices);
});

app.on('update-instances', function() {
	fs.writeFileSync('./data/instances.json', JSON.stringify(instances));
	console.log('Updated instances.json');
	console.log(instances);
});





passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	done(null, users[id]);
});

passport.use(new GoogleStrategy(
	{
		clientID: GOOGLE_CLIENT_ID,
    	clientSecret: GOOGLE_CLIENT_SECRET,
    	callbackURL: GOOGLE_CALLBACK_URL
	},
	function(accessToken, refreshToken, profile, done) {
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
	function(req, res) {
		res.redirect('/');
	}
);





app.get('/user', function(req, res) {
	res.set('Cache-Control', 'no-cache');
  	res.json({user: req.user});
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

	res.json({message: 'Identified succesfully.'});

});





app.get('/ping', function(req, res) {

	var
		label = req.query.label,
		userId = req.query.user_id,
		message = {};

	instances.forEach(function(instance, index) {
		if (label) {
			if (instance.labels.indexOf(label) >= 0 && instance.browserSync && instance.updated + 10000 > (+new Date())) {
				message.address = instance.browserSync;
			}
		} else if (userId) {
			if (instance.userId == userId && instance.browserSync) {
				message.address = instance.browserSync;
			}
		}
	});

  	res.json(message);

});





app.post('/start', function(req, res) {

	var
		user = req.user,
		address = req.body.address,
		labels = req.body.labels || [];

	// Updating devices

	devices.forEach(function(device, deviceIndex) {
		labels.forEach(function(label, labelIndex) {
			if (device.label == label) {
				device.userId = user.id;
				device.userName = user.displayName;
				device.lastUsed = +new Date();
			}
		});
	});

	app.emit('update-devices');

	// Updating instances

	var updated = false;

	instances.forEach(function(instance, index) {
		if (instance.userId == user.id) {
			updated = true;
			instance.address = address;
			instance.labels = labels;
			instance.browserSync = null;
			instance.updated = +new Date();
		}
	});

	if (!updated) {
		instances.push({
			userId: user.id,
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
		browser: 'disable',
    ghostMode: {
        clicks: true,
        location: true,
        forms: true,
        scroll: true
    }
	});

	bs.events.on('init', function(api) {
		instances.forEach(function(instance, index) {
			if (instance.userId == user.id) {
				instance.browserSync = api.options.urls.external;
				instance.updated = +new Date();
			}
		});

		app.emit('update-instances');

	});

	res.json({message: 'Started Browser Sync'});

});





app.post('/stop', function(req, res) {

	var label = req.body.label,
	    userId = req.body.userId;

	// Update device

	devices.forEach(function(device, index) {
		if (device.label === label || device.userId === userId) {
			device.userId = null;
			device.userName = null;
		}
	});

	app.emit('update-devices');

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

	res.json({message: 'Saved value'});

});





app.use(express.static(__dirname + '/dist'));

var server = app.listen(process.argv[2] || 80, function() {
	console.log('Express server listening on port %d', server.address().port);
});



// Socket.io server

var io = require('socket.io')();

io.on('connection', function(socket) {

  console.log('Devicewall client connected!');

  socket.on('ferret', function (data, fn) {
		console.log("UUID: " + data.uuid + "\nUserAgent: " + data.userAgent);
		fn({url: 'http://localhost', user: 'Thomson'});
		//socket.send()
  });

});

io.on('disconnect', function() {
    console.log('Devicewall connection dropped.');
});


function send(message, data) {
	io.emit('messages', {message: message, data: data});
	console.log('Message sent.');
}

io.listen(2000);
console.log('Socket.io server listening on port 2000');
