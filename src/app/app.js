var app = require('./app.js'),
    $ = require('jquery'),
    USER;





function start() {

	// Start the app here

	var device = localStorage.getItem('device');

	if (device == 1) {

		select();

	} else if (device == 2) {

		identify();

	} else {

		$('#device-type').show();

		$('#pc').click(function() {
			$('#device-type').hide();
			localStorage.setItem('device', 1);
			select();
			return false;
		});

		$('#mobile').click(function() {
			$('#device-type').hide();
			localStorage.setItem('device', 2);
			identify();
			return false;
		});

	}

}





function initializeUser(cb) {

	$.getJSON('/user', function(res) {

		if (res.user) {

			USER = res.user;

			cb();

		} else {

			login();

		}

	});

}





function login() {

	$('#login').show();

}






function select() {

	if (!USER) {
		initializeUser(this);
		return;
	}

	$('#content').addClass('pc devices');

	$('#devices-form').submit(selectSubmit);

	$('#address').focus(function(event) {
		if (!event.target.value) {
			event.target.value = 'http://www.';
		}
	});

	setTimeout(function() {
		$('#devices').show();
		$('#container').removeClass('centerized');
	}, 300);

	var 
		user = localStorage.getItem('user'),
		address = localStorage.getItem('address');

	if (user) {
		$('#user').val(user);
	}

	if (address) {
		$('#address').val(address);
	}

	var devicesList = $('#devices-list');

	$.getJSON('/devices', function(data) {

		$.each(data, function(key, value) {

    		var rowElement = $('<tr class="device" data-label="' + value.label + '"></tr>');

			rowElement.append(    		
				'<td>' + value.label + '</td>' + 
				'<td contenteditable data-key="name" title="Edit">' + (value.name || '') + '</td>' + 
				'<td contenteditable data-key="model" title="Edit">' + (value.model || '') + '</td>' + 
				'<td contenteditable data-key="os" title="Edit">' + (value.os || '') + '</td>' + 
				'<td contenteditable data-key="serial" title="Edit">' + (value.serial || '') + '</td>' + 
				'<td contenteditable data-key="imei" title="Edit">' + (value.imei || '') + '</td>' + 
				'<td contenteditable data-key="location" title="Edit">' + (value.location || '') + '</td>' + 
				'<td contenteditable data-key="owner" title="Edit">' + (value.owner || '') + '</td>'
			);

			if (user && user == value.user) {

				var 
					cellElement = $('<td class="emphasize" title="Remove"></td>'),
					spanElement = $('<span>' + (value.user || '') + '</span>');

				cellElement.click(function(event) {

					$.post('/stop', {label: value.label});

					spanElement.remove();
					cellElement.removeClass('emphasize');

					return false;

				});

				cellElement.append(spanElement);
				rowElement.append(cellElement);

			} else {
				rowElement.append('<td>' + (value.user || '') + '</td>');
			}

			rowElement.append(
				'<td><time>' + (value.last_used ? moment(new Date(value.last_used)).format('YYYY-MM-DD HH:mm:ss') : '') + '</time></td>' +
				'<td><input type="checkbox" name="labels[]" value="' + value.label + '"></td>'
    		);

	    	devicesList.append(rowElement);

		});

		$('#devices-list [contenteditable]').blur(function(event) {

			var
				element = $(event.target),
				label = element.parent().attr('data-label'),
				key = element.attr('data-key'),
				value = element.text();

			$.post('/save', {label: label, key: key, value: value});

		});

		$('#devices-list [contenteditable]').keypress(function(event) {
			if (event.which == 13) {
				event.target.blur();
				return false;
			}
		});

	});

}





function selectSubmit(event) {

	var 
		user = $('#user').val(),
		address = $('#address').val();

	localStorage.setItem('user', user);
	localStorage.setItem('address', address);

	$.post('/start', $('#devices-form').serialize());

	var interval = setInterval(function() {
		$.getJSON('/ping', {user: user}, function(data) {
			if (data.address) {
				clearInterval(interval);
				setTimeout(function() {
					location = data.address;
				}, 1000);
			}
		});
	}, 1000);

	$('#container').addClass('centerized');

	setTimeout(function() {

		$('#devices').hide();
		$('#content').removeClass('devices');

		setTimeout(function() {
			$('#wait').show();
		}, 300);

	}, 0);


	return false;

}





function identify() {

	$('#content').addClass('mobile');

	$('#identify-form').submit(identifySubmit);

	$('#identify').show();

	var label = localStorage.getItem('label');

	$('#label').val(label);

	return false;

}





function identifySubmit(event) {

	var label = $('#label').val();

	localStorage.setItem('label', label);

	$.post('/identify', {label: label});

	$('#identify').hide();
	$('#wait').show();

	var interval = setInterval(function() {
		$.getJSON('/ping', {label: label}, function(data) {
			if (data.address) {
				clearInterval(interval);
				setTimeout(function() {
					location = data.address;
				}, 1000);
			}
		});
	}, 1000);

	return false;

}





exports = module.exports = {
  start: start
};
