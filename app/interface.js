module.exports = function (app, passport, mysql) {
	// Load module dependencies.
	var async = require('async'),
		uuid = require('node-uuid');

	// Route to display the homepage.
	app.get('/', function (req, res) {
		// Render index.ejs with any potential user credentials.
		res.render('index', { name: 'index', user: req.session.user, css: 'index' });
	});

	// Route for logging in to the API.
	app.get('/login', function (req, res) {
		// Create a variable with an error flash message.
		var error = req.flash('error') || [];
		// Use passport to check if the user is already authenticated.
		if (req.isAuthenticated() && req.session.user) return res.redirect('/');
		// Check that there isn't an error.
		if (error.length == 0) return res.redirect('/auth/google');
		// Render login.ejs with any potential user credentials and error messages.
		res.render('login', { user: req.session.user, error: error });
	});

	// Route to show all the user's apps.
	app.get('/apps', isLoggedIn, function (req, res) {
		// Runs a MySQL query to get all the apps for the current user.
		mysql.query('SELECT * FROM `api_apps` WHERE `user_id` = :user_id', { user_id: req.session.user.id }, function (err, apps) {
			// Render apps.ejs with the user's apps.
			res.render('apps', { name: 'apps', user: req.session.user, apps: apps, css: 'apps' });
		});
	});

	// Route for logging out of the API.
	app.get('/logout', isLoggedIn, function (req, res) {
		// Use sessions to logout user.
		req.session.user = null;
		// Use passport to logout user.
		req.logout();
		// Redirect user to homepage.
		res.redirect('/');
	});

	// Route for displaying the API documentation.
	app.get('/documentation', function (req, res) {
		// Render documentation.ejs with the user's credentials.
		res.render('documentation', { name: 'documentation', user: req.session.user, js: 'documentation', css: 'documentation' });
	});

	// Route for google authentication.
	app.get('/auth/google', passport.authenticate('google'));

	// Route for the google authentication callback.
	app.get('/auth/google/callback', passport.authenticate('google', {
		// Set redirect URL on successful log-in.
		successRedirect: '/',
		// Set redirect URL on failed log-in.
		failureRedirect: '/login'
	}));
};

// Middleware to check if the user is logged in.
function isLoggedIn(req, res, next) {
	// Use passport to check if authenticated.
	if (req.isAuthenticated() && req.session.user) return next();
	// Redirect to login page if not.
	res.redirect('/auth/google');
}