module.exports = function (app, passport) {
	// Homepage.
	app.get('/', function (req, res) {
		res.render('index.ejs');
	});

	// Login form.
	app.get('/login', function (req, res) {
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	// Register form.
	app.get('/register', function (req, res) {
		res.render('register.ejs', { message: req.flash('registerMessage') });
	});

	// Profile section.
	app.get('/profile', isLoggedIn, function (req, res) {
		res.render('profile.ejs', { user: req.user });
	});

	// Logout.
	app.get('/logout', function (req, res) {
		req.logout();
		res.redirect('/');
	});
};

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) return next();
	res.redirect('/');
}