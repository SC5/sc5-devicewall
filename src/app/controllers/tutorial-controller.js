angular.module('DeviceWall').controller('TutorialController', function($scope, $log, $sce, appConfig) {

  $scope.hideMain = false;
  $scope.currentTutorial = '';
  $scope.currentPage = 0;
  $scope.pages = {
    control: [
      {
        image: 'test/1.png',
        text: '<p>Connect your device to</p>' +
              '<p><span>' + appConfig.tutorial.wifi.SSID + '</span> wifi</p>' +
              '<p>Password: <span>' + appConfig.tutorial.wifi.password + '</span></p>'
      },
      {
        image: 'test/2.png',
        text: '<p>Navigate to <span>' + appConfig.tutorial.url + '</span></p>' +
              '<p>and select the <span>Control panel</span> icon</p>'
      },
      {
        image: 'test/3.png',
        text: '<p>Enter the website address</p>' +
              '<p>you want to test</p>' +
              '<p>and click <span>GO!</span></p>'
      },
      {
        image: 'test/4.png',
        text: '<p>Test the site and navigate</p>' +
              '<p>on any of the devices</p>'
      },
      {
        image: 'test/5.png',
        text: '<p>Time to stop the test?</p>' +
              '<p>Just click <span>Stop all</span></p>' +
              '<p>in Control panel</p>'
      }
    ],
    client: [
      {
        image: 'device/1.png',
        text: '<p>Connect your device to</p>' +
              '<p><span>' + appConfig.tutorial.wifi.SSID + '</span> wifi</p>' +
              '<p>Password: <span>' + appConfig.tutorial.wifi.password + '</span></p>'
      },
      {
        image: 'device/2.png',
        text: '<p>Navigate to <span>' + appConfig.tutorial.url + '</span></p>' +
              '<p>and tap <span>Add device</span> icon</p>'
      },
      {
        image: 'device/3.png',
        text: '<p>Give device a name</p>' +
              '<p>and tap <span>OK</span>!</p>'
      },
      {
        image: 'device/4.png',
        text: '<p>You are good to go!</p>'
      }
    ]
  };


  $scope.safeHtml = function(text) {
    return $sce.trustAsHtml(text);
  };

  $scope.selectPage = function(page) {
    if (page >= $scope.pages[$scope.currentTutorial].length) {
      page = 0;
    }
    $scope.currentPage = page;
    $scope.currentItem = $scope.pages[$scope.currentTutorial][page];
  };

  $scope.selectTutorial = function(tutorial) {
    $scope.hideMain = true;
    $scope.currentTutorial = tutorial;
    $log.debug($scope.pages[tutorial][$scope.currentPage]);
    $scope.currentItem = $scope.pages[tutorial][$scope.currentPage];
  };
});
