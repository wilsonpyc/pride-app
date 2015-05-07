'use strict';

// Setting up route
angular.module('metrics').config(['$stateProvider',
	function($stateProvider) {
		// Home state routing
		$stateProvider
			.state('viewMetrics', {
				url: '/metrics',
				templateUrl: 'modules/metrics/views/view-metrics.client.view.html'
			})
			.state('viewReports', {
				url: '/metrics/report',
				templateUrl: 'modules/metrics/views/view-reports.client.view.html'
			});
	}
]);
