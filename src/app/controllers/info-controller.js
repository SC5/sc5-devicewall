angular.module('DeviceWall').controller('InfoController', function($scope, appConfig) {
  $scope.url = appConfig.tutorial.url;
  $scope.urlText = appConfig.tutorial.url.replace(/^http[s]*:\/\//, "");
});