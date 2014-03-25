module.exports = function (app, passport, mysql, mssql, async) {
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

	// Route to get open access area availability for all buildings.
	app.get('/v1/buildings/openaccess', isAuthorized, function (req, res) {
		// Runs a MySQL query to get all the buildings that have open access areas.
		mysql.query('SELECT `buildings`.* FROM `buildings` INNER JOIN `openaccess` ON `buildings`.`id` = `openaccess`.`building_id` GROUP BY `buildings`.`id`', function (err, buildings) {
			// Sets an empty array for the data to be returned and sets the current date and time.
			var data = [], d = new Date(), today = d.getDay() + 1, time = d.toLocaleTimeString();
			// Runs a series of functions for each building returned.
			async.each(buildings, function (building, callback) {
				// Sets the opening status, total number and in use number of computers in the building.
				var open = false, total = 0, in_use = 0;
				// Runs a MySQL query for getting the opening and closing times for today for the building.
				mysql.query('SELECT `opening_time`, `closing_time` FROM `opening_times` WHERE `building_id` = ' + building.id + ' AND `day_of_the_week` = ' + today, function (err, opening_times) {
					// Sets the opening status to true if the current time is within the opening times.
					open = (time > opening_times[0].opening_time && time < opening_times[0].closing_time) ? true : false;
				});
				// Runs a MySQL query for getting the open access areas for the building.
				mysql.query('SELECT * FROM `openaccess` WHERE `building_id` = ' + building.id, function (err, openaccess) {
					// Runs a series of functions for each open access area in the building.
					async.each(openaccess, function (openacc, callback) {
						// Runs a series of functions in parallel for each open access area.
						async.parallel([
							// Runs a function for getting the total number of computers in the area.
							function (callback) {
								// Creates a new MSSQL query request.
								var labstats = new mssql.Request();
								// Runs an MSSQL query to get the total number of computers in the open access area.
								labstats.query('SELECT COUNT(*) AS count FROM LabStats.dbo.CLS_CLIENT WHERE STATIONID IN (SELECT STATIONID FROM LabStats.dbo.CLS_STATION_GROUP WHERE GROUPID = ' + openacc.groupid + ' AND ENDDATE IS NULL)', function (err, labstats) {
									// Adds the open access area computer count to the building total.
									total += labstats[0].count;
									// Calls the callback function to continue.
									callback();
								});
							},
							// Runs a function for getting the number of in-use computers in the area.
							function (callback) {
								// Creates a new MSSQL query request.
								var labstats = new mssql.Request();
								// Runs an MSSQL query to get the number of in-use computers in the open access area.
								labstats.query("SELECT COUNT(*) AS count FROM LabStats.dbo.CLS_CLIENT WHERE CURRENTUSER <> '' AND STATIONID IN (SELECT STATIONID FROM LabStats.dbo.CLS_STATION_GROUP WHERE GROUPID = " + openacc.groupid + " AND ENDDATE IS NULL)", function (err, labstats) {
									// Adds the open access area computer count to the building total.
									in_use += labstats[0].count;
									// Calls the callback function to continue.
									callback();
								});
							}
						// Runs a function after the parallely functions have finished running.
						], function () {
							// Calls the callback function to continue to the next open access area.
							callback();
						});
					// Runs a function after the functions for each open access area have finished running.
					}, function () {
						// Pushes the building object with its open access area availability data.
						data.push({
							'building': building,
							'open': open,
							'in_use': in_use,
							'total': total
						});
						// Calls the callback function to continue to the next building.
						callback();
					});
				});
			// Runs a function after all previous functions have finished executing.
			}, function () {
				// Returns the open access area availability data.
				return res.json(data);
			});
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