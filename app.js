/**
 * Module dependencies.
 */

var express = require('express'),
	ejs = require('ejs'),
	mysql = require('mysql'),
	mssql = require('mssql'),
	async = require('async'),
	passport = require('passport'),
	flash = require('connect-flash');

var port = process.env.PORT || 8080;
	db = require('./config/database'),
	local = require('./config/local');


/**
 * Module configuration.
 */

var app = express();
// Setup connection to the databases.
var webapi = mysql.createConnection(db.mysql),
	mssql_conn = mssql.connect(db.mssql);

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
	app.use(express.session({ secret: 'uopwebapi' }));
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