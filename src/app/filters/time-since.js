angular.module('DeviceWall')
  .filter('timeSince', function() {
    return function(time) {
      console.log("time", time);
      if (time === undefined) {
        return '-';
      }
      return moment(new Date(time)).fromNow();
    };
  });