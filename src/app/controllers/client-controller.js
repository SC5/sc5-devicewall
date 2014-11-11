/*jshint -W072 */
angular.module('DeviceWall')
  .controller('ClientController', function($rootScope, $scope, $timeout, socketConnect, $window, appConfig, $log) {
    var screensaverTimeoutPromise;
    var screensaverTimeoutSeconds = appConfig.client.screenSaverTimeoutSeconds || 60;
    var socket = socketConnect.connect('/devicewallapp');
    // Scope variables
    $scope.label = $window.localStorage.getItem('label') || '';
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
        '/#!/devices';
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

        $rootScope.$broadcast('ready');
        $scope.view.label = false;
        $scope.view.connection = true;

        update();
      }
    };

    function update() {
      var device = {
        label: $scope.label
      };
      if ($scope.model) {
        device.model = $scope.model;
      }
      if ($scope.platform) {
        device.platform = $scope.platform;
      }
      if ($scope.appPlatform) {
        device.appPlatform = $scope.appPlatform;
      }
      if ($scope.version) {
        device.version = $scope.version;
      }
      if ($scope.batteryStatus) {
        device.batteryStatus = {};
      }
      if ($scope.batteryStatus.level) {
        device.batteryStatus.level = $scope.batteryStatus.level;
      }
      if ($scope.batteryStatus.isPlugged) {
        device.batteryStatus.isPlugged = $scope.batteryStatus.isPlugged;
      }
      socket.emit('update', device);
    }

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
      $rootScope.$broadcast('ready');
    }
});
