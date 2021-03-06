/**
 * Module dependencies.
 */

// Load global module dependencies.
var express = require('express'),
	bodyParser = require('body-parser'),
	morgan = require('morgan'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	mysql = require('mysql'),
	mssql = require('mssql'),
	passport = require('passport'),
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
	LocalAPIKeyStrategy = require('passport-localapikey').Strategy,
	flash = require('connect-flash'),
	redis = require('redis').createClient(),
	RedisStore = require('connect-redis')(session),
	async = require('async'),
	url = require('url'),
	dns = require('dns'),
	v6 = require('ipv6').v6;

// Load the configuration.
var local = [require('./version.json'), require('./config.json')[process.env.NODE_ENV || 'development']],
	config = {};

// Loop through the configuration objects.
for (var i = 0; i < local.length; i++) {
	// Loop through each of their properties.
	for (p in local[i]) {
		// Append the property to the new configuration object.
		if (local[i].hasOwnProperty(p)) config[p] = local[i][p];
	}
}

// Set some extra configuration.
config.api.full = 'http://' + config.api.hostname + config.api.folder + '/v' + config.version.number;
config.api.public = config.api.folder + '/public';

// Set up the firewall bypass proxy.
require('proxy-out')('http://wwwcache.port.ac.uk:81/');

/**
 * Module configuration.
 */

// Initialize express.
var app = express();
// Setup connection to the MySQL database.
var mysql_conn = mysql.createConnection(config.db.api);
// Connect to the MSSQL Database.
mssql.connect(config.db.labstats);

// Implement a custom format for query escaping.
mysql_conn.config.queryFormat = function (query, values) {
	if (!values) return query;
	return query.replace(/\:(\w+)/g, function (txt, key) {
		if (values.hasOwnProperty(key)) return this.escape(values[key]);
		return txt;
	}.bind(this));
};

// Extend the date class to add a function to turn a date into SQL format.
Date.prototype.yyyymmdd = function() {
	var yyyy = this.getFullYear().toString();
	var mm = (this.getMonth() + 1).toString();
	var dd = this.getDate().toString();
	return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]);
};

// Serialize user instance to and from the session.
passport.serializeUser(function (user, done) {
	done(null, user);
});

// Deserialize user instance to and from the session.
passport.deserializeUser(function (user, done) {
	done(null, user);
});

// Use the GoogleStrategy within Passport.
passport.use(new GoogleStrategy({
		clientID: config.passport.client_id,
		clientSecret: config.passport.client_secret,
		callbackURL: 'http://' + config.api.hostname + config.api.folder + '/auth/google/callback',
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
			// Set the origin variable.
			var origin = rows[0].request_origin;
			// Set the address variable as an IPv6 address.
			var address = (typeof req.headers['x-forwarded-for'] !== 'undefined') ? new v6.Address(req.headers['x-forwarded-for']) : null;
			// Checks the remote machine's proxied IP address against the allowed request origin.
			if (req.headers['x-forwarded-for'] && (req.headers['x-forwarded-for'] == origin || req.protocol + '://' + req.headers['x-forwarded-for'] == origin) || (address && address.isValid() && (address && address.six2four().gateway == origin || req.protocol + '://' + address.six2four().gateway == origin))) {
				return done(null, rows[0].user_id);
			// Checks the remote machine's IP address against the allowed request origin.
			} else if (req.ip == origin || req.protocol + '://' + req.ip == origin) {
				return done(null, rows[0].user_id);
			// Checks if there is a referer header.
			} else if (req.headers.referer) {
				// Parses the referer header into a URL object.
				var referer = url.parse(req.headers.referer);
				// Checks if the referer host is an allowed request origin.
				if (referer.host == origin || req.protocol + '://' + referer.host == origin) return done(null, rows[0].user_id);
				// Resolves the referer host to get its IPs.
				dns.resolve(referer.host, function (err, ips) {
					// Checks if the IP against the allowed request origin.
					return (ips[0] == origin || req.protocol + '://' + ips[0] == origin) ? done(null, rows[0].user_id) : done(null, false, { message: 'Invalid request origin.' });
				});
			} else {
				return done(null, false, { message: 'Invalid request origin.' });
			}
		});
	}
));

// Set the views folder as "public".
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/public');
// Log requests to the console.
app.use(morgan('short'));
// Read cookies needed for authentication.
app.use(cookieParser());
// Get information from HTML forms.
app.use(bodyParser());
// Set up ejs for templating.
app.set('view engine', 'ejs');
// Set up application local variables.
app.locals = config;
// Set the session secret.
app.use(session({
	store: new RedisStore({
		host: config.api.hostname,
		port: 6379,
		prefix: 'ssdapi_sess',
		client: redis
	}),
	secret: config.express.secret
}));
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

// Load the API routes and pass in the application and passport instances.
require('./routes/api')(app, passport, mysql_conn, mssql, config);

// Load the interface and pass in the application and passport instances.
require('./routes/interface')(app, passport, mysql_conn, config);

// Listen for connections.
app.listen(process.env.PORT);