module.exports = function (app, passport, mysql, mssql, async) {
	// Route to get all users.
	app.get('/v1/users', isAuthorized, function (req, res) {
		// Runs a MySQL query to get all users.
		mysql.query('SELECT `title`, `first_name`, `last_name`, `job_title`, `building`, `department`, `extension`, `email`, `username`, `section`, `faculty` FROM `users`', function (err, results) {
			// Returns appropriate error messages if something went wrong.
			if (err) return res.json(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.json(404, { error: { message: 'Users table is empty.', code: 404 } });
			// Returns all users in JSON format.
			return res.json(results);
		});
	});

	// Route to get all service status problems.
	app.get('/v1/services', isAuthorized, function (req, res) {
		// Runs a MySQL query to get all service status problems.
		mysql.query('SELECT `name`, `info`, `description`, `status`, `modified_date`, `type`, `service_manager`, `main_link_name` FROM `services`', function (err, results) {
			// Returns appropriate error messages if something went wrong.
			if (err) return res.json(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.json(404, { error: { message: 'Service status table is empty.', code: 404 } });
			// Returns all service status problems in JSON format.
			return res.json(results);
		});
	});

	// Route to get all the timetables for a specific lab.
	app.get('/v1/buildings/:reference/labs/:short_identifier/timetables', isAuthorized, function (req, res) {
		// Runs a MySQL query to get the timetables for a specific lab.
		mysql.query('SELECT `lecturer`, `start_time`, `finish_time`, `module_name`, `module_type` FROM `timetables` INNER JOIN `buildings` ON `buildings`.`id` = `timetables`.`building_id` AND `buildings`.`reference` = :reference INNER JOIN `labs` ON `labs`.`id` = `timetables`.`lab_id` AND `labs`.`short_identifier` = :short_identifier', { reference: req.params.reference, short_identifier: req.params.short_identifier }, function (err, results) {
			// Returns appropriate error messages if something went wrong.
			if (err) return res.json(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.json(404, { error: { message: 'There are no timetables for this building.', code: 404 } });
			// Returns the timetables in JSON format.
			return res.json(results);
		});
	});

	// Route to get all the timetables for a specific building.
	app.get('/v1/buildings/:reference/labs/timetables', isAuthorized, function (req, res) {
		// Runs a MySQL query to get the timetables for a specific building.
		mysql.query('SELECT `lecturer`, `start_time`, `finish_time`, `module_name`, `module_type`, `lab_id` FROM `timetables` INNER JOIN `buildings` ON `buildings`.`id` = `timetables`.`building_id` AND `buildings`.`reference` = :reference', { reference: req.params.reference }, function (err, results) {
			// Returns appropriate error messages if something went wrong.
			if (err) return res.json(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.json(404, { error: { message: 'There are no timetables for this building.', code: 404 } });
			// Loops through all the timetables.
			async.each(results, function (timetable, callback) {
				// Runs a MySQL query to get the lab details for the timetable.
				mysql.query('SELECT `short_identifier`, `room_number` FROM `labs` WHERE `id` = :lab_id', { lab_id: timetable.lab_id }, function (err, labs) {
					// Appends the lab to the timetable object.
					timetable.lab = labs[0];
					// Deletes the timetable lab id.
					delete timetable.lab_id;
					// Calls the callback function to continue.
					callback();
				});
			// Executes a function after the buildings loop has finished.
			}, function () {
				// Returns timetables timetables in JSON format.
				return res.json(results);
			});
		});
	});

	// Route to get all the timetables.
	app.get('/v1/buildings/labs/timetables', isAuthorized, function (req, res) {
		// Runs a MySQL query to get the timetables.
		mysql.query('SELECT * FROM `timetables`', function (err, results) {
			// Returns appropriate error messages if something went wrong.
			if (err) return res.json(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.json(404, { error: { message: 'Timetables table is empty.', code: 404 } });
			// Loops through all the timetables.
			async.each(results, function (timetable, callback) {
				// Runs a series of functions in parallel for each timetable.
				async.parallel([
					// Runs a function for getting the building details for the timetable.
					function (callback) {
						// Runs a MySQL query to get the building details for the timetable.
						mysql.query('SELECT `name`, `reference` FROM `buildings` WHERE `id` = :building_id', { building_id: timetable.building_id }, function (err, buildings) {
							// Appends the building to the timetable object.
							timetable.building = buildings[0];
							// Deletes the timetable building id.
							delete timetable.building_id;
							// Calls the callback function to continue.
							callback();
						});
					},
					// Runs a function for getting the lab details for the timetable.
					function (callback) {
						// Runs a MySQL query to get the lab details for the timetable.
						mysql.query('SELECT `short_identifier`, `room_number` FROM `labs` WHERE `id` = :lab_id', { lab_id: timetable.lab_id }, function (err, labs) {
							// Appends the lab to the timetable object.
							timetable.lab = labs[0];
							// Deletes the timetable lab id.
							delete timetable.lab_id;
							// Calls the callback function to continue.
							callback();
						});
					}
				// Runs a function after the previous parallel functions have finished executing.
				], function () {
					// Deletes the timetable id.
					delete timetable.id;
					// Calls the callback function to continue.
					callback();
				});
			// Executes a function after the buildings loop has finished.
			}, function () {
				// Returns the timetables in JSON format.
				return res.json(results);
			});
		});
	});

	// Route to get a specific lab.
	app.get('/v1/buildings/:reference/labs/:short_identifier', isAuthorized, function (req, res) {
		// Runs a MySQL query to get the lab.
		mysql.query('SELECT `labs`.`short_identifier`, `labs`.`room_number` FROM `labs` INNER JOIN `buildings` ON `buildings`.`id` = `labs`.`building_id` AND `buildings`.`reference` = :reference WHERE `labs`.`short_identifier` = :short_identifier', { reference: req.params.reference, short_identifier: req.params.short_identifier }, function (err, results) {
			// Returns appropriate error messages if something went wrong.
			if (err) return res.json(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.json(404, { error: { message: 'Invalid lab short identifier.', code: 404 } });
			// Returns the lab in JSON format.
			return res.json(results[0]);
		});
	});

	// Route to get the shared teaching spaces of a specific building.
	app.get('/v1/buildings/:reference/labs', isAuthorized, function (req, res) {
		// Runs a MySQL query to get the shared teaching spaces of the building.
		mysql.query('SELECT `labs`.`short_identifier`, `labs`.`room_number` FROM `labs` INNER JOIN `buildings` ON `buildings`.`id` = `labs`.`building_id` AND `buildings`.`reference` = :reference', { reference: req.params.reference }, function (err, results) {
			// Returns appropriate error messages if something went wrong.
			if (err) return res.json(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.json(404, { error: { message: 'There are no labs available for this building.', code: 404 } });
			// Returns all labs in JSON format.
			return res.json(results);
		});
	});

	// Route to get all shared teaching spaces.
	app.get('/v1/buildings/labs', isAuthorized, function (req, res) {
		// Runs a MySQL query to get all labs.
		mysql.query('SELECT `short_identifier`, `room_number`, `building_id` FROM `labs`', function (err, results) {
			// Returns appropriate error messages if something went wrong.
			if (err) return res.json(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.json(404, { error: { message: 'Labs table is empty.', code: 404 } });
			// Loops through all the labs.
			async.each(results, function (lab, callback) {
				// Runs a MySQL query to get the labs for the building.
				mysql.query('SELECT `name`, `reference` FROM `buildings` WHERE `id` = :building_id', { building_id: lab.building_id }, function (err, buildings) {
					// Appends the building to the lab object.
					lab.building = buildings[0];
					// Deletes the lab building id.
					delete lab.building_id;
					// Calls the callback function to continue.
					callback();
				});
			// Executes a function after the buildings loop has finished.
			}, function () {
				// Returns all labs in JSON format.
				return res.json(results);
			});
		});
	});

	// Route to get the opening times of a specific building.
	app.get('/v1/buildings/:reference/openingtimes', isAuthorized, function (req, res) {
		// Runs a MySQL query to get the opening times of all buildings.
		mysql.query('SELECT `openingtimes`.`day_of_the_week`, `openingtimes`.`opening_time`, `openingtimes`.`closing_time` FROM `openingtimes` INNER JOIN `buildings` ON `buildings`.`id` = `openingtimes`.`building_id` AND `buildings`.`reference` = :reference', { reference: req.params.reference }, function (err, results) {
			// Returns appropriate error messages if something went wrong.
			if (err) return res.json(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.json(404, { error: { message: 'Opening times are not available for this building.', code: 404 } });
			// Returns all buildings in JSON format.
			return res.json(results);
		});
	});

	// Route to get the opening times of all buildings.
	app.get('/v1/buildings/openingtimes', isAuthorized, function (req, res) {
		var data;
		// Runs a MySQL query to get the opening times of all buildings.
		mysql.query('SELECT `building_id`, `day_of_the_week`, `opening_time`, `closing_time` FROM `openingtimes`', function (err, results) {
			// Returns appropriate error messages if something went wrong.
			if (err) return res.json(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.json(404, { error: { message: 'Buildings table is empty.', code: 404 } });
			// Loops through all the opening times.
			async.each(results, function (openingtimes, callback) {
				// Runs a MySQL query for getting the building details.
				mysql.query('SELECT `name`, `reference` FROM `buildings` WHERE `id` = :building_id', { building_id: openingtimes.building_id }, function (err, buildings) {
					// Deletes the building's id.
					delete openingtimes.building_id;
					// Appends the building data to the opening times object.
					openingtimes.building = buildings[0];
					// Calls the callback function to continue.
					callback();
				});
			// Executes a function after the buildings loop has finished.
			}, function () {
				// Returns all buildings and their opening times in JSON format.
				return res.json(results);
			});
		});
	});

	// Route to get open access area availability for all buildings.
	app.get('/v1/buildings/:reference?/openaccess', isAuthorized, function (req, res) {
		// Runs a series of functions in order.
		async.series([
			// Runs a function for checking if a building reference was defined.
			function (callback) {
				// Checks if a building reference was not defined.
				if (!req.params.reference) return callback();
				// Runs a MySQL query for getting the building data of the referenced building.
				mysql.query('SELECT * FROM `buildings` WHERE `reference` = :reference', { reference: req.params.reference }, function (err, results) {
					// Returns the building id as part of the callback to the next function.
					callback(null, 'WHERE `buildings`.`id` = ' + results[0].id);
				});
			}
		// Runs a function that gets the open access area availability for the specified building (if any) or all buildings.
		], function (err, where) {
			// Runs a MySQL query to get all the buildings that have open access areas.
			mysql.query('SELECT `buildings`.`id`, `buildings`.`name`, `buildings`.`reference` FROM `buildings` INNER JOIN `openaccess` ON `buildings`.`id` = `openaccess`.`building_id` ' + where + ' GROUP BY `buildings`.`id`', function (err, results) {
				// Returns appropriate error messages if something went wrong.
				if (err) return res.json(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
				if (!results || !results.length) return res.json(404, { error: { message: 'Building does not contain an open access area.', code: 404 } });
				// Sets an empty array for the data to be returned and sets the current date and time.
				var data = [], d = new Date(), today = d.getDay() - 1, time = d.toLocaleTimeString(), days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
				// Runs a series of functions for each building returned.
				async.each(results, function (building, callback) {
					// Sets the opening status, total number and in use number of computers in the building.
					var open = false, total = 0, in_use = 0;
					// Runs a MySQL query for getting the opening and closing times for today for the building.
					mysql.query('SELECT * FROM `openingtimes` WHERE `building_id` = ' + building.id + ' AND `day_of_the_week` = "' + days[today] + '"', function (err, openingtimes) {
						// Sets the opening status to true if the current time is within the opening times.
						open = (time > openingtimes[0].opening_time && time < openingtimes[0].closing_time) ? true : false;
					});
					// Runs a MySQL query for getting the open access areas for the building.
					mysql.query('SELECT * FROM `openaccess` WHERE `building_id` = ' + building.id, function (err, openaccess) {
						// Deletes the building id.
						delete building.id;
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
								'open': open,
								'in_use': in_use,
								'total': total,
								'building': building
							});
							// Calls the callback function to continue to the next building.
							callback();
						});
					});
				// Runs a function after all previous functions have finished executing.
				}, function () {
					// Checks if a building reference was passed.
					if (req.params.reference) {
						// Uses the first record in the array.
						data = data[0];
						// Deletes the building data.
						delete data.building;
					}
					// Returns the open access area availability data.
					return res.json(data);
				});
			});
		});
	});

	// Route to get a specific building.
	app.get('/v1/buildings/:reference', isAuthorized, function (req, res) {
		// Runs a MySQL query to get a specific building.
		mysql.query('SELECT `name`, `reference`, `latitude`, `longitude` FROM `buildings` WHERE `reference` = :reference', { reference: req.params.reference }, function (err, results) {
			// Returns appropriate error messages if something went wrong.
			if (err) return res.json(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.json(404, { error: { message: 'Invalid building reference.', code: 404 } });
			// Returns a specific building in JSON format.
			return res.json(results[0]);
		});
	});

	// Route to get all buildings.
	app.get('/v1/buildings', isAuthorized, function (req, res) {
		// Runs a MySQL query to get all buildings.
		mysql.query('SELECT `name`, `reference`, `latitude`, `longitude` FROM `buildings`', function (err, results) {
			// Returns appropriate error messages if something went wrong.
			if (err) return res.json(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.json(404, { error: { message: 'Buildings table is empty.', code: 404 } });
			// Returns all buildings in JSON format.
			return res.json(results);
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