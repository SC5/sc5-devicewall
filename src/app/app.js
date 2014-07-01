var app = require('./app.js'),
    $ = require('jquery');





function start() {
	// Start the app here

	$('#pc').click(select);
	$('#mobile').click(identify);

}





function select(event) {

	event.stopPropagation();

	$('#content').addClass('pc');

	$('#devices-form').submit(selectSubmit);

	$('#buttons').hide();

	$('#content').addClass('devices');

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

    		var rowElement = $('<tr class="device"></tr>');

			rowElement.append(    		
				'<td>' + value.label + '</td>' + 
				'<td>' + value.name + '</td>' + 
				'<td>' + (value.location || '-') + '</td>'
			);

			if (user == value.user) {

				var 
					cellElement = $('<td></td>'),
					anchorElement = $('<a href="" title="Remove">' + (value.user || '-') + '</a>');

				anchorElement.click(function(event) {

					event.stopPropagation();

					$.post('/stop', {label: value.label});

					anchorElement.remove();
					cellElement.append('-');

					return false;

				});

				cellElement.append(anchorElement);
				rowElement.append(cellElement);

			} else {
				rowElement.append('<td>' + (value.user || '-') + '</td>');
			};

			rowElement.append(
				'<td>' + (value.last_used ? moment(new Date(value.last_used)).format('YYYY-MM-DD HH:mm:ss') : '-') + '</td>' +
				'<td><input type="checkbox" name="labels[]" value="' + value.label + '"></td>'
    		);

	    	devicesList.append(rowElement);

		});

	});

}





function selectSubmit(event) {

	event.stopPropagation();

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





function identify(event) {

	event.stopPropagation();

	$('#content').addClass('mobile');

	$('#identify-form').submit(identifySubmit);

	$('#buttons').hide();
	$('#identify').show();

	var 
		name = localStorage.getItem('name'),
		label = localStorage.getItem('label');

	if (!name) {
		name = navigator.userAgent;
	}

	$('#name').val(name);
	$('#label').val(label);

	return false;

}





function identifySubmit(event) {

	event.stopPropagation();

	var 
		name = $('#name').val(),
		label = $('#label').val();

	localStorage.setItem('name', name);
	localStorage.setItem('label', label);

	$.post('/identify', {name: name, label: label});

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
