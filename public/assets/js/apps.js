/**
 * Specifies a function to execute when the DOM is fully loaded.
 */
$(document).ready(function () {

	$(document).on('click', '[data-action=delete]', function () {
		var app = $(this).closest('.app'),
			id = app.data('id');

		$.ajax({
			type: 'DELETE',
			url: '/apps',
			data: { id: id },
			success: function (data) {
				app.fadeOut('slow', function () {
					$(this).remove();
				});
			}
		});

		return false;
	});

	$(document).on('click', '[data-action=create]', function () {
		var app = $(this).closest('.app');

		$.ajax({
			type: 'POST',
			url: '/apps',
			data: { title: $('#title').val(), request_origin: $('#request_origin').val() },
			success: function (data) {
				$('<div/>', { 'class': 'app', 'data-id': data.id }).append(
					$('<table/>', { 'class': 'table' }).append(
						$('<tr/>').append(
							$('<th/>').text('App ID'),
							$('<td/>').html($('<code/>').text(data.id))
						),
						$('<tr/>').append(
							$('<th/>').text('Access Token'),
							$('<td/>').html($('<code/>').text(data.access_token))
						),
						$('<tr/>').append(
							$('<th/>').text('Title'),
							$('<td/>').html($('<code/>').text(data.title))
						),
						$('<tr/>').append(
							$('<th/>').text('Request Origin'),
							$('<td/>').html($('<code/>').text(data.request_origin))
						)
					),
					$('<a/>', { 'href': '#', 'class': 'btn btn-default', 'data-action': 'update' }).text('Update').prepend(' ').prepend($('<i/>', { 'class': 'fa fa-edit' })),
					$('<a/>', { 'href': '#', 'class': 'btn btn-default', 'data-action': 'download_json' }).text('Download JSON').prepend(' ').prepend($('<i/>', { 'class': 'fa fa-download' })),
					$('<a/>', { 'href': '#', 'class': 'btn btn-warning', 'data-action': 'delete' }).text('Delete').prepend(' ').prepend($('<i/>', { 'class': 'fa fa-times-circle' }))
				).appendTo('#apps');
			}
		});

		return false;
	});
});