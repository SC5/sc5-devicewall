var app = require('./app.js'),
  $ = require('jquery'),
  config = require('./config.js'),
  socket,
  user,
  devices = [],
  popupWindow;





function initializeSocket() {
  socket = io(config.SOCKET_SERVER);
  socket.on('update', function (data) {
    devices = data;
    drawDevices(data);
  });
  socket.on('start', function (data) {
    if (data.user.id === user.id) {
      $('#go').html('Go').hide().prop('disabled', false);
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

  socket.on('server-stop', function(data) {
    if (data.user.id === user.id) {
      $('#go').prop('disabled', false);
    }
  });
}





function start() {

  // Start the app here

  initializeSocket();

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





function initializeUser(fn) {

  if (config.loginType == 1) {

    // Google Auth login

    $.getJSON('/user', function (res) {
      if (res.user) {
        user = res.user;
        fn();
      } else {
        login();
      }
    });

  } else if (config.loginType == 2) {

    // Nick name login
    identify(fn);

  }

}




function identify(fn) {

  $('#identify').show();
  var name = localStorage.getItem('name');

  if (name) {
    $('#name').val(name);
  }

  $('#name').keyup(function (event) {
    var name = $('#name').val();
    $('#identify-button').attr('disabled', !name);
  });

  $('#identify-button').attr('disabled', !name);

  $('#identify-form').submit(function () {

    $('#identify').hide();

    var name = $('#name').val();
    localStorage.setItem('name', name);

    user = {
      id: name,
      displayName: name
    };

    fn();

    return false;

  });

}





function login() {
  $('#login').show();
  $('#login-button').click(function () {
    location = '/auth/google';
  });
}





function selectAll() {
  $('input[name="labels[]"]').not(':disabled').prop('checked', true);
}





function selectNone() {
  $('input[name="labels[]"]').not(':disabled').removeAttr('checked');
}





function drawDevices(data) {

  var devicesList = $('#devices-list'),
      battery = $('<span>').html('&#128267;').html(),
      trash = $('<span>').html('&#59177;').html();

  devicesList.html('');

  $.each(data, function (key, value) {

    var rowElement = $('<tr class="device" data-label="' + value.label + '"></tr>');

    var
      level = value.batteryStatus ? value.batteryStatus.level : null,
      isPlugged = value.batteryStatus ? value.batteryStatus.isPlugged : null,
    	title = level ? 'Level: ' + level + ' %' + (isPlugged ? ', plugged' : '') : '',
      position = level ? (level * 0.8 + 10) + '%' : '',
    	stop1 = (isPlugged ? '#0f0' : '#fff') + ' ' + position,
    	stop2 = (isPlugged ? '#0c0' : '#ccc') + ' ' + position,
    	style = ' style="background-image: -webkit-linear-gradient(rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, .3) 80%), -webkit-linear-gradient(left, ' + stop1 + ', ' + stop2 + ');"';

    rowElement.append(
      '<td contenteditable data-key="label" title="Edit">' + value.label + '</td>' +
      '<td contenteditable data-key="model" title="Edit">' + (value.model || '') + '</td>' +
      '<td contenteditable data-key="platform" title="Edit">' + (value.platform || '') + '</td>' +
      '<td contenteditable data-key="version" title="Edit">' + (value.version || '') + '</td>' +
      (level ? '<td title="' + title + '" class="battery' + (isPlugged ? ' plugged' : '') + '"><span' + style + '>' + battery + '</span></td>' : '<td></td>') +
      '<td>' + (value.userName || '') + '</td>' +
      '<td><time>' + (value.lastUsed ? moment(new Date(value.lastUsed)).fromNow() : '') + '</time></td>' +
      '<td><input type="checkbox" name="labels[]" value="' + value.label + '" ' + (value.userId ? 'disabled' : '') + '></td>' +
      '<td class="remove"><span>' + trash + '</span></td>'
    );

    devicesList.append(rowElement);

  });

 	$('#devices-list [contenteditable]').blur(function (event) {

		var
			element = $(event.target),
      label = element.parent().attr('data-label'),
			key = element.attr('data-key'),
      value = element.text(),
      labelIsUnique = true;

    if (key === 'label') {
      if (label !== value) {
        for (var i = 0; i < devices.length; i++) {
          if (devices[i].label === value) {
            labelIsUnique = false;
          }
        }
      }
    }

    if (!labelIsUnique) {
      element.text(label);
    } else {
      $.post('/save', {label: label, key: key, value: value});
    }

	});

	$('#devices-list [contenteditable]').keypress(function (event) {
		if (event.which == 13) {
			event.target.blur();
			return false;
		}
	});

  $('#devices-list .remove').click(function(event) {
    socket.emit('remove', {labels: [$(this).parent().attr('data-label')]});
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

  $('#go').attr('disabled', !url);

  $.getJSON('/devices', function (data) {
    devices = data;
    drawDevices(data);
  });

}





function selectSubmit(event) {

  if ($('#go').is(":disabled")) {
    return false;
  }

  var url = $('#url').val(),
      formData = {
        url: url,
        labels: $('input[name="labels[]"]:checked').map(function () {
          return $(this).val();
        }).get(),
        user: user
      };

  $('#go').prop("disabled", true).html('<img src="assets/images/spiffygif_48x48.gif">');

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
      userDevices.push(devices[i].label);
    }
  }

  return userDevices;

}





function stopTesting() {
  socket.emit('stop', {user: user, labels: getUserDevices()});
  $('#stop-testing').hide();
  $('#go').prop('disabled', true).show();
}





exports = module.exports = {
  start: start
};
