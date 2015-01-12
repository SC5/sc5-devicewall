(function () {
  'use strict';

  angular.module('DeviceWall').directive('screensaver', function($window, $timeout, $log, appConfig) {
    var screensaverTimeoutPromise;
    var screensaverTimeoutSeconds = appConfig.client.screenSaverTimeoutSeconds || 60;
    return {
      link: function($scope, element) {
        $log.debug("init screen saver directive");
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
          var previousClass = $scope.screensaverClass;
          var allClasses = ["left", "center", "right"];
          var classes = [];
          for (var i = 0; i < allClasses.length; i++) {
            if (previousClass !== allClasses[i]) {
              classes.push(allClasses[i]);
            }
          }
          $scope.screensaverClass = Math.random() <= 0.5 ? classes[0] : classes[1];
          $scope.screensaver = true;//!!!$scope.screensaver;
          $scope.label = $window.localStorage.getItem('label') || '';
        }

        function resetScreensaverCounter() {
          $timeout.cancel(screensaverTimeoutPromise);
          if ($scope.screensaver) {
            hideScreensaver();
          }
          screensaverTimeoutPromise = $timeout(showScreensaver, screensaverTimeoutSeconds*1000);
        }

        function hideScreensaver() {
          $scope.screensaver = false;
        }
        resetScreensaverCounter();
      }
    };
  });

})();