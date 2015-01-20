/*jshint -W072 */
angular.module('DeviceWall')
  .controller('ClientController',
  function(
    $rootScope, $scope, $location, $timeout, $interval,
    socketConnect, $window, appConfig, Util, $log, DeviceInfo
  ) {
    $scope.label = $window.localStorage.getItem('label') || '';
    var socket = socketConnect.connect('/devicewallapp', $scope.label);
    // Scope variables
    $scope.statusMessage = "Initializing connection";
    $scope.oldLabel = $scope.label;
    $scope.model = '';
    $scope.platform = '';
    $scope.appPlatform = 'browser';
    $scope.version = '';
    $scope.online = '';
    $scope.batteryStatus = {level: '', isPlugged: ''};
    $scope.view = {
      label: $scope.label === '',
      connection: $scope.label !== '',
      screensaver: false,
      screensaverClass: "center"
    };

    $scope.showSettings = function() {
      $scope.view.label = true;
      $scope.view.connection = false;
    };

    $scope.showControlPanel = function() {
      $location.path('/devices');
    };

    $scope.showTutorial = function() {
      $location.path('/tutorial');
    };

    socket.on('connect', function() {
      $scope.statusMessage = "Ready for testing";
    });
    socket.on('version', function(data) {
      if (data !== appConfig.version) {
        $log.debug('old version reloading browser');
        $window.location.reload();
      }
    });

    socket.on('disconnect', function() {
      $scope.statusMessage = "Not connected";
    });

    socket.on('start', function(data) {
      var id = socket.io().engine.id;
      socket.emit('started', { label: $scope.label, socketId: id });
      if (data.labels.indexOf($window.localStorage.getItem('label')) !== -1) {
        var url = Util.addSearchParamaterToURL(data.url, 'devicewall=' + id);
        $window.location.href = url;
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
          socket.emit('update', {label: $scope.label, appVersion: appConfig.version});
        }
      }
    };

    if ($scope.label) {
      var info = DeviceInfo.getPlatformInfo();
      var updateData = {label: $scope.label};
      if (info) {
        updateData.platform = info.platform;
        updateData.version = info.version;
      }
      socket.emit('update', updateData);
    }

    $interval(function() {
      if (socket) {
        socket.emit('ping', {label: $scope.label});
      } else {
        $scope.statusMessage = "Not connected";
      }
    }, appConfig.client.pingIntervalSeconds*1000);
    $scope.$on('$destroy', function() {
      socket.removeAllListeners();
    });
  });
