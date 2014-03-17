/**
 * Specifies a function to execute when the DOM is fully loaded.
 */
$(document).ready(function () {

	var api = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));

	$('[data-toggle=popover]').popover({ html: true });

	var input = $('#route input'),
		alert = $('#alert');

	$(function () {
		$('pre[data-example-request]').each(function () {
			var request = $(this).data('example-request');
			var pre = $(this);

			$.getJSON(api + '/v1/' + request).complete(function (data) {
				pre.text(JSON.stringify(data.responseJSON, null, '\t'));
			});
		});

		$.getJSON(api + '/v1/buildings', function (data) {
			for (var i = 0; i < data.length; i++) {
				$('#documentation_references_string_identifiers table tbody').append(
					'<tr>' +
						'<td>' + data[i].id + '</td>' +
						'<td><code>' + data[i].reference + '</code></td>' +
						'<td>' + data[i].name + '</td>' +
					'</tr>'
				);
			}
		});

		$('#route button').trigger('click');
	});

	$('#route button').click(function (e) {
		var route;

		$.getJSON(api + '/v1/routes').complete(function (data) {
			$.each(data.responseJSON, function (index, value) {
				if (input.val().indexOf(value.reference) !== -1) {
					route = value.reference;
					return false;
				}
			});

			$.getJSON(api + '/v1/' + input.val()).complete(function (data) {
				$('#route pre').text(JSON.stringify(data.responseJSON, null, '\t'));

				if (!data.responseJSON || !data.responseJSON.error) {
					$.getJSON(api + '/v1/routes/' + route, function (route) {
						if (route.examples) {
							alert.attr('class', 'alert alert-warning').html(route.examples);
						} else {
							alert.attr('class', 'alert collapse');
						}
					});
				} else {
					alert.attr('class', 'alert alert-danger').html('<strong>Error:</strong> No data available for the specified URI.');
				}

				$(window).off('.affix');
				$('#doc_nav').removeData('bs.affix').removeData('affix').removeAttr('class').affix({
					offset: {
						top: $('header').outerHeight(true) + $('#nav').outerHeight(true) + $('#route').outerHeight(true) + $('#intro').outerHeight(true) + 125
					}
				});
				
				$('body').scrollspy({ target: '#doc_nav' });
			});
		});

		return false;
	});

	$(document).on('click', '#nav li a[data-preview]', function () {
		$('#nav li').removeAttr('class');
		$(this).parent().attr('class', 'active');

		input.val($(this).data('preview'));

		$('#route button').trigger('click');

		return false;
	});

	$(document).on('click', '#alert a', function () {
		input.val($(this).attr('href'));

		$('#route button').trigger('click');

		return false;
	});

	$(document).on('click', 'a.scroll', function () {
		var link = $(this);
		var id = $(this).attr('href');

		$('html, body').animate({ scrollTop: $(id).offset().top }, 450);

		return false;
	});

});

$(window).on('load resize', function () {
	var width = $(window).width(),
		url = $(location).attr('href');

	if (width < 450) {
		$('#route .input-group-addon').text('...').attr('title', url + 'v1/');
	} else {
		$('#route .input-group-addon').text(url + 'v1/').removeAttr('title');
	}
});