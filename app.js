/**
 * Module dependencies.
 */

var express = require('express'),
	mysql = require('mysql'),
	mssql = require('mssql'),
	async = require('async'),
	passport = require('passport'),
	flash = require('connect-flash'),
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;;

var port = process.env.PORT || 8080;
	config = require('./config/config'),
	local = require('./config/local');


/**
 * Module configuration.
 */

var app = express();
// Setup connection to the databases.
var webapi = mysql.createConnection(config.db.mysql),
	mssql_conn = mssql.connect(config.db.mssql);

// Serialize user instance to and from the session.
passport.serializeUser(function (user, done) {
	done(null, user);
});

// Deserialize user instance to and from the session.
passport.deserializeUser(function (obj, done) {
	done(null, obj);
});

// Use the GoogleStrategy within Passport.
passport.use(new GoogleStrategy({
		clientID: db.oauth.client_id,
		clientSecret: db.oauth.client_secret,
		callbackURL: local.url + '/auth/google/callback',
		scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
	},
	function (accessToken, refreshToken, profile, done) {
		process.nextTick(function () {
			// The user's profile is returned to represent the logged-in user.
			return done(null, profile);
		});
	}
));

// Set up the express application.
app.configure(function () {
	app.use(express.static(__dirname + '/public'));
	app.set('views', __dirname + '/public');
	// Log every request to the console.
	app.use(express.logger('dev'));
	// Read cookies needed for authentication.
	app.use(express.cookieParser());
	// Get information from HTML forms.
	app.use(express.json());
	app.use(express.urlencoded());
	// Set up ejs for templating.
	app.locals(local);
	app.set('view engine', 'ejs');
	// Session secret.
	app.use(express.session({ secret: config.express.secret }));
	app.use(passport.initialize());
	// Use persistent login sessions.
	app.use(passport.session());
	// Use connect-flash for flash messages stored in session.
	app.use(flash());
});


/**
 * Route cofiguration.
 */

// Load routes and pass in the application and passport instances.
require('./app/routes')(app, passport);


// Listen for connections.
app.listen(port, function () {
	console.log('Listening to port ' + port);
});