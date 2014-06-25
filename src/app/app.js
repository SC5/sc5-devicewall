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

    		var rowElement = $('<tr class="device"><td>' + value.identifier + '</td><td>' + value.name + '</td><td>' + value.location + '</td><td>' + value.user + '</td></tr>');
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

			rowElement.append('<td></td>');

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
	var identifier = localStorage.getItem('identifier');

	if (!name) {
		name = navigator.userAgent;
	}

	$('#name').val(name);
	$('#identifier').val(identifier);

	return false;

}





function identifySubmit(event) {

	event.stopPropagation();

	var 
		name = $('#name').val(),
		identifier = $('#identifier').val();

	localStorage.setItem('name', name);
	localStorage.setItem('identifier', identifier);

	alert(identifier + ' ' + name);

	$.post('/identify', {name: name, identifier: identifier});

	$('#identify').hide();
	$('#wait').show();

	return false;

};





exports = module.exports = {
  start: start
};
