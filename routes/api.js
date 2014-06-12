module.exports = function (app, passport, mysql, mssql, config) {
	// Load module dependencies.
	var async = require('async');

	// Route to get all bus stops.
	app.get(config.api.folder + '/v1/bus', isAuthorized, function (req, res) {
		// Run a MySQL query to get all the bus stops.
		mysql.query('SELECT * FROM `bus_stops`', function (err, results) {
			// Return appropriate error messages if something went wrong.
			if (err) return res.jsonp(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.jsonp(404, { error: { message: 'Bus stops table is empty.', code: 404 } });
			// Return all bus stops in JSON format.
			return res.jsonp(results);
		});
	});

	// Route to get bus journeys.
	app.get(config.api.folder + '/v1/bus/journeys', isAuthorized, function (req, res) {
		// Run a MySQL query to get bus journeys.
		mysql.query('SELECT `journey`, `weekend`, `time` FROM `bus_timetable` GROUP BY `journey`, `weekend` ORDER BY `journey`', function (err, results) {
			// Return appropriate error messages if something went wrong.
			if (err) return res.jsonp(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.jsonp(404, { error: { message: 'Bus timetable table is empty.', code: 404 } });
			// Setup the data to be returned.
			var data = { weekday: [], weekend: [] };
			// Loop through all the results.
			async.each(results, function (journey, callback) {
				// Set the journey type.
				var weekend = journey.weekend;
				// Create a start time for the journey.
				journey.start_time = journey.time;
				// Delete the journey type.
				delete journey.weekend;
				// Delete the journey time.
				delete journey.time;
				// Check that the journey is not on the weekend.
				if (weekend == 0) {
					// Push the journey data to the weekday array.
					data.weekday.push(journey);
				} else {
					// Push the journey data to the weekend array.
					data.weekend.push(journey);
				}
				// Call the callback function to continue.
				callback();
			// Execute a function after the results loop has finished.
			}, function () {
				// Return results in JSON format.
				return res.jsonp(data);
			});
		});
	});

	// Route to get a specific bus stop.
	app.get(config.api.folder + '/v1/bus/:id', isAuthorized, function (req, res) {
		// Run a MySQL query to get a specific bus stop.
		mysql.query('SELECT * FROM `bus_stops` WHERE `id` = :id', { id: req.params.id }, function (err, results) {
			// Return appropriate error messages if something went wrong.
			if (err) return res.jsonp(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.jsonp(404, { error: { message: 'Bus stop does not exist.', code: 404 } });
			// Return the bus stop in JSON format.
			return res.jsonp(results[0]);
		});
	});

	// Route to get bus stop specific timetables.
	app.get(config.api.folder + '/v1/bus/:id/timetable', isAuthorized, function (req, res) {
		// Run a MySQL query to get bus stop specific timetables.
		mysql.query('SELECT `journey`, `time`, `weekend` FROM `bus_timetable` WHERE `stop_id` = :stop_id', { stop_id: req.params.id }, function (err, results) {
			// Return appropriate error messages if something went wrong.
			if (err) return res.jsonp(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.jsonp(404, { error: { message: 'There are no timetables for this bus stop.', code: 404 } });
			// Setup the data to be returned.
			var data = { weekday: [], weekend: [] };
			// Loop through all the results.
			async.each(results, function (timetable, callback) {
				// Set the timetable type.
				var weekend = timetable.weekend;
				// Delete the timetable type.
				delete timetable.weekend;
				// Check that the timetable is not on the weekend.
				if (weekend == 0) {
					// Push the timetable data to the weekday array.
					data.weekday.push(timetable);
				} else {
					// Push the timetable data to the weekend array.
					data.weekend.push(timetable);
				}
				// Call the callback function to continue.
				callback();
			// Execute a function after the results loop has finished.
			}, function () {
				// Return results in JSON format.
				return res.jsonp(data);
			});
		});
	});


	app.get(config.api.folder + '/v1/bus/journeys/:id', isAuthorized, function (req, res) {
		// Run a MySQL query to get bus stop timetables.
		mysql.query('SELECT `stop_id`, `time`, `weekend` FROM `bus_timetable` WHERE `journey` = :journey', { journey: req.params.id }, function (err, results) {
			// Return appropriate error messages if something went wrong.
			if (err) return res.jsonp(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.jsonp(404, { error: { message: 'There are no timetables for this journey.', code: 404 } });
			// Setup the data to be returned.
			var data = { weekday: [], weekend: [] };
			// Loop through all the results.
			async.each(results, function (timetable, callback) {
				// Run a MySQL query to get the bus stop details for the timetable.
				mysql.query('SELECT * FROM `bus_stops` WHERE `id` = :stop_id', { stop_id: timetable.stop_id }, function (err, stops) {
					// Append the bus stop to the timetable object.
					timetable.stop = stops[0];
					// Delete the timetable bus stop id.
					delete timetable.stop_id;
					// Set the timetable type.
					var weekend = timetable.weekend;
					// Delete the timetable type.
					delete timetable.weekend;
					// Check that the timetable is not on the weekend.
					if (weekend == 0) {
						// Push the timetable data to the weekday array.
						data.weekday.push(timetable);
					} else {
						// Push the timetable data to the weekend array.
						data.weekend.push(timetable);
					}
					// Call the callback function to continue.
					callback();
				});
			// Execute a function after the results loop has finished.
			}, function () {
				// Return results in JSON format.
				return res.jsonp(data);
			});
		});
	});

	
	// Route to get all service status problems.
	app.get(config.api.folder + '/v1/services', isAuthorized, function (req, res) {
		// Run a MySQL query to get all service status problems.
		mysql.query('SELECT `name`, `info`, `description`, `status`, `modified_date`, `type`, `service_manager`, `main_link_name` FROM `services`', function (err, results) {
			// Return appropriate error messages if something went wrong.
			if (err) return res.jsonp(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.jsonp(404, { error: { message: 'Service status table is empty.', code: 404 } });
			// Return all service status problems in JSON format.
			return res.jsonp(results);
		});
	});

	// Route to get all the timetables for a specific lab.
	app.get(config.api.folder + '/v1/buildings/:reference/labs/:short_identifier/timetables', isAuthorized, function (req, res) {
		// Run a MySQL query to get the timetables for a specific lab.
		mysql.query('SELECT `start_time`, `finish_time`, `module_name`, `module_type` FROM `timetables` INNER JOIN `buildings` ON `buildings`.`id` = `timetables`.`building_id` AND `buildings`.`reference` = :reference INNER JOIN `rooms` ON `rooms`.`id` = `timetables`.`room_id` AND `rooms`.`short_identifier` = :short_identifier ORDER BY `start_time`, `finish_time`', { reference: req.params.reference, short_identifier: req.params.short_identifier }, function (err, results) {
			// Return appropriate error messages if something went wrong.
			if (err) return res.jsonp(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.jsonp(404, { error: { message: 'There are no timetables for this building.', code: 404 } });
			// Return the timetables in JSON format.
			return res.jsonp(results);
		});
	});

	// Route to get all the timetables for a specific building.
	app.get(config.api.folder + '/v1/buildings/:reference/labs/timetables', isAuthorized, function (req, res) {
		// Run a MySQL query to get the timetables for a specific building.
		mysql.query('SELECT `start_time`, `finish_time`, `module_name`, `module_type`, `room_id` FROM `timetables` INNER JOIN `buildings` ON `buildings`.`id` = `timetables`.`building_id` AND `buildings`.`reference` = :reference ORDER BY `start_time`, `finish_time`', { reference: req.params.reference }, function (err, results) {
			// Return appropriate error messages if something went wrong.
			if (err) return res.jsonp(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.jsonp(404, { error: { message: 'There are no timetables for this building.', code: 404 } });
			// Loop through all the timetables.
			async.each(results, function (timetable, callback) {
				// Run a MySQL query to get the lab details for the timetable.
				mysql.query('SELECT `short_identifier`, `room_number` FROM `rooms` WHERE `id` = :room_id AND `type` LIKE "%labs%"', { room_id: timetable.room_id }, function (err, rooms) {
					// Append the lab to the timetable object.
					timetable.lab = rooms[0];
					// Delete the timetable lab id.
					delete timetable.room_id;
					// Call the callback function to continue.
					callback();
				});
			// Execute a function after the results loop has finished.
			}, function () {
				// Return timetables timetables in JSON format.
				return res.jsonp(results);
			});
		});
	});

	// Route to get all the timetables.
	app.get(config.api.folder + '/v1/buildings/labs/timetables', isAuthorized, function (req, res) {
		// Run a MySQL query to get the timetables.
		mysql.query('SELECT * FROM `timetables`', function (err, results) {
			// Return appropriate error messages if something went wrong.
			if (err) return res.jsonp(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.jsonp(404, { error: { message: 'Timetables table is empty.', code: 404 } });
			// Loop through all the timetables.
			async.each(results, function (timetable, callback) {
				// Run a series of functions in parallel for each timetable.
				async.parallel([
					// Run a function for getting the building details for the timetable.
					function (callback) {
						// Run a MySQL query to get the building details for the timetable.
						mysql.query('SELECT `name`, `reference` FROM `buildings` WHERE `id` = :building_id', { building_id: timetable.building_id }, function (err, buildings) {
							// Append the building to the timetable object.
							timetable.building = buildings[0];
							// Delete the timetable building id.
							delete timetable.building_id;
							// Call the callback function to continue.
							callback();
						});
					},
					// Run a function for getting the lab details for the timetable.
					function (callback) {
						// Run a MySQL query to get the lab details for the timetable.
						mysql.query('SELECT `short_identifier`, `room_number` FROM `rooms` WHERE `id` = :room_id AND `type` LIKE "%labs%"', { room_id: timetable.room_id }, function (err, rooms) {
							// Append the lab to the timetable object.
							timetable.lab = rooms[0];
							// Delete the timetable lab id.
							delete timetable.room_id;
							// Call the callback function to continue.
							callback();
						});
					}
				// Run a function after the previous parallel functions have finished executing.
				], function () {
					// Delete the timetable id.
					delete timetable.id;
					// Call the callback function to continue.
					callback();
				});
			// Execute a function after the results loop has finished.
			}, function () {
				// Return the timetables in JSON format.
				return res.jsonp(results);
			});
		});
	});

	// Route to get a specific lab.
	app.get(config.api.folder + '/v1/buildings/:reference/labs/:short_identifier', isAuthorized, function (req, res) {
		// Run a MySQL query to get the lab.
		mysql.query('SELECT `rooms`.`short_identifier`, `rooms`.`room_number` FROM `rooms` INNER JOIN `buildings` ON `buildings`.`id` = `rooms`.`building_id` AND `buildings`.`reference` = :reference WHERE `rooms`.`short_identifier` = :short_identifier', { reference: req.params.reference, short_identifier: req.params.short_identifier }, function (err, results) {
			// Return appropriate error messages if something went wrong.
			if (err) return res.jsonp(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.jsonp(404, { error: { message: 'Invalid lab short identifier.', code: 404 } });
			// Return the lab in JSON format.
			return res.jsonp(results[0]);
		});
	});

	// Route to get the shared teaching spaces of a specific building.
	app.get(config.api.folder + '/v1/buildings/:reference/labs', isAuthorized, function (req, res) {
		// Run a MySQL query to get the shared teaching spaces of the building.
		mysql.query('SELECT `rooms`.`short_identifier`, `rooms`.`room_number` FROM `rooms` INNER JOIN `buildings` ON `buildings`.`id` = `rooms`.`building_id` AND `buildings`.`reference` = :reference WHERE `rooms`.`type` LIKE "%labs%"', { reference: req.params.reference }, function (err, results) {
			// Return appropriate error messages if something went wrong.
			if (err) return res.jsonp(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.jsonp(404, { error: { message: 'There are no labs available for this building.', code: 404 } });
			// Return all labs in JSON format.
			return res.jsonp(results);
		});
	});

	// Route to get all shared teaching spaces.
	app.get(config.api.folder + '/v1/buildings/labs', isAuthorized, function (req, res) {
		// Run a MySQL query to get all labs.
		mysql.query('SELECT `short_identifier`, `room_number`, `building_id` FROM `rooms` WHERE `type` LIKE "%labs%"', function (err, results) {
			// Return appropriate error messages if something went wrong.
			if (err) return res.jsonp(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.jsonp(404, { error: { message: 'Rooms table is empty.', code: 404 } });
			// Loop through all the labs.
			async.each(results, function (lab, callback) {
				// Run a MySQL query to get the labs for the building.
				mysql.query('SELECT `name`, `reference` FROM `buildings` WHERE `id` = :building_id', { building_id: lab.building_id }, function (err, buildings) {
					// Append the building to the lab object.
					lab.building = buildings[0];
					// Delete the lab building id.
					delete lab.building_id;
					// Call the callback function to continue.
					callback();
				});
			// Execute a function after the results loop has finished.
			}, function () {
				// Return all labs in JSON format.
				return res.jsonp(results);
			});
		});
	});

	// Route to get the opening times of a specific building.
	app.get(config.api.folder + '/v1/buildings/:reference/openingtimes', isAuthorized, function (req, res) {
		// Run a MySQL query to get the opening times of all buildings.
		mysql.query('SELECT `openingtimes`.* FROM `oathkeeper`.`openingtimes` INNER JOIN `buildings` ON `buildings`.`id` = `openingtimes`.`building_id` AND `buildings`.`reference` = :reference', { reference: req.params.reference }, function (err, results) {
			// Return appropriate error messages if something went wrong.
			if (err) return res.jsonp(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.jsonp(404, { error: { message: 'Opening times are not available for this building.', code: 404 } });
			// Loop through all the opening times.
			async.each(results, function (openingtimes, callback) {
				// Delete the id.
				delete openingtimes.id;
				// Run a MySQL query for getting the room details.
				mysql.query('SELECT `room_number`, `short_identifier` FROM `rooms` WHERE `id` = :room_id', { room_id: openingtimes.room_id }, function (err, rooms) {
					// Delete the building and room ids.
					delete openingtimes.building_id;
					delete openingtimes.room_id;
					// Append the room data to the opening times object.
					openingtimes.room = rooms ? rooms[0] : {};
					// Call the callback function to continue.
					callback();
				});
			// Execute a function after the results loop has finished.
			}, function () {
				// Return the buildings and its opening times in JSON format.
				return res.jsonp(results);
			});
		});
	});

	// Route to get the opening times of all buildings.
	app.get(config.api.folder + '/v1/buildings/openingtimes', isAuthorized, function (req, res) {
		var data;
		// Run a MySQL query to get the opening times of all buildings.
		mysql.query('SELECT * FROM `oathkeeper`.`openingtimes`', function (err, results) {
			// Return appropriate error messages if something went wrong.
			if (err) return res.jsonp(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.jsonp(404, { error: { message: 'Opening times table is empty.', code: 404 } });
			// Loop through all the opening times.
			async.each(results, function (openingtimes, callback) {
				// Delete the id.
				delete openingtimes.id;
				// Run a MySQL query for getting the building details.
				mysql.query('SELECT `name`, `reference` FROM `buildings` WHERE `id` = :building_id', { building_id: openingtimes.building_id }, function (err, buildings) {
					// Append the building data to the opening times object.
					openingtimes.building = buildings[0];
					// Run a MySQL query for getting the room details.
					mysql.query('SELECT `room_number`, `short_identifier` FROM `rooms` WHERE `id` = :room_id', { room_id: openingtimes.room_id }, function (err, rooms) {
						// Delete the building and room ids.
						delete openingtimes.building_id;
						delete openingtimes.room_id;
						// Append the room data to the opening times object.
						openingtimes.room = rooms ? rooms[0] : {};
						// Call the callback function to continue.
						callback();
					});
				});
			// Execute a function after the results loop has finished.
			}, function () {
				// Return all buildings and their opening times in JSON format.
				return res.jsonp(results);
			});
		});
	});

	// Route to get open access area availability for all buildings.
	app.get(config.api.folder + '/v1/buildings/:reference?/openaccess', isAuthorized, function (req, res) {
		// Run a series of functions in order.
		async.series([
			// Run a function for checking if a building reference was defined.
			function (callback) {
				// Check if a building reference was not defined.
				if (!req.params.reference) return callback();
				// Run a MySQL query for getting the building data of the referenced building.
				mysql.query('SELECT * FROM `buildings` WHERE `reference` = :reference', { reference: req.params.reference }, function (err, results) {
					// Return the building id as part of the callback to the next function.
					callback(null, 'WHERE `buildings`.`id` = ' + results[0].id);
				});
			}
		// Runs a function that gets the open access area availability for the specified building (if any) or all buildings.
		], function (err, where) {
			// Run a MySQL query to get all the buildings that have open access areas.
			mysql.query('SELECT `buildings`.`id`, `buildings`.`name`, `buildings`.`reference` FROM `buildings` INNER JOIN `openaccess` ON `buildings`.`id` = `openaccess`.`building_id` ' + where + ' GROUP BY `buildings`.`id`', function (err, results) {
				// Return appropriate error messages if something went wrong.
				if (err) return res.jsonp(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
				if (!results || !results.length) return res.jsonp(404, { error: { message: 'Building does not contain an open access area.', code: 404 } });
				// Set an empty array for the data to be returned and sets the current date and time.
				var data = [], d = new Date(), today = d.getDay() - 1, time = d.toLocaleTimeString(), days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
				// Run a series of functions for each building returned.
				async.each(results, function (building, callback) {
					// Set the opening status, total number and in use number of computers in the building.
					var open = false, total = 0, in_use = 0;
					// Run a MySQL query for getting the opening and closing times for today for the building.
					mysql.query('SELECT * FROM `openingtimes` WHERE `building_id` = ' + building.id + ' AND `day_of_the_week` = "' + days[today] + '"', function (err, openingtimes) {
						// Set the opening status to true if the current time is within the opening times.
						open = (time > openingtimes[0].opening_time && time < openingtimes[0].closing_time) ? true : false;
					});
					// Run a MySQL query for getting the open access areas for the building.
					mysql.query('SELECT * FROM `openaccess` WHERE `building_id` = ' + building.id, function (err, openaccess) {
						// Delete the building id.
						delete building.id;
						// Run a series of functions for each open access area in the building.
						async.each(openaccess, function (openacc, callback) {
							// Run a series of functions in parallel for each open access area.
							async.parallel([
								// Run a function for getting the total number of computers in the area.
								function (callback) {
									// Create a new MSSQL query request.
									var labstats = new mssql.Request();
									// Run an MSSQL query to get the total number of computers in the open access area.
									labstats.query('SELECT COUNT(*) AS count FROM LabStats.dbo.CLS_CLIENT WHERE STATIONID IN (SELECT STATIONID FROM LabStats.dbo.CLS_STATION_GROUP WHERE GROUPID = ' + openacc.groupid + ' AND ENDDATE IS NULL)', function (err, labstats) {
										// Add the open access area computer count to the building total.
										total += labstats[0].count;
										// Call the callback function to continue.
										callback();
									});
								},
								// Run a function for getting the number of in-use computers in the area.
								function (callback) {
									// Create a new MSSQL query request.
									var labstats = new mssql.Request();
									// Run an MSSQL query to get the number of in-use computers in the open access area.
									labstats.query("SELECT COUNT(*) AS count FROM LabStats.dbo.CLS_CLIENT WHERE CURRENTUSER <> '' AND STATIONID IN (SELECT STATIONID FROM LabStats.dbo.CLS_STATION_GROUP WHERE GROUPID = " + openacc.groupid + " AND ENDDATE IS NULL)", function (err, labstats) {
										// Add the open access area computer count to the building total.
										in_use += labstats[0].count;
										// Call the callback function to continue.
										callback();
									});
								}
							// Run a function after the parallely functions have finished running.
							], function () {
								// Call the callback function to continue to the next open access area.
								callback();
							});
						// Run a function after the functions for each open access area have finished running.
						}, function () {
							// Push the building object with its open access area availability data.
							data.push({
								'open': open,
								'in_use': in_use,
								'total': total,
								'building': building
							});
							// Call the callback function to continue to the next building.
							callback();
						});
					});
				// Run a function after all previous functions have finished executing.
				}, function () {
					// Check if a building reference was passed.
					if (req.params.reference) {
						// Use the first record in the array.
						data = data[0];
						// Delete the building data.
						delete data.building;
					}
					// Return the open access area availability data.
					return res.jsonp(data);
				});
			});
		});
	});

	// Route to get a specific building.
	app.get(config.api.folder + '/v1/buildings/:reference', isAuthorized, function (req, res) {
		// Run a MySQL query to get a specific building.
		mysql.query('SELECT `name`, `reference`, `latitude`, `longitude` FROM `buildings` WHERE `reference` = :reference', { reference: req.params.reference }, function (err, results) {
			// Return appropriate error messages if something went wrong.
			if (err) return res.jsonp(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.jsonp(404, { error: { message: 'Invalid building reference.', code: 404 } });
			// Return a specific building in JSON format.
			return res.jsonp(results[0]);
		});
	});

	// Route to get all buildings.
	app.get(config.api.folder + '/v1/buildings', isAuthorized, function (req, res) {
		// Run a MySQL query to get all buildings.
		mysql.query('SELECT `name`, `reference`, `latitude`, `longitude` FROM `buildings`', function (err, results) {
			// Return appropriate error messages if something went wrong.
			if (err) return res.jsonp(500, { error: { message: 'Something went wrong.', code: 500, details: err } });
			if (!results || !results.length) return res.jsonp(404, { error: { message: 'Buildings table is empty.', code: 404 } });
			// Return all buildings in JSON format.
			return res.jsonp(results);
		});
	});

	// Set up error handling.
	app.get(config.api.folder + '/v1/*', function (req, res) {
		return res.jsonp({ error: { message: "Specified route does not exist.", code: 404 }});
	});

	// Middleware to check if the user has provided a valid API key.
	function isAuthorized(req, res, next) {
		// Use passport to authenticate with localapikey.
		passport.authenticate('localapikey', function (err, user, info) {
			if (err) return next(err);
			// Return an appropriate error message to the user.
			if (!user) return res.jsonp(401, { error: { name: info.error, message: info.message, code: 401 } });
			// Attempt to authenticate the user.
			req.logIn(user, function (err) {
				if (err) return next(err);
				return next();
			});
		})(req, res, next);
	}
};