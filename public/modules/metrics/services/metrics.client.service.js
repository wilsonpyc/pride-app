'use strict';

//Customers service used to communicate Customers REST endpoints
angular.module('metrics')
	.factory('Metrics', ['$resource',
	function($resource) {
		return $resource('metrics/:metricId', { metricId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
		}
	]);
