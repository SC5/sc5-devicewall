angular.module('DeviceWall')
  .filter('timeSince', function() {
    return function(time) {
      if (time === undefined) {
        return '-';
      }
      return moment(new Date(time)).fromNow();
    };
  });