module.exports = function (app, passport) {
	/**
	 * HOME
	 */
	app.get('/', function (req, res) {
		// Render index.ejs with any potential user credentials.
		res.render('index', {
			name: 'index',
			user: req.session.user,
			css: 'index'
		});
	});

	/**
	 * LOGIN
	 */
	app.get('/login', function (req, res) {
		// Use passport to check if the user is already authenticated.
		if (req.isAuthenticated()) return res.redirect('/');
		// Render login.ejs.
		res.render('login');
	});

	/**
	 * CREDENTIALS
	 */
	app.get('/credentials', isLoggedIn, function (req, res) {
		// Render credentials.ejs with the user's credentials.
		res.render('credentials', {
			name: 'credentials',
			user: req.session.user
		});
	});

	/**
	 * LOGOUT
	 */
	app.get('/logout', isLoggedIn, function (req, res) {
		// Use sessions to logout user.
		req.session.user = null;
		// Use passport to logout user.
		req.logout();
		// Redirect user to homepage.
		res.redirect('/');
	});

	/**
	 * DOCUMENTATION
	 */
	app.get('/documentation', function (req, res) {
		// Render documentation.ejs with the user's credentials.
		res.render('documentation', {
			name: 'documentation',
			user: req.session.user,
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