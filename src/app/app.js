var app = require('./app.js'),
    $ = require('jquery');

function start() {
  // Start the app here


  $('#mobile').click(identify);


  //alert(1);


}





function identify(event) {

	event.stopPropagation();


	//alert(2);
	$('#buttons').hide();
	$('#identify').show();

	$('#identify-form').submit(identifySubmit);


	var name = localStorage.getItem('name');
	var code = localStorage.getItem('code');

	if (!name) {
		name = navigator.userAgent;
	}

	$('#name').val(name);
	$('#code').val(code);

	return false;


}

function identifySubmit(event) {

	event.stopPropagation();

	var name = $('#name').val();
	var code = $('#code').val();


	localStorage.setItem('name', name);
	localStorage.setItem('code', code);	


	return false;

};



exports = module.exports = {
  start: start
};
