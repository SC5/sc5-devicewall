(function () {
  'use strict';

  var module = angular.module('DeviceWall');

  module.filter('batteryStyle', function() {
    return function(status) {
      if (status && status.level) {
        var position = (status.level * 0.8 + 10) + '%';
        var stop1 = (status.isPlugged ? '#0f0' : '#fff') + ' ' + position;
        var stop2 = (status.isPlugged ? '#0c0' : '#ccc') + ' ' + position;
        return 'background-image: -webkit-linear-gradient(left, ' + stop1 + ', ' + stop2 + ');';
      }
      return '';
    };
  });

  module.filter('batteryTitle', function() {
    return function(status) {
      var returnString = 'no battery information available';
      if (status && status.level) {
        returnString = 'Level: ' + status.level + ' %' + (status.isPlugged ? ', plugged' : '');
      }
      return returnString;
    };
  });

}());