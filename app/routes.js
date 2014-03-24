module.exports = function (app, passport, mysql, mssql) {
	// Route to get all buildings.
	app.get('/v1/buildings', isAuthorized, function (req, res) {
		// Runs a MySQL query to get all buildings.
		mysql.query('SELECT * FROM `buildings`', function (err, results) {
			// Returns appropriate error messages if something went wrong.
			if (err) return res.json(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.json(404, { error: { message: 'Buildings table is empty.', code: 404 } });
			// Returns all buildings in JSON format.
			return res.json(results);
		});
	});

	// Route to get a specific building.
	app.get('/v1/buildings/:reference', isAuthorized, function (req, res) {
		// Runs a MySQL query to get a specific building.
		mysql.query('SELECT * FROM `buildings` WHERE `reference` = :reference', { reference: req.params.reference }, function (err, results) {
			// Returns appropriate error messages if something went wrong.
			if (err) return res.json(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.json(404, { error: { message: 'Invalid building reference', code: 404 } });
			// Returns a specific building in JSON format.
			return res.json(results[0]);
		});
	});

	// Middleware to check if the user has provided a valid API key.
	function isAuthorized(req, res, next) {
		// Use passport to authenticate with localapikey.
		passport.authenticate('localapikey', function (err, user, info) {
			if (err) return next(err);
			// Returns an appropriate error message to the user.
			if (!user) return res.json(401, { error: { name: info.error, message: info.message, code: 401 } });
			// Attemps to authenticate the user.
			req.logIn(user, function (err) {
				if (err) return next(err);
				return next();
			});
		})(req, res, next);
	}
};