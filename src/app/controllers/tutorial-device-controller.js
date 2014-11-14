angular.module('DeviceWall')
  .controller('TutorialDeviceController', function($scope, $location, $window, $log, appConfig) {

    $scope.pages =
      { pages_count: 4, // maybe irrelevant and use array.length instead?
        texts: [
          'Teksti 1',
          'Teksti 2',
          'Teksti 3',
          'Teksti 4'
        ]};
  });
