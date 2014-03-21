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
config.version.real_number = '0.0.2';
// Last version update in SQL format.
config.version.date = '2014-03-21';
// Last version update (readable).
config.version.date_readable = 'March 21st, 2014';


/**
 * API DETAILS
 */
config.api = {}

// Base URL of the application.
config.api.base_url = 'http://localhost:8080';
// API URL including version number and trailing slash.
config.api.full_url = config.api.base_url + '/v' + config.version.number + '/';