/**
 * Specifies a function to execute when the DOM is fully loaded.
 */
$(document).ready(function () {

	var api = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));

	$('[data-toggle=popover]').popover({ html: true });

	$(function () {
		$('pre[data-example-request]').each(function () {
			var request = $(this).data('example-request');
			var pre = $(this);
			var access_token = '8ac61297-c3c5-4f76-bc6e-603471ff9325';
			
			request += request.indexOf('?') !== -1 ? '&' : '?';
			request += 'access_token=' + access_token;

			$.getJSON(api + '/v1/' + request).complete(function (data) {
				pre.text(JSON.stringify(data.responseJSON, null, '\t'));
			});
		});

		/*$.getJSON(api + '/v1/buildings', function (data) {
			for (var i = 0; i < data.length; i++) {
				$('#documentation_references_string_identifiers table tbody').append(
					'<tr>' +
						'<td>' + data[i].id + '</td>' +
						'<td><code>' + data[i].reference + '</code></td>' +
						'<td>' + data[i].name + '</td>' +
					'</tr>'
				);
			}
		});*/
	
		$(window).off('.affix');
		$('#doc_nav').removeData('bs.affix').removeData('affix').removeAttr('class').affix({
			offset: {
				top: $('header').outerHeight(true) + $('.navbar-inverse').outerHeight(true) + 50
			}
		});
		
		$('body').scrollspy({ target: '#doc_nav' });
	});

	$(document).on('click', 'a.scroll', function () {
		var link = $(this);
		var id = $(this).attr('href');

		$('html, body').animate({ scrollTop: $(id).offset().top }, 450);

		return false;
	});

});