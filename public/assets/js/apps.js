/**
 * Specifies a function to execute when the DOM is fully loaded.
 */
$(document).ready(function () {

	$(document).on('click', '[data-action=delete]', function () {
		var id = $(this).closest('.app').data('id');
		$('#delete_id').val(id);
	});

	$(document).on('click', '[data-action=update]', function () {
		var app = $(this).closest('.app');
		var id = app.data('id'),
			title = app.find('[data-info=title] code').text(),
			request_origin = app.find('[data-info=request_origin] code').text();

		$('#update_id').val(id);
		$('#update_title').val(title);
		$('#update_request_origin').val(request_origin);
	});

	$(document).on('click', '[data-action=doDelete]', function () {
		var id = $('#delete_id').val();

		$.ajax({
			type: 'DELETE',
			url: '/apps',
			data: { id: id },
			success: function (data) {
				$('#deleteApp').modal('hide');
				$('[data-id=' + id + ']').fadeOut('slow', function () {
					$(this).remove();
				});
			}
		});

		return false;
	});

	$(document).on('click', '[data-action=doCreate]', function () {
		$.ajax({
			type: 'POST',
			url: '/apps',
			data: { title: $('#new_title').val(), request_origin: $('#new_request_origin').val() },
			success: function (data) {
				$('#newApp').modal('hide');

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
							$('<td/>', { 'data-info': 'title' }).html($('<code/>').text(data.title))
						),
						$('<tr/>').append(
							$('<th/>').text('Request Origin'),
							$('<td/>', { 'data-info': 'request_origin' }).html($('<code/>').text(data.request_origin))
						)
					),
					$('<button/>', { 'type': 'button', 'class': 'btn btn-default', 'data-toggle': 'modal', 'data-target': '#updateApp', 'data-action': 'update' }).text('Update').prepend(' ').prepend($('<i/>', { 'class': 'fa fa-edit' })),
					$('<button/>', { 'type': 'button', 'class': 'btn btn-default', 'data-toggle': 'modal', 'data-target': '#downloadJson', 'data-action': 'download_json' }).text('Download JSON').prepend(' ').prepend($('<i/>', { 'class': 'fa fa-download' })),
					$('<button/>', { 'type': 'button', 'class': 'btn btn-warning', 'data-toggle': 'modal', 'data-target': '#deleteApp', 'data-action': 'delete' }).text('Delete').prepend(' ').prepend($('<i/>', { 'class': 'fa fa-times-circle' }))
				).appendTo('#apps');
			}
		});

		return false;
	});

	$(document).on('click', '[data-action=doUpdate]', function () {
		var id = $('#update_id').val();
		var app = $('[data-id=' + id + ']');
		var title = app.find('[data-info=title] code'),
			request_origin = app.find('[data-info=request_origin] code'),
			new_title = $('#update_title').val(),
			new_request_origin = $('#update_request_origin').val();

		$.ajax({
			type: 'PUT',
			url: '/apps',
			data: { id: id, title: new_title, request_origin: new_request_origin },
			success: function (data) {
				$('#updateApp').modal('hide');

				title.text(new_title);
				request_origin.text(new_request_origin);
			}
		});

		return false;
	});
});