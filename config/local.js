var config = module.exports = {};

config.title = 'University of Portsmouth API';

config.version = {};
config.version.number = '1';
config.version.real_number = '0.0.2';
config.version.date = '2014-03-21';
config.version.date_readable = 'March 21st, 2014';

config.api = {}
config.api.base_url = 'http://localhost:8080';
config.api.full_url = config.api.base_url + '/v' + config.version.number + '/';