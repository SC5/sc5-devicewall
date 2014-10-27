$(document).ready(function() {
  
  var count = 0;

  function setBg(color) {
    $('body').css('backgroundColor', color);
  }

  function downloadDone() {
    count++;
    if (count === 10) {
      setBg('yellow');
    }
    if (count === 20) {
      setBg('green');
    } else {
      $.get('1.dat?_='+Math.random()).done(downloadDone);
    }
  }

  setBg('red');

  $.get('1.dat?_='+Math.random()).done(downloadDone);
});
