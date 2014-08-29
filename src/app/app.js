var app = require('./app.js'),
  $ = require('jquery'),
  socket,
  user,
  devices = [];

function initializeSocket() {
  socket = io('http://devicewall.sc5.io:3000/devicewall');
  socket.on('update', function(data) {
    devices = data;
    drawDevices(data);
  });
  socket.on('start', function(data) {
    if ($('#open-url').is(':checked')) {
      window.open(data.url, '_blank');
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
  $.each(data, function (key, value) {
    var rowElement = $('<tr class="device" data-uuid="' + value.uuid + '"></tr>');

    rowElement.append(
      '<td>' + value.uuid + '</td>' +
      '<td data-key="model" title="Edit">' + (value.model || '') + '</td>' +
      '<td data-key="batteryStatus.value" title="Edit">' + (value.batteryStatus.value || '') + '</td>' +
      '<td>' + (value.userName || '') + '</td>' +
      '<td><time>' + (value.lastUsed ? moment(new Date(value.lastUsed)).fromNow() : '') + '</time></td>' +
      '<td><input type="checkbox" name="uuids[]" value="' + value.uuid + '" ' + (value.userId ? 'disabled' : '') + '></td>'
    );
    devicesList.append(rowElement);
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

  $('#container').addClass('centerized');
  $('#stop-testing').show();
  $('#go').hide();

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
  socket.emit('stop', {uuids: getUserDevices()});
  $('#stop-testing').hide();
  $('#go').show();
}

exports = module.exports = {
  start: start
};
