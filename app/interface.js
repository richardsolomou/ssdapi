module.exports = function (app, passport, mysql, local) {
	// Load module dependencies.
	var async = require('async'),
		uuid = require('node-uuid'),
		validator = require('validator');

	// Route to display the homepage.
	app.get('/', function (req, res) {
		// Render index.ejs with any potential user credentials.
		res.render('index', { name: 'index', user: req.session.user });
	});

	// Route for logging in to the API.
	app.get('/login', function (req, res) {
		// Create a variable with an error flash message.
		var error = req.flash('error') || [];
		// Use passport to check if the user is already authenticated.
		if (req.isAuthenticated() && req.session.user) return res.redirect(local.api.folder);
		// Check that there isn't an error.
		if (error.length == 0) return res.redirect(local.api.folder + '/auth/google');
		// Render login.ejs with any potential user credentials and error messages.
		res.render('login', { user: req.session.user, error: error });
	});

	// Route to show the documentation.
	app.get('/documentation', isLoggedIn, function (req, res) {
		// Render documentation.ejs .
		res.render('documentation', { name: 'documentation', user: req.session.user });
	});

	// Route to show all the user's apps.
	app.get('/apps', isLoggedIn, function (req, res) {
		// Run a MySQL query to get all the apps for the current user.
		mysql.query('SELECT * FROM `api_apps` WHERE `user_id` = :user_id ORDER BY `created_at` DESC', { user_id: req.session.user.id }, function (err, apps) {
			// Render apps.ejs with the user's apps.
			res.render('apps', { name: 'apps', user: req.session.user, apps: apps });
		});
	});

	// Route for creating a new application under the user's account.
	app.post('/apps', isLoggedIn, function (req, res) {
		// Checks if the title is empty.
		if (validator.equals(req.body.title, '')) return res.json(403, { error: { message: 'Title cannot be empty.', code: 403 } });
		// Checks if the request origin is empty.
		if (validator.equals(req.body.request_origin, '')) return res.json(403, { error: { message: 'Request origin cannot be empty.', code: 403 } });
		// Checks if the request origin is a valid URL or IP.
		if (!validator.isURL(req.body.request_origin) && !validator.isIP(req.body.request_origin) || validator.contains(req.body.request_origin, '*') || req.body.request_origin.slice(-1) == '/') return res.json(403, { error: { message: 'Request origin is not a valid URL or IP address.', code: 403 } });
		// Create an access token variable.
		var id = access_token = null;
		// Run an asynchronous loop.
		async.whilst(function () {
			// Run a loop while the access token variable is empty.
			return access_token == null;
		// Call a function whilst the above function returns true.
		}, function (callback) {
			// Generate an id.
			id = uuid.v1();
			// Generate an access token.
			var token = uuid.v4();
			// Run a MySQL query to check if the access token already exists.
			mysql.query('SELECT * FROM `api_apps` WHERE `access_token` IN [:id, :access_token] OR `id` IN [:id, :access_token]', { id: id, access_token: token }, function (err, results) {
				// Check if no results were found.
				if (!results || !results.length) {
					// Assign the token to the access token.
					access_token = token;
					// Call the callback function to continue.
					callback();
				}
			});
		// Run a function after the callback was called.
		}, function (err) {
			// Set the data to be passed.
			var data = { id: id, user_id: req.session.user.id, access_token: access_token, title: req.body.title, request_origin: req.body.request_origin, created_at: new Date().toISOString().slice(0, 19).replace('T', ' ') };
			// Run a MySQL query for creating a new app.
			mysql.query('INSERT INTO `api_apps` (`id`, `user_id`, `access_token`, `title`, `request_origin`, `created_at`) VALUES (:id, :user_id, :access_token, :title, :request_origin, :created_at)', data, function (err, apps) {
				// Return the data to the view.
				res.json(data);
			});
		});
	});

	// Route for modifying an existing application under the user's account.
	app.put('/apps', isLoggedIn, function (req, res) {
		// Checks if the title is empty.
		if (validator.equals(req.body.title, '')) return res.json(403, { error: { message: 'Title cannot be empty.', code: 403 } });
		// Checks if the request origin is empty.
		if (validator.equals(req.body.request_origin, '')) return res.json(403, { error: { message: 'Request origin cannot be empty.', code: 403 } });
		// Checks if the request origin is a valid URL or IP.
		if (!validator.isURL(req.body.request_origin) && !validator.isIP(req.body.request_origin) || validator.contains(req.body.request_origin, '*') || req.body.request_origin.slice(-1) == '/') return res.json(403, { error: { message: 'Request origin is not a valid URL or IP address.', code: 403 } });
		// Get the App ID.
		var id = req.body.id;
		// Run a MySQL query to update the app.
		mysql.query('UPDATE `api_apps` SET `title` = :title, `request_origin` = :request_origin WHERE `id` = :id', { id: req.body.id, title: req.body.title, request_origin: req.body.request_origin }, function (err, results) {
			// Return the results to the view.
			res.json(results);
		});
	});

	app.delete('/apps', isLoggedIn, function (req, res) {
		// Get the App ID.
		var id = req.body.id;
		// Run a MySQL query for creating a new app.
		mysql.query('DELETE FROM `api_apps` WHERE `id` = :id', { id: id }, function (err, results) {
			// Return the results to the view.
			res.json(results);
		});
	});

	// Route for logging out of the API.
	app.get('/logout', isLoggedIn, function (req, res) {
		// Use sessions to logout user.
		req.session.user = null;
		// Use passport to logout user.
		req.logout();
		// Redirect user to homepage.
		res.redirect(local.api.folder);
	});

	// Route for google authentication.
	app.get('/auth/google', passport.authenticate('google', { approvalPrompt: 'force', loginHint: 'port.ac.uk' }));

	// Route for the google authentication callback.
	app.get('/auth/google/callback', passport.authenticate('google', {
		// Set redirect URL on successful log-in.
		successRedirect: local.api.folder,
		// Set redirect URL on failed log-in.
		failureRedirect: local.api.folder + '/login'
	}));
	
	// Middleware to check if the user is logged in.
	function isLoggedIn(req, res, next) {
		// Use passport to check if authenticated.
		if (req.isAuthenticated() && req.session.user) return next();
		// Redirect to login page if not.
		res.redirect(local.api.folder + '/auth/google');
	}
};