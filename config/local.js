var config = module.exports = {};

// Name of the application.
config.title = 'University of Portsmouth API';


/**
 * VERSION DETAILS
 */
config.version = {};

// Official version number as shown in the URL.
config.version.number = '1';
// Real version number with increments.
config.version.real_number = '0.0.4';
// Last version update in SQL format.
config.version.date = '2014-04-01';
// Last version update (readable).
config.version.date_readable = 'April 1st, 2014';


/**
 * API DETAILS
 */
config.api = {}

// Hostname of the application.
config.api.hostname = 'localhost';
// Port of the application.
config.api.port = 8080;
// Base URL of the application.
config.api.base_url = 'http://' + config.api.hostname + ':' + config.api.port;
// API URL including version number and trailing slash.
config.api.full_url = config.api.base_url + '/v' + config.version.number + '/';