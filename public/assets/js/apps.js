// Specify a function to execute when the DOM is fully loaded.
$(document).ready(function () {

	// Set variables for the modals.
	var newAppModal = $('#newAppModal'),
		editAppModal = $('#editAppModal'),
		deleteAppModal = $('#deleteAppModal');

	// Set variables for the input fields on the new and edit application modals.
	var newAppTitle = $('#newAppModal [name=title]'),
		editAppTitle = $('#editAppModal [name=title]'),
		newAppRequestOrigin = $('#newAppModal [name=request_origin]'),
		editAppRequestOrigin = $('#editAppModal [name=request_origin]');

	// Set variables for the alerts for the new and edit application modals.
	var newAppAlert = $('#newAppModal .alert'),
		editAppAlert = $('#editAppModal .alert');

	// Set variables for the ID fields on the edit and delete application modals.
	var editAppId = $('#editAppModal [name=id]'),
		deleteAppId = $('#deleteAppModal [name=id]');

	// Set a function for when the New App button is pressed to open the New App modal.
	$(document).on('click', '[data-action=openNewAppModal]', function () {
		// Hides the alert.
		newAppAlert.text('').removeClass('in');
		// Empty the input fields on the New App modal.
		newAppTitle.val('');
		newAppRequestOrigin.val('');
	});

	// Set a function for when the Edit button is pressed to open the Edit App modal.
	$(document).on('click', '[data-action=openEditAppModal]', function () {
		// Set a variable for the current app.
		var app = $(this).closest('.app');
		// Fetch the App ID, current title, and request origin.
		var id = app.data('id'),
			title = app.find('[data-info=title] code').text(),
			request_origin = app.find('[data-info=request_origin] code').text();

		// Hides the alert.
		editAppAlert.text('').removeClass('in');
		// Append the App ID, title and request origin to the input fields in the Edit App modal.
		editAppId.val(id);
		editAppTitle.val(title);
		editAppRequestOrigin.val(request_origin);
	});

	// Set a function for when the Delete button is pressed to open the Delete App modal.
	$(document).on('click', '[data-action=openDeleteAppModal]', function () {
		// Set a variable for the current app.
		var app = $(this).closest('.app');
		// Fetch the App ID.
		var id = app.data('id');

		// Append the App ID to the hidden input field in the Delete App modal.
		deleteAppId.val(id);
	});

	// Set a function for when the Create New App button is pressed to create a new app.
	$(document).on('click', '[data-action=newApp]', function () {
		// Perform an AJAX request to add the new app using the data stored in the input fields on the New App modal.
		$.ajax({
			type: 'POST',
			url: window.location.pathname,
			data: { title: newAppTitle.val(), request_origin: newAppRequestOrigin.val() },
			success: function (app) {
				// Hide the New App modal.
				newAppModal.modal('hide');

				// Hide the no apps found div by fading it to transparent.
				$('.no-apps-found').fadeOut('slow', function () {
					// Remove the no apps found element from the DOM.
					$(this).remove();
				});

				// Construct a section with the new data and append it to the existing apps section.
				$('<div/>', { 'class': 'app', 'data-id': app.id }).append(
					$('<table/>', { 'class': 'table' }).append(
						$('<tr/>').append(
							$('<th/>').text('App ID'),
							$('<td/>').html($('<code/>').text(app.id))
						),
						$('<tr/>').append(
							$('<th/>').text('Access Token'),
							$('<td/>').html($('<code/>').text(app.access_token))
						),
						$('<tr/>').append(
							$('<th/>').text('Title'),
							$('<td/>', { 'data-info': 'title' }).html($('<code/>').text(app.title))
						),
						$('<tr/>').append(
							$('<th/>').text('Request Origin'),
							$('<td/>', { 'data-info': 'request_origin' }).html($('<code/>').text(app.request_origin))
						)
					),
					$('<button/>', { 'type': 'button', 'class': 'btn btn-default', 'data-toggle': 'modal', 'data-target': '#editAppModal', 'data-action': 'openEditAppModal' }).text('Edit').prepend(' ').prepend($('<i/>', { 'class': 'fa fa-edit' })),
					$('<button/>', { 'type': 'button', 'class': 'btn btn-danger', 'data-toggle': 'modal', 'data-target': '#deleteAppModal', 'data-action': 'openDeleteAppModal' }).text('Delete').prepend(' ').prepend($('<i/>', { 'class': 'fa fa-times-circle' }))
				).prependTo('#apps');
			},
			error: function (data) {
				// Sets the error message.
				var err = data.responseJSON.error;
				// Sets and shows the alert.
				newAppAlert.text(err.message).addClass('in');
			}
		});

		// Prevent default action and stops propagation.
		return false;
	});

	// Set a function for when the Edit Existing App button is pressed to update the app.
	$(document).on('click', '[data-action=editApp]', function () {
		// Set a variable for the current app.
		var app = $('#apps [data-id=' + editAppId.val() + ']');
		// Set variables for the title and request origin fields.
		var title = app.find('[data-info=title] code'),
			request_origin = app.find('[data-info=request_origin] code');

		// Perform an AJAX request to update the app using the data stored in the input fields on the Edit App modal.
		$.ajax({
			type: 'PUT',
			url: window.location.pathname,
			data: { id: editAppId.val(), title: editAppTitle.val(), request_origin: editAppRequestOrigin.val() },
			success: function (data) {
				// Hide the Edit App modal.
				editAppModal.modal('hide');

				// Update the contents of the title and request origin fields with the new data.
				title.text(editAppTitle.val());
				request_origin.text(editAppRequestOrigin.val());
			},
			error: function (data) {
				// Sets the error message.
				var err = data.responseJSON.error;
				// Sets and shows the alert.
				editAppAlert.text(err.message).addClass('in');
			}
		});

		// Prevent default action and stops propagation.
		return false;
	});

	// Set a function for when the Delete App button is pressed to delete the app.
	$(document).on('click', '[data-action=deleteApp]', function () {
		// Set a variable for the current app.
		var app = $('[data-id=' + deleteAppId.val() + ']');

		// Perform an AJAX request to delete the current app.
		$.ajax({
			type: 'DELETE',
			url: window.location.pathname,
			data: { id: deleteAppId.val() },
			success: function (data) {
				// Hide the Delete App modal.
				deleteAppModal.modal('hide');

				// Hide the app element by fading it to transparent.
				app.fadeOut('slow', function () {
					// Remove the app element from the DOM.
					$(this).remove();
					// Check if there aren't any more apps.
					if ($('#apps').children().length == 0) {
						// Create a div displaying no results.
						$('<div/>', { 'class': 'no-apps-found' }).text('No apps found.').prependTo('#apps');
					}
				});
			}
		});

		// Prevent default action and stops propagation.
		return false;
	});
});