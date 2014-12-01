/*jshint -W072 */
angular.module('DeviceWall')
  .controller('ClientController', function($rootScope, $scope, $timeout, socketConnect, $window, appConfig, $log) {
    var screensaverTimeoutPromise;
    var screensaverTimeoutSeconds = appConfig.client.screenSaverTimeoutSeconds || 60;
    var socket = socketConnect.connect('/devicewallapp');
    // Scope variables
    $scope.label = $window.localStorage.getItem('label') || '';
    $scope.oldLabel = $scope.label;
    $scope.model = '';
    $scope.platform = '';
    $scope.appPlatform = 'browser';
    $scope.version = '';
    $scope.online = '';
    $scope.batteryStatus = {level: '', isPlugged: ''};
    $scope.view = {
      label:        $scope.label === '',
      connection:   $scope.label !== '',
      screensaver:  false
    };

    $scope.showSettings = function() {
      $scope.view.label = true;
      $scope.view.connection = false;
    };

    $scope.showControlPanel = function() {
      var portString = $window.location.port.length > 0 ? ':' + $window.location.port : '';
      var url = $window.location.protocol + '//' + $window.location.hostname + portString +
        '/devices';
      $window.location.href = url;
    };

    socket.on('start', function(data) {
      socket.emit('started', $scope.label);
      if(data.labels.indexOf($window.localStorage.getItem('label')) !== -1) {
        $window.location.href = data.url;
      }
    });

    socket.on('stop', function(data) {
      $log.debug('stop: ', data);
    });


    $scope.updateLabel = function() {
      if ($scope.label) {
        $window.localStorage.setItem('label', $scope.label);

        $scope.view.label = false;
        $scope.view.connection = true;

        if ($scope.oldLabel !== '' && $scope.oldLabel !== $scope.label) {
          socket.emit('rename', {oldLabel: $scope.oldLabel, newLabel: $scope.label});
          $scope.oldLabel = $scope.label;
        } else {
          socket.emit('update', {label: $scope.label});
        }
      }
    };

    function showScreensaver() {
      $scope.view.screensaver = true;
    }

    function hideScreensaver() {
      $scope.view.screensaver = false;
    }

    function resetScreensaverCounter() {
      $timeout.cancel(screensaverTimeoutPromise);
      if ($scope.view.screensaver) {
        hideScreensaver();
      }
      screensaverTimeoutPromise = $timeout(showScreensaver, screensaverTimeoutSeconds*1000);
    }

    $scope.$on('app-activity', function() {
      resetScreensaverCounter();
    });

    resetScreensaverCounter();
    if ($scope.label) {
      socket.emit('update', {label: $scope.label});
    }

    $scope.$on('$destroy', function() {
      socket.removeAllListeners();
    });
  });
