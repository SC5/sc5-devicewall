var app = require('./app.js'),
  $ = require('jquery'),
  socket,
  user;

function initializeSocket() {
  socket = io('http://devicewall.sc5.io:3000/devicewall');
  socket.on('update', function(data) {
    // TODO
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
  $('input[name="labels[]"]').not(':disabled').prop('checked', true);
}

function selectNone() {
  $('input[name="labels[]"]').not(':disabled').removeAttr('checked');
}

function drawDevices(data) {
  var devicesList = $('#devices-list');
  $.each(data, function (key, value) {
    var rowElement = $('<tr class="device" data-uuid="' + value.uuid + '"></tr>');

    rowElement.append(
      '<td>' + value.uuid + '</td>' +
      '<td data-key="model" title="Edit">' + (value.model || '') + '</td>' +
      '<td data-key="batteryStatus.value" title="Edit">' + (value.batteryStatus.value || '') + '</td>'
    );

    if (user.id == value.userId) {
      var
        cellElement = $('<td class="emphasize" title="Remove"></td>'),
        spanElement = $('<span>' + (value.userName || '') + '</span>');

      cellElement.click(function (event) {
        $.post('/stop', {label: value.label});

        spanElement.remove();
        cellElement.removeClass('emphasize');
        $('input[type="checkbox"][value="' + value.label + '"]').removeAttr('disabled');
        return false;

      });

      cellElement.append(spanElement);
      rowElement.append(cellElement);

    } else {
      rowElement.append('<td>' + (value.userName || '') + '</td>');
    }

    rowElement.append(
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
    drawDevices(data);
  });
}

function selectSubmit(event) {
  var url = $('#url').val(),
      formData = $('#devices-form').serialize();

  localStorage.setItem('url', url);

  $.post('/start', formData);
  socket.emit('start', formData);

  var interval = setInterval(function () {
    $.getJSON('/ping', {user_id: user.id}, function (data) {
      if (data.address) {
        clearInterval(interval);
        setTimeout(function () {
          location = data.address;
        }, 1000);
      }
    });
  }, 1000);

  $('#container').addClass('centerized');
  $('#stop-testing').show();
  $('#go').hide();

  setTimeout(function () {
    $('#devices').hide();
    $('#content').removeClass('devices');

    setTimeout(function () {
      $('#wait').show();
    }, 300);
  }, 0);

  return false;
}

function stopTesting() {
  $.post('/stop', {userId: user.id}, function () {
    $('#stop-testing').hide();
    $('#go').show();
  });
  socket.emit('stop');
}

exports = module.exports = {
  start: start
};
