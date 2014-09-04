var app = require('./app.js'),
  $ = require('jquery'),
  config = require('./config.js'),
  socket,
  user,
  devices = [],
  popupWindow;





function initializeSocket() {
  socket = io(config.SOCKET_SERVER);
  socket.on('update', function(data) {
    devices = data;
    drawDevices(data);
  });
  socket.on('start', function(data) {
    if (data.user.id === user.id) {
      $('#go').hide();
      $('#stop-testing').show();
      if ($('#open-url').is(':checked')) {
        if (popupWindow && !popupWindow.closed) {
          popupWindow.location.href = data.url;
          popupWindow.focus();
        } else {
          popupWindow = window.open(data.url, '_blank');
        }
      }
    }
  });
}





function start() {
  // Start the app here
  select();

  $(window).on('pageshow', function () {
    if (user) {
      $('#wait').hide();
      $('#content').addClass('devices');
      $('#container').removeClass('centerized');
      $('#devices').show();
    }
  });

}





function initializeUser(cb) {
  $.getJSON('/user', function (res) {
    initializeSocket();
    if (res.user) {
      user = res.user;
      cb();
    } else {
      login();
    }
  });
}





function login() {
  $('#login').show();
  $('#login-button').click(function () {
    location = '/auth/google';
  });
}





function selectAll() {
  $('input[name="uuids[]"]').not(':disabled').prop('checked', true);
}





function selectNone() {
  $('input[name="uuids[]"]').not(':disabled').removeAttr('checked');
}





function drawDevices(data) {

  var devicesList = $('#devices-list');
  devicesList.html('');

	var battery = $('<span>').html('&#128267;').html();

  $.each(data, function (key, value) {

    var rowElement = $('<tr class="device" data-uuid="' + value.uuid + '"></tr>');

    var 
    	level = value.batteryStatus.level,
    	isPlugged = value.batteryStatus.isPlugged,
    	title = level ? 'Level: ' + level + ' %' + (isPlugged ? ', plugged' : '') : '',
    	position = (level * .8 + 10) + '%',
    	stop1 = (isPlugged ? '#0f0' : '#fff') + ' ' + position,
    	stop2 = (isPlugged ? '#0c0' : '#ccc') + ' ' + position,
    	style = ' style="background-image: -webkit-linear-gradient(left, ' + stop1 + ', ' + stop2 + ');"';

    rowElement.append(
      '<td contenteditable data-key="label" title="Edit">' + value.label + '</td>' +
      '<td>' + (value.model || '') + '</td>' +
      '<td>' + (value.platform || '') + '</td>' +
      '<td>' + (value.version || '') + '</td>' +
      '<td title="' + title + '" class="battery' + (isPlugged ? ' plugged' : '') + '"><span' + style + '>' + battery + '</span></td>' +
      '<td>' + (value.userName || '') + '</td>' +
      '<td><time>' + (value.lastUsed ? moment(new Date(value.lastUsed)).fromNow() : '') + '</time></td>' +
      '<td><input type="checkbox" name="uuids[]" value="' + value.uuid + '" ' + (value.userId ? 'disabled' : '') + '></td>'
    );

    devicesList.append(rowElement);

  });

 	$('#devices-list [contenteditable]').blur(function(event) {

		var
			element = $(event.target),
			uuid = element.parent().attr('data-uuid'),
			key = element.attr('data-key'),
			value = element.text();

		$.post('/save', {uuid: uuid, key: key, value: value});

	});

	$('#devices-list [contenteditable]').keypress(function(event) {
		if (event.which == 13) {
			event.target.blur();
			return false;
		}
	});

}





function select() {

  if (!user) {
    initializeUser(select);
    return;
  }

  $('#content').addClass('devices');

  $('#devices-form').submit(selectSubmit);

  $('#url').focus(function (event) {
    if (!event.target.value) {
      event.target.value = 'http://www.';
    }
  });

  setTimeout(function () {
    $('#devices').show();
    $('#container').removeClass('centerized');
  }, 300);

  var url = localStorage.getItem('url');

  if (url) {
    $('#url').val(url);
  }

  $('#select-all').click(selectAll);
  $('#select-none').click(selectNone);

  $('#stop-testing').click(stopTesting);

  $.getJSON('/devices', function (data) {
    devices = data;
    drawDevices(data);
  });
}





function selectSubmit(event) {
  var url = $('#url').val(),
      formData = {
        "url": url,
        "uuids": $('input[name="uuids[]"]:checked').map(function(){
          return $(this).val();
        }).get(),
        "user": user
      };

  localStorage.setItem('url', url);

  socket.emit('start', formData);

  return false;
}





function getUserDevices() {
  var i,
      devicesLength = devices.length,
      userDevices = [];

  for (i = 0; i < devicesLength; i++) {
    if (devices[i].userId === user.id) {
      userDevices.push(devices[i].uuid);
    }
  }
  return userDevices;
}





function stopTesting() {
  socket.emit('stop', {user: user, uuids: getUserDevices()});
  $('#stop-testing').hide();
  $('#go').show();
}





exports = module.exports = {
  start: start
};
