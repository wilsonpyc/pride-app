'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var metrics = require('../../app/controllers/metrics.server.controller');

	// Metrics Routes
	app.route('/metrics')
		.get(users.requiresLogin, metrics.list)
		.post(users.requiresLogin, metrics.create);

	app.route('/metrics/:id')
		.get(metrics.read)
		.put(metrics.update) //users.requiresLogin, metrics.hasAuthorization,
		.delete(metrics.delete); //users.requiresLogin, metrics.hasAuthorization,

	app.route('/metrics/query')
		.get(metrics.list)
		.post(metrics.query);

	app.route('/report')
		.post(users.requiresLogin, metrics.getReport);

	app.route('/report/count')
		.post(metrics.getCount);

	app.route('/report/drilldown')
		.put(metrics.drilldown);

	// Finish by binding the Metric middleware
	app.param('metricId', metrics.metricByID);
};
