angular.module('DeviceWall').controller('TutorialController', function($scope, $log, $sce) {

  $scope.hideMain = false;
  $scope.currentTutorial = '';
  $scope.currentPage = 0;
  $scope.pages = {
    control: [
      {
        image: 'test/1.png',
        text: "Connect your device to <b>SC5DeviceWall</b> wifi Password: <b>SC5Rocks</b>"
      },
      {
        image: 'test/2.png',
        text: "Navigate to <b>http://devicewall.sc5.io</b> and select the <b>Control panel icon</b>"
      },
      {
        image: 'test/3.png',
        text: "Enter the website address you want to test and click <b>GO!</b>"
      },
      {
        image: 'test/4.png',
        text: "Test the site and navigate on any of the devices"
      },
      {
        image: 'test/5.png',
        text: "Time to stop the test? Just click <b>Stop all</b> in Control panel"
      }
    ],
    client: [
      {
        image: 'device/1.png',
        text: "Connect your device to <b>SC5DeviceWall</b> wifi Password: <b>SC5Rocks</b>"
      },
      {
        image: 'device/2.png',
        text: "Navigate to http://devicewall.sc5.io and tap Add device icon"
      },
      {
        image: 'device/3.png',
        text: "Give device a name and tap OK! You are good to go!"
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
