/**
 * Module dependencies.
 */

var express = require('express'),
	mysql = require('mysql'),
	mssql = require('mssql'),
	async = require('async'),
	passport = require('passport'),
	flash = require('connect-flash');

var port = process.env.PORT || 8080;
	config = require('./config');


/**
 * Module configuration.
 */

var app = express(),
	webapi = mysql.createConnection(config.mysql),
	mssql_conn = mssql.connect(config.mssql);


/**
 * Route cofiguration.
 */

app.get('/', function (req, res) {
	res.send('uopwebapi');
});


// Listen for connections.
app.listen(port, function () {
	console.log('Listening to port ' + port);
});