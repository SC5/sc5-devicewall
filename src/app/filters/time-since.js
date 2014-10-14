angular.module('DeviceWall')
  .filter('timeSince', function() {
    return function(time) {
      return moment(new Date(time)).fromNow();
    };
  });