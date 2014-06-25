var app = require('./app.js'),
    $ = require('jquery');





function start() {
	// Start the app here

	$('#pc').click(select);
	$('#mobile').click(identify);

}





function select(event) {

	event.stopPropagation();

	$('#buttons').hide();
	$('#devices').show();

	$('#content').addClass('devices');



	var devicesList = $('#devices-list');

	$.getJSON('/devices', function(data) {

		$.each(data, function(key, value) {

    		var rowElement = $('<tr class="device"><td>' + value.label + '</td><td>' + value.name + '</td><td>' + value.location + '</td><td>' + value.user + '</td></tr>');
/*
    		instanceElement
				.append(
                    iframeElement
        				.load(function() {
        					if (+new Date() - time < 5000) {
        						instanceElement.fadeIn();
        					}
        				})
    			)
                .append('<a href="' + value.address + '"></a>');
*/

			rowElement.append('<td><input type="checkbox" name="device[' + value.label + ']" value="1"></td>');

	    	devicesList.append(rowElement);

		});

	});



}






function identify(event) {

	event.stopPropagation();

	$('#buttons').hide();
	$('#identify').show();

	$('#identify-form').submit(identifySubmit);


	var name = localStorage.getItem('name');
	var label = localStorage.getItem('label');

	if (!name) {
		name = navigator.userAgent;
	}

	$('#name').val(name);
	$('#label').val(label);

	return false;

}





function identifySubmit(event) {

	event.stopPropagation();

	var 
		name = $('#name').val(),
		label = $('#label').val();

	localStorage.setItem('name', name);
	localStorage.setItem('label', label);

	$.post('/identify', {name: name, label: label});

	$('#identify').hide();
	$('#wait').show();

	return false;

}





exports = module.exports = {
  start: start
};
