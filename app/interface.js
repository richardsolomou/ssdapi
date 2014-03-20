module.exports = function (app, passport) {
	/**
	 * HOME
	 */
	app.get('/', function (req, res) {
		// Render index.ejs with any potential user credentials.
		res.render('index', {
			name: 'home',
			user: req.user ? req.user._json : null,
			css: 'home'
		});
	});

	/**
	 * LOGIN
	 */
	app.get('/login', function (req, res) {
		// Render login.ejs with any potential user credentials and messages.
		res.render('login', {
			name: 'login',
			user: req.user ? req.user._json : null,
			message: req.session.messages || []
		});
		// Empty session messages array.
		req.session.messages = [];
	});

	/**
	 * CREDENTIALS
	 */
	app.get('/credentials', isLoggedIn, function (req, res) {
		// Render credentials.ejs with the user's credentials.
		res.render('credentials', {
			name: 'credentials',
			user: req.user._json
		});
	});

	/**
	 * LOGOUT
	 */
	app.get('/logout', isLoggedIn, function (req, res) {
		// Use passport to logout user.
		req.logout();
		// Redirect user to homepage.
		res.redirect('/');
	});

	/**
	 * DOCUMENTATION
	 */
	app.get('/documentation', isLoggedIn, function (req, res) {
		// Render documentation.ejs with the user's credentials.
		res.render('documentation', {
			name: 'documentation',
			user: req.user._json,
			js: 'documentation',
			css: 'documentation'
		});
	});

	/**
	 * GOOGLE AUTHENTICATION
	 */
	app.get('/auth/google', passport.authenticate('google'));

	/**
	 * GOOGLE AUTHENTICATION CALLBACK
	 */
	app.get('/auth/google/callback', passport.authenticate('google', {
		// Set redirect URL on successful log-in.
		successRedirect: '/',
		// Set redirect URL on failed log-in.
		failureRedirect: '/',
		// Set flash message to display on failed log-in.
		failureMessage: 'Hosted domain must be port.ac.uk or myport.ac.uk.'
	}));
};

// Middleware to check if the user is logged in.
function isLoggedIn(req, res, next) {
	// Use passport to check if authenticated.
	if (req.isAuthenticated()) return next();
	// Redirect to login page if not.
	res.redirect('/login');
}