/**
 * Module dependencies.
 */

var express = require('express'),
	mysql = require('mysql'),
	mssql = require('mssql'),
	async = require('async'),
	db_config = require('./config');


/**
 * Module configuration.
 */

var config = db_config(),
	app = express(),
	webapi = mysql.createConnection(config.mysql),
	mssql_conn = mssql.connect(config.mssql);


/**
 * Route cofiguration.
 */

app.get('/', function (req, res) {
	res.send('uopwebapi');
});


// Listen for connections.
app.listen(4000, function () {
	console.log('Listening to port 4000');
});