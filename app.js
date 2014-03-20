/**
 * Module dependencies.
 */

var express = require('express'),
	mysql = require('mysql'),
	mssql = require('mssql'),
	async = require('async'),
	passport = require('passport'),
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
	LocalAPIKeyStrategy = require('passport-localapikey').Strategy,
	dns = require('dns');

var port = process.env.PORT || 8080;
	config = require('./config/config'),
	local = require('./config/local');


/**
 * Module configuration.
 */

var app = express();
// Setup connection to the databases.
var connection = mysql.createConnection(config.db.mysql),
	mssql_conn = mssql.connect(config.db.mssql);

// Implements a custom format for query escaping.
connection.config.queryFormat = function (query, values) {
	if (!values) return query;
	return query.replace(/\:(\w+)/g, function (txt, key) {
		if (values.hasOwnProperty(key)) {
			return this.escape(values[key]);
		}
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
		callbackURL: local.url + '/auth/google/callback',
		scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
	},
	function (accessToken, refreshToken, profile, done) {
		process.nextTick(function () {
			// Check if the user is signed in under a University of Portsmouth domain.
			if (profile._json.hd !== 'port.ac.uk' && profile._json.hd !== 'myport.ac.uk') {
				// Disregards successful log-ins from non-local accounts and gives an error.
				return done(null, false);
			}

			// Check if the user already exists in the local database.
			connection.query('SELECT COUNT(`id`) AS `count` FROM `api_users` WHERE `id` = :id', { id: profile._json.id }, function (err, rows) {
				// Sets the query string to create a new record for the user.
				var query = 'INSERT INTO `api_clients` (`id`, `given_name`, `family_name`, `email`, `picture`, `hd`) VALUES (:id, :given_name, :family_name, :email, :picture, :hd)';
				// Sets the query string to update the existing user's record.
				if (rows && rows[0].count > 0) query = 'UPDATE `api_clients` SET `given_name` = :given_name, `family_name` = :family_name, `email` = :email, `picture` = :picture, "`hd` = :hd WHERE `id` = :id';

				// Runs the selected query on the local database.
				connection.query(query, { id: profile._json.id, given_name: profile._json.given_name, family_name: profile._json.family_name, email: profile._json.email, picture: profile._json.picture, hd: profile._json.hd }, function () {
					// The user's profile is returned to represent the logged-in user.
					return done(null, profile);
				});
			});
		});
	}
));

// Use the LocalAPIKeyStrategy within Passport.
passport.use(new LocalAPIKeyStrategy({
		apiKeyField: 'api_key',
		passReqToCallback: true
	},
	function (req, api_key, done) {
		// Check if the provided access token exists.
		connection.query('SELECT * FROM `api_keys` WHERE `api_key` = :api_key', { api_key: api_key }, function (err, rows) {
			if (err) return done(err);
			// Returns a message to the user that the provided API Key is invalid.
			if (!rows || !rows[0]) return done(null, false, { message: 'Invalid API Key' });

			// Checks the remote machine's hostname against the allowed request origin.
			dns.reverse(req.ip, function (err, hostnames) {
				// Loops through any hostnames.
				for (var i in hostnames) {
					// Allows the user to continue if the hostname matches the request origin.
					if (rows[0].request_origin == hostnames[i]) return done(null, rows[0].user_id);
				}
			});
			// Checks the remote machine's IP address against the allowed request origin.
			if (rows[0].request_origin !== req.ip) return done(null, false, { message: 'Invalid Request Origin' });

			// Allows the user to continue if the hostname matches the request origin.
			return done(null, rows[0].user_id);
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
});


/**
 * Route cofiguration.
 */

// Load the interface and pass in the application and passport instances.
require('./app/interface')(app, passport);


// Listen for connections.
app.listen(port, function () {
	console.log('Listening to port ' + port);
});