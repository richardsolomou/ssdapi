/**
 * Module dependencies.
 */

// Load global module dependencies.
var express = require('express'),
	mysql = require('mysql'),
	mssql = require('mssql'),
	passport = require('passport'),
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
	LocalAPIKeyStrategy = require('passport-localapikey').Strategy,
	flash = require('connect-flash'),
	url = require('url'),
	dns = require('dns');

// Set the port and load the configuration.
var port = process.env.PORT || 8080,
	config = require('./config/config'),
	local = require('./config/local');


/**
 * Module configuration.
 */

// Initialize express.
var app = express();
// Setup connection to the MySQL database.
var mysql_conn = mysql.createConnection(config.db.mysql);
// Connect to the MSSQL Database.
mssql.connect(config.db.mssql);

// Implement a custom format for query escaping.
mysql_conn.config.queryFormat = function (query, values) {
	if (!values) return query;
	return query.replace(/\:(\w+)/g, function (txt, key) {
		if (values.hasOwnProperty(key)) return this.escape(values[key]);
		return txt;
	}.bind(this));
};

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
		clientID: config.passport.client_id,
		clientSecret: config.passport.client_secret,
		callbackURL: local.api.base_url + '/auth/google/callback',
		scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
		passReqToCallback: true
	},
	function (req, accessToken, refreshToken, profile, done) {
		process.nextTick(function () {
			// Check if the user is signed in under a University of Portsmouth domain.
			if (profile._json.hd !== 'port.ac.uk' && profile._json.hd !== 'myport.ac.uk') {
				// Sets a session message.
				req.flash('error', 'Hosted domain must be port.ac.uk or myport.ac.uk');
				// Disregards successful log-ins from non-local accounts and gives an error.
				return done(null, false);
			}
			// Check if the user already exists in the local database.
			mysql_conn.query('SELECT COUNT(`id`) AS `count` FROM `api_users` WHERE `id` = :id', { id: profile._json.id }, function (err, rows) {
				// Sets the query string to create a new record for the user.
				var query = 'INSERT INTO `api_users` (`id`, `given_name`, `family_name`, `email`, `picture`, `hd`) VALUES (:id, :given_name, :family_name, :email, :picture, :hd)';
				// Sets the query string to update the existing user's record.
				if (rows && rows[0].count > 0) query = 'UPDATE `api_users` SET `given_name` = :given_name, `family_name` = :family_name, `email` = :email, `picture` = :picture, "`hd` = :hd WHERE `id` = :id';
				// Runs the selected query on the local database.
				mysql_conn.query(query, { id: profile._json.id, given_name: profile._json.given_name, family_name: profile._json.family_name, email: profile._json.email, picture: profile._json.picture, hd: profile._json.hd }, function () {
					// Save user to session.
					req.session.user = profile._json;
					// The user's profile is returned to represent the logged-in user.
					return done(null, profile);
				});
			});
		});
	}
));

// Use the LocalAPIKeyStrategy within Passport.
passport.use(new LocalAPIKeyStrategy({
		apiKeyField: 'access_token',
		passReqToCallback: true
	},
	function (req, access_token, done) {
		// Check if the provided access token exists.
		mysql_conn.query('SELECT * FROM `api_apps` WHERE `access_token` = :access_token', { access_token: access_token }, function (err, rows) {
			if (err) return done(err);
			// Returns a message to the user that the provided access token is invalid.
			if (!rows || !rows[0]) return done(null, false, { message: 'Invalid access token.' });
			// Checks the remote machine's IP address against the allowed request origin.
			if (req.ip == rows[0].request_origin) return done(null, rows[0].user_id);
			// Checks if there is no referer header.
			if (!req.headers.referer) return done(null, false, { message: 'Invalid request origin.' });
			// Parses the referer header into a URL object.
			var referer = url.parse(req.headers.referer);
			// Checks if the referer host is an allowed request origin.
			if (referer.host == rows[0].request_origin) return done(null, rows[0].user_id);
			// Resolves the referer host to get its IPs.
			dns.resolve(referer.host, function (err, ips) {
				// Loops through all of the returned IPs.
				for (var i in ips) {
					// Checks if the IP against the allowed request origin.
					if (ips[i] == rows[0].request_origin) return done(null, rows[0].user_id);
				}
			});
		});
	}
));

// Set the views folder as "public".
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/public');
// Log requests to the console.
app.use(express.logger('dev'));
// Read cookies needed for authentication.
app.use(express.cookieParser());
// Get information from HTML forms.
app.use(express.json());
app.use(express.urlencoded());
// Set up ejs for templating.
app.set('view engine', 'ejs');
// Set up application local variables.
app.locals(local);
// Set the session secret.
app.use(express.session({ secret: config.express.secret }));
// Initialize passport and use persistent login sessions.
app.use(passport.initialize());
app.use(passport.session());
// Use middleware to store flash messages.
app.use(flash());
// Allows JSONP requests.
app.set('jsonp callback', true);


/**
 * Route cofiguration.
 */

// Load the interface and pass in the application and passport instances.
require('./app/interface')(app, passport, mysql_conn);

// Load the API routes and pass in the application and passport instances.
require('./app/api')(app, passport, mysql_conn, mssql);


// Listen for connections.
app.listen(port, function () {
	console.log('Listening to port ' + port);
});