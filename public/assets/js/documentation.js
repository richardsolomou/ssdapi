// Specify a function to execute when the DOM is fully loaded.
$(document).ready(function () {

	// Set local API folder.
	var api = '/api';
	// Set the access token to be used.
	var access_token = '8ac61297-c3c5-4f76-bc6e-603471ff9325';

	// Set up popover notifications and allow them to display HTML.
	$('[data-toggle=popover]').popover({ html: true });

	// Create a self-executing anonymous function.
	$(function () {
		// Make an AJAX request to get all building data.
		$.getJSON(api + '/v1/buildings?access_token=' + access_token, function (buildings) {
			// Loop through all the buildings.
			for (var i in buildings) {
				// Construct a table row for each building found.
				$('<tr/>').append(
					$('<td/>').text(buildings[i].name),
					$('<td/>').html($('<code/>').text(buildings[i].reference))
				).appendTo($('#documentation_string_identifiers table tbody'));
			}
		});
	
		// Disable the navigation affix.
		$(window).off('.affix');
		// Delete affix data from the documentation navigation and set its offset.
		$('#doc_nav').removeData('bs.affix').removeData('affix').removeAttr('class').affix({
			offset: {
				top: $('header').outerHeight(true) + $('.navbar-inverse').outerHeight(true) + $('#intro').outerHeight(true)
			}
		});
		
		// Create the scrollspy on the documentation navigation.
		$('body').scrollspy({ target: '#doc_nav' });
	});

	// Initiate an event when a link is pressed to scroll to a section.
	$(document).on('click', 'a.scroll', function () {
		// Set a variable for the clicked link and the URL.
		var link = $(this);
		var id = $(this).attr('href');

		// Animate the transition to the section.
		$('html, body').animate({ scrollTop: $(id).offset().top }, 450);

		// Prevents default action and stops propagation.
		return false;
	});

});