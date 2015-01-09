/*jshint -W072 */
angular.module('DeviceWall')
  .controller('ClientController',
  function($rootScope, $scope, $location, $timeout, socketConnect, $window, appConfig, Util, $log) {
    var screensaverTimeoutPromise;
    var screensaverTimeoutSeconds = appConfig.client.screenSaverTimeoutSeconds || 60;
    var socket = socketConnect.connect('/devicewallapp');
    // Scope variables
    $scope.statusMessage = "Initializing connection";
    $scope.label = $window.localStorage.getItem('label') || '';
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
          socket.emit('update', {label: $scope.label});
        }
      }
    };

    function showScreensaver() {
      var random = Math.random();
      var previousClass = $scope.view.screensaverClass;
      var allClasses = ["left", "center", "right"];
      var classes = [];
      for (var i = 0; i < allClasses.length; i++) {
        if (previousClass !== allClasses[i]) {
          classes.push(allClasses[i]);
        }
      }
      $scope.view.screensaverClass = random <= 0.5 ? classes[0] : classes[1];
      $scope.view.screensaver = true;
      screensaverTimeoutPromise = $timeout(showScreensaver, screensaverTimeoutSeconds*1000);
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
