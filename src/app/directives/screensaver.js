  angular.module('DeviceWall').directive('screensaver', function($window, $interval, $log, appConfig) {
    var screensaverTimeoutPromise;
    var screensaverTimeoutSeconds = appConfig.client.screenSaverTimeoutSeconds || 60;
    return {
      link: function($scope, element) {
        if (appConfig.client.screenSaverTimeoutSeconds === 0) {
          return;
        }
        $log.debug("init screen saver directive");
        screensaverTimeoutPromise = $interval(showScreensaver, screensaverTimeoutSeconds*1000);
        element.on('click', function() {
          $scope.$apply(function() {
            resetScreensaverCounter();
          });
        });
        element.on('touchstart', function() {
          $scope.$apply(function() {
            resetScreensaverCounter();
          });
        });
        function showScreensaver() {
          $log.debug("enable screen saver");
          $interval.cancel(screensaverTimeoutPromise);
          var previousClass = $scope.screensaverClass;
          var allClasses = ["left", "center", "right"];
          var classes = [];
          for (var i = 0; i < allClasses.length; i++) {
            if (previousClass !== allClasses[i]) {
              classes.push(allClasses[i]);
            }
          }
          $scope.screensaverClass = Math.random() <= 0.5 ? classes[0] : classes[1];
          $scope.screensaver = true;
          $scope.label = $window.localStorage.getItem('label') || '';
          screensaverTimeoutPromise = $interval(showScreensaver, screensaverTimeoutSeconds*1000);
        }

        function resetScreensaverCounter() {
          $interval.cancel(screensaverTimeoutPromise);
          if ($scope.screensaver) {
            hideScreensaver();
          }
          screensaverTimeoutPromise = $interval(showScreensaver, screensaverTimeoutSeconds*1000);
        }

        function hideScreensaver() {
          $log.debug("disable screen saver");
          $scope.screensaver = false;
        }
        resetScreensaverCounter();
      }
    };
  });