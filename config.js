module.exports = function () {
	var common = {
		title: 'Student Service Delivery API',
		version: {
			number: '1',
			real_number: '0.1.1',
			date: '2014-06-05',
			date_readable: 'June 5th, 2014'
		},
		mssql: {
			server: 'foo',
			user: 'bar',
			password: 'baz',
			database: 'qux'
		},
		express: {
			secret: 'foo'
		}
	};

	var env = getEnv(),
		config = objectMerge(common, env);

	config.api.full = 'http://' + config.api.hostname + config.api.folder + '/v' + config.version.number;
	config.api.public = config.api.folder + '/public';

	return config;

	function getEnv() {
		switch (process.env.NODE_ENV) {
			case 'development':
				return {
					api: {
						hostname: 'foo',
						folder: 'bar'
					},
					mysql: {
						host: 'foo',
						user: 'bar',
						password: 'baz',
						database: 'qux'
					},
					passport: {
						client_id: 'foo',
						client_secret: 'bar'
					}
				};
				break;
			case 'production':
				return {
					api: {
						hostname: 'foo',
						folder: 'bar'
					},
					mysql: {
						host: 'foo',
						user: 'bar',
						password: 'baz',
						database: 'qux'
					},
					passport: {
						client_id: 'foo',
						client_secret: 'bar'
					}
				};
				break;
			default:
				return {};
		}
	}

	function objectMerge() {
		var data = {},
			len = arguments.length;

		for (var i = 0; i < len; i++) {
			for (p in arguments[i]) {
				if (arguments[i].hasOwnProperty(p)) {
					data[p] = arguments[i][p];
				}
			}
		}

		return data;
	}
};