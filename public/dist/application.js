'use strict';

// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function() {
	// Init module configuration options
	var applicationModuleName = 'pride-app';
	var applicationModuleVendorDependencies = ['ngResource', 'ngCookies',  'ngAnimate',  'ngTouch',  'ngSanitize',  'ui.router', 'ui.bootstrap', 'ui.utils'];

	// Add a new vertical module
	var registerModule = function(moduleName, dependencies) {
		// Create angular module
		angular.module(moduleName, dependencies || []);

		// Add the module to the AngularJS configuration file
		angular.module(applicationModuleName).requires.push(moduleName);
	};

	return {
		applicationModuleName: applicationModuleName,
		applicationModuleVendorDependencies: applicationModuleVendorDependencies,
		registerModule: registerModule
	};
})();
'use strict';

//Start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);

// Setting HTML5 Location Mode
angular.module(ApplicationConfiguration.applicationModuleName).config(['$locationProvider',
	function($locationProvider) {
		$locationProvider.hashPrefix('!');
	}
]);

//Then define the init function for starting up the application
angular.element(document).ready(function() {
	//Fixing facebook bug with redirect
	if (window.location.hash === '#_=_') window.location.hash = '#!';

	//Then init the app
	angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});
'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('articles');
'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('core');
'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('metrics');

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('users');
'use strict';

// Configuring the Articles module
angular.module('articles').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Articles', 'articles', 'dropdown', '/articles(/create)?');
		Menus.addSubMenuItem('topbar', 'articles', 'List Articles', 'articles');
		Menus.addSubMenuItem('topbar', 'articles', 'New Article', 'articles/create');
	}
]);
'use strict';

// Setting up route
angular.module('articles').config(['$stateProvider',
	function($stateProvider) {
		// Articles state routing
		$stateProvider.
		state('listArticles', {
			url: '/articles',
			templateUrl: 'modules/articles/views/list-articles.client.view.html'
		}).
		state('createArticle', {
			url: '/articles/create',
			templateUrl: 'modules/articles/views/create-article.client.view.html'
		}).
		state('viewArticle', {
			url: '/articles/:articleId',
			templateUrl: 'modules/articles/views/view-article.client.view.html'
		}).
		state('editArticle', {
			url: '/articles/:articleId/edit',
			templateUrl: 'modules/articles/views/edit-article.client.view.html'
		});
	}
]);
'use strict';

angular.module('articles').controller('ArticlesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Articles',
	function($scope, $stateParams, $location, Authentication, Articles) {
		$scope.authentication = Authentication;

		$scope.create = function() {
			var article = new Articles({
				title: this.title,
				content: this.content
			});
			article.$save(function(response) {
				$location.path('articles/' + response._id);

				$scope.title = '';
				$scope.content = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		$scope.remove = function(article) {
			if (article) {
				article.$remove();

				for (var i in $scope.articles) {
					if ($scope.articles[i] === article) {
						$scope.articles.splice(i, 1);
					}
				}
			} else {
				$scope.article.$remove(function() {
					$location.path('articles');
				});
			}
		};

		$scope.update = function() {
			var article = $scope.article;

			article.$update(function() {
				$location.path('articles/' + article._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		$scope.find = function() {
			$scope.articles = Articles.query();
		};

		$scope.findOne = function() {
			$scope.article = Articles.get({
				articleId: $stateParams.articleId
			});
		};
	}
]);
'use strict';

//Articles service used for communicating with the articles REST endpoints
angular.module('articles').factory('Articles', ['$resource',
	function($resource) {
		return $resource('articles/:articleId', {
			articleId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
'use strict';

// Setting up route
angular.module('core').config(['$stateProvider', '$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {
		// Redirect to home view when route not found
		$urlRouterProvider.otherwise('/');

		// Home state routing
		$stateProvider.
		state('home', {
			url: '/',
			templateUrl: 'modules/core/views/home.client.view.html'
		});
	}
]);
'use strict';

angular.module('core').controller('HeaderController', ['$scope', 'Authentication', 'Menus',
	function($scope, Authentication, Menus) {
		$scope.authentication = Authentication;
		$scope.isCollapsed = false;
		$scope.menu = Menus.getMenu('topbar');

		$scope.toggleCollapsibleMenu = function() {
			$scope.isCollapsed = !$scope.isCollapsed;
		};

		// Collapsing the menu after navigation
		$scope.$on('$stateChangeSuccess', function() {
			$scope.isCollapsed = false;
		});
	}
]);
'use strict';


angular.module('core').controller('HomeController', ['$scope', 'Authentication',
	function($scope, Authentication) {
		// This provides Authentication context.
		$scope.authentication = Authentication;
	}
]);
'use strict';

//Menu service used for managing  menus
angular.module('core').service('Menus', [

	function() {
		// Define a set of default roles
		this.defaultRoles = ['*'];

		// Define the menus object
		this.menus = {};

		// A private function for rendering decision 
		var shouldRender = function(user) {
			if (user) {
				if (!!~this.roles.indexOf('*')) {
					return true;
				} else {
					for (var userRoleIndex in user.roles) {
						for (var roleIndex in this.roles) {
							if (this.roles[roleIndex] === user.roles[userRoleIndex]) {
								return true;
							}
						}
					}
				}
			} else {
				return this.isPublic;
			}

			return false;
		};

		// Validate menu existance
		this.validateMenuExistance = function(menuId) {
			if (menuId && menuId.length) {
				if (this.menus[menuId]) {
					return true;
				} else {
					throw new Error('Menu does not exists');
				}
			} else {
				throw new Error('MenuId was not provided');
			}

			return false;
		};

		// Get the menu object by menu id
		this.getMenu = function(menuId) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Return the menu object
			return this.menus[menuId];
		};

		// Add new menu object by menu id
		this.addMenu = function(menuId, isPublic, roles) {
			// Create the new menu
			this.menus[menuId] = {
				isPublic: isPublic || false,
				roles: roles || this.defaultRoles,
				items: [],
				shouldRender: shouldRender
			};

			// Return the menu object
			return this.menus[menuId];
		};

		// Remove existing menu object by menu id
		this.removeMenu = function(menuId) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Return the menu object
			delete this.menus[menuId];
		};

		// Add menu item object
		this.addMenuItem = function(menuId, menuItemTitle, menuItemURL, menuItemType, menuItemUIRoute, isPublic, roles, position) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Push new menu item
			this.menus[menuId].items.push({
				title: menuItemTitle,
				link: menuItemURL,
				menuItemType: menuItemType || 'item',
				menuItemClass: menuItemType,
				uiRoute: menuItemUIRoute || ('/' + menuItemURL),
				isPublic: ((isPublic === null || typeof isPublic === 'undefined') ? this.menus[menuId].isPublic : isPublic),
				roles: ((roles === null || typeof roles === 'undefined') ? this.menus[menuId].roles : roles),
				position: position || 0,
				items: [],
				shouldRender: shouldRender
			});

			// Return the menu object
			return this.menus[menuId];
		};

		// Add submenu item object
		this.addSubMenuItem = function(menuId, rootMenuItemURL, menuItemTitle, menuItemURL, menuItemUIRoute, isPublic, roles, position) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Search for menu item
			for (var itemIndex in this.menus[menuId].items) {
				if (this.menus[menuId].items[itemIndex].link === rootMenuItemURL) {
					// Push new submenu item
					this.menus[menuId].items[itemIndex].items.push({
						title: menuItemTitle,
						link: menuItemURL,
						uiRoute: menuItemUIRoute || ('/' + menuItemURL),
						isPublic: ((isPublic === null || typeof isPublic === 'undefined') ? this.menus[menuId].items[itemIndex].isPublic : isPublic),
						roles: ((roles === null || typeof roles === 'undefined') ? this.menus[menuId].items[itemIndex].roles : roles),
						position: position || 0,
						shouldRender: shouldRender
					});
				}
			}

			// Return the menu object
			return this.menus[menuId];
		};

		// Remove existing menu object by menu id
		this.removeMenuItem = function(menuId, menuItemURL) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Search for menu item to remove
			for (var itemIndex in this.menus[menuId].items) {
				if (this.menus[menuId].items[itemIndex].link === menuItemURL) {
					this.menus[menuId].items.splice(itemIndex, 1);
				}
			}

			// Return the menu object
			return this.menus[menuId];
		};

		// Remove existing menu object by menu id
		this.removeSubMenuItem = function(menuId, submenuItemURL) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Search for menu item to remove
			for (var itemIndex in this.menus[menuId].items) {
				for (var subitemIndex in this.menus[menuId].items[itemIndex].items) {
					if (this.menus[menuId].items[itemIndex].items[subitemIndex].link === submenuItemURL) {
						this.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
					}
				}
			}

			// Return the menu object
			return this.menus[menuId];
		};

		//Adding the topbar menu
		this.addMenu('topbar');
	}
]);
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

'use strict';

//Metrics Controller

var metricsApp = angular.module('metrics');

metricsApp.controller('MetricsController', ['$scope', '$modal', '$log', '$http', '$location',
	function($scope, $modal, $log, $http, $location) {

		var loadAndRefresh = function(){
			// Find a list of Metrics
			$http.get('/metrics').success(function(response){
				$scope.metrics = response;
				$scope.metric = '';
				console.log('Data Loaded/Refreshed');
			});
		};

		loadAndRefresh();

		//Open a modal window for filtering the metrics
		this.modalFilter = function (size) {

			var modalInstance = $modal.open({
				templateUrl: 'modules/metrics/views/filter-metrics.view.html',
				controller: 'MetricsFilterController',
				size: size
			});

			modalInstance.result.then(function (filteredMetrics) {
				$scope.metrics = filteredMetrics;
			}, function () {
				$log.info('Modal dismissed at: ' + new Date());
			});
		};

		//Open a modal window for inserting a record
		this.modalInsert = function (size) {

			var modalInstance = $modal.open({
				templateUrl: 'modules/metrics/views/insert-metrics.view.html',
				controller: ["$scope", "$modalInstance", function ($scope, $modalInstance) {

					$scope.addMetric = function () {
						console.log('1 record has been added.');
						$modalInstance.close();
						loadAndRefresh();
				};

					$scope.cancel = function () {
						$modalInstance.dismiss('cancel');
					};
				}],
				size: size
			});

			modalInstance.result.then(function (selectedItem) {
			}, function () {
				$log.info('Modal dismissed at: ' + new Date());
			});
		};

		//Open a modal window for editing a record
		this.modalUpdate = function (size, id) {
			var modalInstance = $modal.open({
				templateUrl: 'modules/metrics/views/update-metrics.view.html',
				controller: ["$scope", "$modalInstance", function ($scope, $modalInstance) {

					//Read selected Record
					var readRecord = function(){
						//Read the selected record
						$http.get('/metrics/' + id).success(function(response){
							$scope.metric = response;
						});
					};

					readRecord();

					$scope.updateMetric = function () {

						//Update a record
						$http.put('/metrics/' + $scope.metric._id, $scope.metric).success(function(response){
							//Response = updated object sent by the server callback function
							console.log(response);
							console.log('Record has been updated.');
						});

						$modalInstance.close();
						loadAndRefresh();
				};

					$scope.cancel = function () {
						$modalInstance.dismiss('cancel');
					};
				}],
				size: size
			});

			modalInstance.result.then(function (selectedItem) {
			}, function () {
				$log.info('Modal dismissed at: ' + new Date());
			});
		};

		//Remove a record
		this.delete = function(id){
			console.log(id);

			$http.delete('/metrics/' + id).success(function(response){
				loadAndRefresh();
			});

		};

	}
]);

metricsApp.controller('MetricsFilterController', ['$scope', '$http', '$modalInstance',
	function($scope,$http,$modalInstance) {

		$scope.selected = {}; //Object to hold the selected parameters

		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};

		$scope.applyFilter = function(){
			$http.post('/metrics/query', $scope.selected).success(function(response){
				//Passing the response from server to the main scope
				$modalInstance.close(response);
			});
		};

	}
]);

metricsApp.controller('MetricsCreateController', ['$http',
	function($http) {

		this.create = function(){
			//create a new object to hold the scope data
			var metric = {
				ffc: this.ffc,
				factoryname: this.factoryname,
				coalition: this.coalition,
				supplychain: this.supplychain,
				brand: this.brand,
				year: this.year,
				month: this.month,
				metrics: {
					factory: {
						majorDefectsOql: { audited: this.factory_majorDefectsOql_audited, defects: this.factory_majorDefectsOql_defects },
						packagingOql: { audited: this.factory_packagingOql_audited, defects: this.factory_packagingOql_defects },
						fitOql: { audited: this.factory_fitOql_audited, defects: this.factory_fitOql_defects },
						majorDefectsSql: { audited: this.factory_majorDefectsSql_audited, defects: this.factory_majorDefectsSql_defects },
						firstPass: { audited: this.factory_firstPass_audited, passed: this.factory_firstPass_passed },
						processAudit: { score: this.factory_processAudit_score, date: this.factory_processAudit_date }
					},
					dc: {
						majorDefectsOql: { audited: this.dc_majorDefectsOql_audited, defects: this.dc_majorDefectsOql_defects },
						packagingOql: { audited: this.dc_packagingOql_audited, defects: this.dc_packagingOql_defects },
						fitOql: { audited: this.dc_fitOql_audited, defects: this.dc_fitOql_defects },
						customization: { audited: this.dc_customization_audited, defects: this.dc_customization_defects },
						rework: { total: this.dc_rework_total, vendorChargeback: this.dc_rework_vendorChargeback},
						internalChargebacks: this.dc_internalChargebacks,
						vasCompliance: this.dc_vasCompliance,
						warrantyClaims: this.dc_warrantyClaims,
						claims: { received: this.dc_claims_received, returned: this.dc_claims_returned },
						keyAccountsChargebacks: this.dc_keyAccountsChargebacks
					}
				}
			};

			$http.post('/metrics', metric).success(function(response){
				console.log(response);
			});
		};

	}
]);

metricsApp.controller('MetricsUpdateController', ['$http','$scope',
	function($http, $scope){
		//Do Something...
	}
]);

metricsApp.controller('MetricsReportController', ['$http','$scope', '$q', '$modal', '$log',
	function($http, $scope, $q, $modal, $log){

		var s = function(selected){ return $http.post('/report', selected); };
		var c =	function(selected){ return $http.post('/report/count', selected); };

		$scope.dataset = [];
		$scope.selected = {};

		$scope.getReport = function(selected){

			//Combining summary data with count data
			$q.all([s(selected), c(selected)]).then(function(datasets){

				var combineData = function(a,b){
					var aDataset = [];
					var bDataset = [];

					for (var i = 0; i < a.length; i++){
						var aData = {
							key: a[i].year + a[i].month + a[i].coalition + a[i].supplychain,
							year: a[i].year,
							month: a[i].month,
							coalition: a[i].coalition,
							supplychain: a[i].supplychain,
							majorDefectsOqlRate: { value: a[i].majorDefectsOqlRate},
							packagingOqlRate: { value: a[i].packagingOqlRate},
							fitOqlRate: { value: a[i].fitOqlRate},
							dcMajorDefectsOqlRate: { value: a[i].dcMajorDefectsOqlRate},
							dcPackagingOqlRate: { value: a[i].dcPackagingOqlRate},
							dcFitOqlRate: { value: a[i].dcFitOqlRate},
							majorDefectsSqlRate: { value: a[i].majorDefectsSqlRate},
							firstPassRate: { value: a[i].firstPassRate},
							processAuditScore: { value: a[i].processAuditScore},
							dcCustomizationRate: { value: a[i].dcCustomizationRate},
							dcClaimsRate: { value: a[i].dcClaimsRate},
							dcReworkTotal: { value: a[i].dcReworkTotal},
							dcInternalChargebacks: { value: a[i].dcInternalChargebacks},
							dcWarrantyClaims: { value: a[i].dcWarrantyClaims},
							dcVasCompliance: { value: a[i].dcVasCompliance},
							dcKeyAccountsChargebacks: { value: a[i].dcKeyAccountsChargebacks}
						};
						aDataset.push(aData);
						aData = {};
					}

					for (i = 0; i < b.length; i++) {
						var bData = {
							key: b[i].year + b[i].month + b[i].coalition + b[i].supplychain,
							majorDefectsOqlRate_countNotGood: b[i].majorDefectsOqlRate_countNotGood,
							packagingOqlRate_countNotGood: b[i].packagingOqlRate_countNotGood,
							fitOqlRate_countNotGood: b[i].fitOqlRate_countNotGood,
							dcMajorDefectsOqlRate_countNotGood: b[i].dcMajorDefectsOqlRate_countNotGood,
							dcPackagingOqlRate_countNotGood: b[i].dcPackagingOqlRate_countNotGood,
							dcFitOqlRate_countNotGood: b[i].dcFitOqlRate_countNotGood,
							majorDefectsSqlRate_countNotGood: b[i].majorDefectsSqlRate_countNotGood,
							firstPassRate_countNotGood: b[i].firstPassRate_countNotGood,
							processAuditScore_countNotGood: b[i].processAuditScore_countNotGood,
							dcCustomizationRate_countNotGood: b[i].dcCustomizationRate_countNotGood,
							dcClaimsRate_countNotGood: b[i].dcClaimsRate_countNotGood,
							dcReworkTotal_countNotGood: b[i].dcReworkTotal_countNotGood,
							dcInternalChargebacks_countNotGood: b[i].dcInternalChargebacks_countNotGood,
							dcWarrantyClaims_countNotGood: b[i].dcWarrantyClaims_countNotGood,
							dcVasCompliance_countNotGood: b[i].dcVasCompliance_countNotGood,
							dcKeyAccountsChargebacks_countNotGood: b[i].dcKeyAccountsChargebacks_countNotGood,
							majorDefectsOqlRate_countRisk: b[i].majorDefectsOqlRate_countRisk,
							packagingOqlRate_countRisk: b[i].packagingOqlRate_countRisk,
							fitOqlRate_countRisk: b[i].fitOqlRate_countRisk,
							dcMajorDefectsOqlRate_countRisk: b[i].dcMajorDefectsOqlRate_countRisk,
							dcPackagingOqlRate_countRisk: b[i].dcPackagingOqlRate_countRisk,
							dcFitOqlRate_countRisk: b[i].dcFitOqlRate_countRisk,
							majorDefectsSqlRate_countRisk: b[i].majorDefectsSqlRate_countRisk,
							firstPassRate_countRisk: b[i].firstPassRate_countRisk,
							processAuditScore_countRisk: b[i].processAuditScore_countRisk,
							dcCustomizationRate_countRisk: b[i].dcCustomizationRate_countRisk,
							dcClaimsRate_countRisk: b[i].dcClaimsRate_countRisk,
							dcReworkTotal_countRisk: b[i].dcReworkTotal_countRisk,
							dcInternalChargebacks_countRisk: b[i].dcInternalChargebacks_countRisk,
							dcWarrantyClaims_countRisk: b[i].dcWarrantyClaims_countRisk,
							dcVasCompliance_countRisk: b[i].dcVasCompliance_countRisk,
							dcKeyAccountsChargebacks_countRisk: b[i].dcKeyAccountsChargebacks_countRisk,
						};
						bDataset.push(bData);
						bData = {};
					}

					for (i = 0; i < aDataset.length; i++){
						for (var k = 0; k < bDataset.length; k++){
							if (aDataset[i].key === bDataset[k].key){
								aDataset[i].majorDefectsOqlRate.countNotGood = bDataset[k].majorDefectsOqlRate_countNotGood;
								aDataset[i].packagingOqlRate.countNotGood = bDataset[k].packagingOqlRate_countNotGood;
								aDataset[i].fitOqlRate.countNotGood = bDataset[k].fitOqlRate_countNotGood;
								aDataset[i].dcMajorDefectsOqlRate.countNotGood = bDataset[k].dcMajorDefectsOqlRate_countNotGood;
								aDataset[i].dcPackagingOqlRate.countNotGood = bDataset[k].dcPackagingOqlRate_countNotGood;
								aDataset[i].dcFitOqlRate.countNotGood = bDataset[k].dcFitOqlRate_countNotGood;
								aDataset[i].majorDefectsSqlRate.countNotGood = bDataset[k].majorDefectsSqlRate_countNotGood;
								aDataset[i].firstPassRate.countNotGood = bDataset[k].firstPassRate_countNotGood;
								aDataset[i].processAuditScore.countNotGood = bDataset[k].processAuditScore_countNotGood;
								aDataset[i].dcCustomizationRate.countNotGood = bDataset[k].dcCustomizationRate_countNotGood;
								aDataset[i].dcClaimsRate.countNotGood = bDataset[k].dcClaimsRate_countNotGood;
								aDataset[i].dcReworkTotal.countNotGood = bDataset[k].dcReworkTotal_countNotGood;
								aDataset[i].dcInternalChargebacks.countNotGood = bDataset[k].dcInternalChargebacks_countNotGood;
								aDataset[i].dcWarrantyClaims.countNotGood = bDataset[k].dcWarrantyClaims_countNotGood;
								aDataset[i].dcVasCompliance.countNotGood = bDataset[k].dcVasCompliance_countNotGood;
								aDataset[i].dcKeyAccountsChargebacks.countNotGood = bDataset[k].dcKeyAccountsChargebacks_countNotGood;
								aDataset[i].majorDefectsOqlRate.countRisk = bDataset[k].majorDefectsOqlRate_countRisk;
								aDataset[i].packagingOqlRate.countRisk = bDataset[k].packagingOqlRate_countRisk;
								aDataset[i].fitOqlRate.countRisk = bDataset[k].fitOqlRate_countRisk;
								aDataset[i].dcMajorDefectsOqlRate.countRisk = bDataset[k].dcMajorDefectsOqlRate_countRisk;
								aDataset[i].dcPackagingOqlRate.countRisk = bDataset[k].dcPackagingOqlRate_countRisk;
								aDataset[i].dcFitOqlRate.countRisk = bDataset[k].dcFitOqlRate_countRisk;
								aDataset[i].majorDefectsSqlRate.countRisk = bDataset[k].majorDefectsSqlRate_countRisk;
								aDataset[i].firstPassRate.countRisk = bDataset[k].firstPassRate_countRisk;
								aDataset[i].processAuditScore.countRisk = bDataset[k].processAuditScore_countRisk;
								aDataset[i].dcCustomizationRate.countRisk = bDataset[k].dcCustomizationRate_countRisk;
								aDataset[i].dcClaimsRate.countRisk = bDataset[k].dcClaimsRate_countRisk;
								aDataset[i].dcReworkTotal.countRisk = bDataset[k].dcReworkTotal_countRisk;
								aDataset[i].dcInternalChargebacks.countRisk = bDataset[k].dcInternalChargebacks_countRisk;
								aDataset[i].dcWarrantyClaims.countRisk = bDataset[k].dcWarrantyClaims_countRisk;
								aDataset[i].dcVasCompliance.countRisk = bDataset[k].dcVasCompliance_countRisk;
								aDataset[i].dcKeyAccountsChargebacks.countRisk = bDataset[k].dcKeyAccountsChargebacks_countRisk;

								delete aDataset[i].key;
							}
						}
					}

					$scope.dataset = aDataset;
					console.log($scope.dataset);
				};

				var setSupplyChainOrder = function(d){

					for (var i = 0; i < d.length; i++){

						var coalition = d[i].coalition;
						var supplyChain = d[i].supplychain;

						switch(coalition){
								case 'Jeanswear':
									d[i].coalitionOrder = 1;
									switch(supplyChain){
										case 'VFA':
											d[i].supplyChainOrder = 1;
										break;
										case 'WJ':
											d[i].supplyChainOrder = 2;
										break;
										case 'Int Mfg-America':
											d[i].supplyChainOrder = 3;
										break;
										case 'Int Mfg-EU':
											d[i].supplyChainOrder = 4;
										break;
										case 'EU-Sourced':
											d[i].supplyChainOrder = 5;
										break;
									}
								break;
								case 'Imagewear':
									d[i].coalitionOrder = 2;
									switch(supplyChain){
										case 'VFA':
											d[i].supplyChainOrder = 1;
										break;
										case 'VFSLA':
											d[i].supplyChainOrder = 2;
										break;
										case 'Domestic Contract':
											d[i].supplyChainOrder = 3;
										break;
										case 'Int Mfg-America':
											d[i].supplyChainOrder = 4;
										break;
									}
								break;
								case 'Outdoor':
									d[i].coalitionOrder = 3;
									switch(supplyChain){
										case 'VFA':
											d[i].supplyChainOrder = 1;
										break;
										case 'VFSLA':
											d[i].supplyChainOrder = 2;
										break;
										case 'Int Mfg-America':
											d[i].supplyChainOrder = 3;
										break;
										case 'EU':
											d[i].supplyChainOrder = 4;
										break;
									}
								break;
								case 'Footwear':
									d[i].coalitionOrder = 4;
									switch(supplyChain){
										case 'VFA':
											d[i].supplyChainOrder = 1;
										break;
										case 'Int Mfg-DR':
											d[i].supplyChainOrder = 2;
										break;
										case 'Sourced-DR':
											d[i].supplyChainOrder = 3;
										break;
									}
								break;
								case 'Sportswear':
									d[i].coalitionOrder = 5;
									switch(supplyChain){
										case 'VFA':
											d[i].supplyChainOrder = 1;
										break;
										case 'VFSLA':
											d[i].supplyChainOrder = 2;
										break;
										case 'EU':
											d[i].supplyChainOrder = 3;
										break;
									}
								break;
								case 'Contemporary':
									d[i].coalitionOrder = 6;
									switch(supplyChain){
										case 'Int Mfg-US Domestic':
											d[i].supplyChainOrder = 1;
										break;
										case 'Sourced':
											d[i].supplyChainOrder = 2;
										break;
									}
								break;
						}
					}

				};

				combineData(datasets[0].data, datasets[1].data);
				setSupplyChainOrder($scope.dataset);
			});

		};

		$http.post('/report', $scope.selected).success(function(res){
			console.log('OK');
		});

		$scope.headers = {
			a: [
				'Major Visual Defects (FTY-OQL) %',
				'Labl & Pkg Defects (FTY-OQL) %',
				'FIT (FTY-OQL) %',
				'Major Visual Defects (DC) %',
				'Labl & Pkg Defects (DC) %',
				'FIT (DC) %',
				'Customization (DC) %' ],
			b: [
				'Major Visual Defects (FTY-SQL) %',
				'First Pass @ Plant (FTY) %',
				'Process Audits (FTY) %'
			],
			c: [
				'Rework, Direct Cost Claims @ DC($)',
				'Internal Chargebacks (DC) ($)'
			],
			d: [
				'Addn Labl & Pkg (VAS) Compliance (DC)',
				'Warranty Claims (DC) ($)',
				'Claims (as % of Volume) (DC) %',
				'Chargebacks ($) - Key Accounts (DC)'
			]
		};

		$scope.getHeader = function(header){
			switch (header){
				case 'a':
					return 'Product Quality';
				case 'b':
					return 'IPC';
				case 'c':
					return 'Financial Impact';
				case 'd':
					return 'Customer Satisfaction';
			}
		};

		$scope.format = {
			percentage: function(data){
				if(data === 'NA'){
					return '';
				} else {
					return (data*100).toFixed(2) + '%';
				}
			},
			currency: function(data){
				var numberWithCommas = function (x) {
					return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
				};
				if(data === 'NA'){
					return '';
				} else {
					return '$' + numberWithCommas(Math.round(data));
				}
			},
			setColor: function(metricValue, countNotGood, countRisk, riskThreshold, goodThreshold, flip){
				if (flip) {
					if (metricValue === 'N/A'){
						return 'na';
					} else if (metricValue <= riskThreshold) {
						return 'btn-danger';
					} else if (metricValue >= goodThreshold) {
						if (countNotGood > 0) {
							return 'btn-success withRisk';
						} else {
							return 'btn-success';
						}
					} else {
						if (countRisk > 0) {
							return 'btn-warning withRisk';
						} else {
							return 'btn-warning';
						}
					}
				} else {
					if (metricValue === 'N/A'){
						return 'na';
					} else if (metricValue > riskThreshold) {
						return 'btn-danger';
					} else if (metricValue < goodThreshold) {
						if (countNotGood > 0) {
							return 'btn-success withRisk';
						} else {
							return 'btn-success';
						}
					} else {
						if (countRisk > 0) {
							return 'btn-warning withRisk';
						} else {
							return 'btn-warning';
						}
					}
				}
			},
			getIndicator: {
				majorDefectsOqlRate: function(data){
					//same for Oql, Sql, and DC
					var coalition = data.coalition;
					var metricValue = data.majorDefectsOqlRate.value;
					var countNotGood = data.majorDefectsOqlRate.countNotGood;
					var countRisk = data.majorDefectsOqlRate.countRisk;
					var riskThreshold = 0;
					var goodThreshold = 0;

					switch (coalition) {
						case 'Jeanswear':
							goodThreshold = 0.04;
							riskThreshold = 0.06;
							break;
						case 'Imagewear':
							goodThreshold = 0.03;
							riskThreshold = 0.05;
							break;
						case 'Outdoor':
							goodThreshold = 0.02;
							riskThreshold = 0.03;
							break;
						case 'Footwear':
							goodThreshold = 0.02;
							riskThreshold = 0.03;
							break;
						case 'Sportswear':
							goodThreshold = 0.03;
							riskThreshold = 0.06;
							break;
						case 'Contemporary':
							goodThreshold = 0.03;
							riskThreshold = 0.06;
							break;
						default:
							return;
					} //end of switch

				 	var color = $scope.format.setColor(metricValue, countNotGood, countRisk, riskThreshold, goodThreshold, false);
					return color;
				},
				packagingOqlRate: function(data){
					var coalition = data.coalition;
					var metricValue = data.packagingOqlRate.value;
					var countNotGood = data.packagingOqlRate.countNotGood;
					var countRisk = data.packagingOqlRate.countRisk;
					var goodThreshold = 0.005;
					var riskThreshold = 0.01;
				 	var color = $scope.format.setColor(metricValue, countNotGood, countRisk, riskThreshold, goodThreshold, false);
					return color;
				},
				fitOqlRate: function(data){
					var coalition = data.coalition;
					var metricValue = data.fitOqlRate.value;
					var countNotGood = data.fitOqlRate.countNotGood;
					var countRisk = data.fitOqlRate.countRisk;
					var goodThreshold = 0.01;
					var riskThreshold = 0.02;

					switch (coalition) {
						case 'Jeanswear':
							goodThreshold = 0.02;
							riskThreshold = 0.03;
							break;
						case 'JeanswearEU':
							goodThreshold = 0.05;
							riskThreshold = 0.07;
							break;
						default:
							goodThreshold = 0.01;
							riskThreshold = 0.02;
					} //end of switch

					var color = $scope.format.setColor(metricValue, countNotGood, countRisk, riskThreshold, goodThreshold, false);
					return color;
				},
				dcMajorDefectsOqlRate: function(data){
					//same for Oql, Sql, and DC
					var coalition = data.coalition;
					var metricValue = data.dcMajorDefectsOqlRate.value;
					var countNotGood = data.dcMajorDefectsOqlRate.countNotGood;
					var countRisk = data.dcMajorDefectsOqlRate.countRisk;
					var riskThreshold = 0;
					var goodThreshold = 0;

					switch (coalition) {
						case 'Jeanswear':
							goodThreshold = 0.04;
							riskThreshold = 0.06;
							break;
						case 'Imagewear':
							goodThreshold = 0.03;
							riskThreshold = 0.05;
							break;
						case 'Outdoor':
							goodThreshold = 0.02;
							riskThreshold = 0.03;
							break;
						case 'Footwear':
							goodThreshold = 0.02;
							riskThreshold = 0.03;
							break;
						case 'Sportswear':
							goodThreshold = 0.03;
							riskThreshold = 0.06;
							break;
						case 'Contemporary':
							goodThreshold = 0.03;
							riskThreshold = 0.06;
							break;
						default:
							return;
					} //end of switch

					var color = $scope.format.setColor(metricValue, countNotGood, countRisk, riskThreshold, goodThreshold, false);
					return color;
				},
				dcPackagingOqlRate: function(data){
					var coalition = data.coalition;
					var metricValue = data.dcPackagingOqlRate.value;
					var countNotGood = data.dcPackagingOqlRate.countNotGood;
					var countRisk = data.dcPackagingOqlRate.countRisk;
					var goodThreshold = 0.005;
					var riskThreshold = 0.01;
					var color = $scope.format.setColor(metricValue, countNotGood, countRisk, riskThreshold, goodThreshold, false);
					return color;
				},
				dcFitOqlRate: function(data){
					var coalition = data.coalition;
					var metricValue = data.dcFitOqlRate.value;
					var countNotGood = data.dcFitOqlRate.countNotGood;
					var countRisk = data.dcFitOqlRate.countRisk;
					var riskThreshold = 0;
					var goodThreshold = 0;

					switch (coalition) {
						case 'Jeanswear':
							goodThreshold = 0.02;
							riskThreshold = 0.03;
							break;
						case 'JeanswearEU':
							goodThreshold = 0.05;
							riskThreshold = 0.07;
							break;
						default:
							goodThreshold = 0.01;
							riskThreshold = 0.02;
					} //end of switch

					var color = $scope.format.setColor(metricValue, countNotGood, countRisk, riskThreshold, goodThreshold, false);
					return color;
				},
				dcCustomizationRate: function(data){
					var coalition = data.coalition;
					var metricValue = data.dcCustomizationRate.value;
					var countNotGood = data.dcCustomizationRate.countNotGood;
					var countRisk = data.dcCustomizationRate.countRisk;
					var goodThreshold = 0.005;
					var riskThreshold = 0.01;

					var color = $scope.format.setColor(metricValue, countNotGood, countRisk, riskThreshold, goodThreshold, false);
					return color;
				},
				majorDefectsSqlRate: function(data){
					var coalition = data.coalition;
					var metricValue = data.majorDefectsSqlRate.value;
					var countNotGood = data.majorDefectsSqlRate.countNotGood;
					var countRisk = data.majorDefectsSqlRate.countRisk;
					var riskThreshold = 0;
					var goodThreshold = 0;

					switch (coalition) {
						case 'Jeanswear':
							goodThreshold = 0.04;
							riskThreshold = 0.06;
							break;
						case 'Imagewear':
							goodThreshold = 0.03;
							riskThreshold = 0.05;
							break;
						case 'Outdoor':
							goodThreshold = 0.02;
							riskThreshold = 0.03;
							break;
						case 'Footwear':
							goodThreshold = 0.02;
							riskThreshold = 0.03;
							break;
						case 'Sportswear':
							goodThreshold = 0.03;
							riskThreshold = 0.06;
							break;
						case 'Contemporary':
							goodThreshold = 0.03;
							riskThreshold = 0.06;
							break;
						default:
							return;
					} //end of switch

				 	var color = $scope.format.setColor(metricValue, countNotGood, countRisk, riskThreshold, goodThreshold, false);
					return color;
				},
				firstPassRate: function(data){
					var coalition = data.coalition;
					var metricValue = data.firstPassRate.value;
					var countNotGood = data.firstPassRate.countNotGood;
					var countRisk = data.firstPassRate.countRisk;
					var riskThreshold = 0.89;
					var goodThreshold = 0.95;

					var color = $scope.format.setColor(metricValue, countNotGood, countRisk, riskThreshold, goodThreshold, true);
					return color;
				},
				processAuditScore: function(data){
					var coalition = data.coalition;
					var metricValue = data.processAuditScore.value;
					var countNotGood = data.processAuditScore.countNotGood;
					var countRisk = data.processAuditScore.countRisk;
					var riskThreshold = 0.69;
					var goodThreshold = 0.85;

					var color = $scope.format.setColor(metricValue, countNotGood, countRisk, riskThreshold, goodThreshold, true);
					return color;
				},
				dcVasCompliance: function(data){
					var coalition = data.coalition;
					var metricValue = data.dcVasCompliance.value;
					var countNotGood = data.dcVasCompliance.countNotGood;
					var countRisk = data.dcVasCompliance.countRisk;
					var goodThreshold = 100000;
					var riskThreshold = 1000000;

					var color = $scope.format.setColor(metricValue, countNotGood, countRisk, riskThreshold, goodThreshold, false);
					return color;
				},
				dcClaimsRate: function(data){
					var coalition = data.coalition;
					var metricValue = data.dcClaimsRate.value;
					var countNotGood = data.dcClaimsRate.countNotGood;
					var countRisk = data.dcClaimsRate.countRisk;
					var goodThreshold = 0.005;
					var riskThreshold = 0.01;

					var color = $scope.format.setColor(metricValue, countNotGood, countRisk, riskThreshold, goodThreshold, false);
					return color;
				},
				dcReworkTotal: function(data){
					var coalition = data.coalition;
					var metricValue = data.dcReworkTotal.value;
					var countNotGood = data.dcReworkTotal.countNotGood;
					var countRisk = data.dcReworkTotal.countRisk;
					var goodThreshold = 100000;
					var riskThreshold = 1000000;

					var color = $scope.format.setColor(metricValue, countNotGood, countRisk, riskThreshold, goodThreshold, false);
					return color;
				},
				dcInternalChargebacks: function(data){
					var coalition = data.coalition;
					var metricValue = data.dcInternalChargebacks.value;
					var countNotGood = data.dcInternalChargebacks.countNotGood;
					var countRisk = data.dcInternalChargebacks.countRisk;
					var goodThreshold = 100000;
					var riskThreshold = 1000000;

					var color = $scope.format.setColor(metricValue, countNotGood, countRisk, riskThreshold, goodThreshold, false);
					return color;
				},
				dcWarrantyClaims: function(data){
					var coalition = data.coalition;
					var metricValue = data.dcWarrantyClaims.value;
					var countNotGood = data.dcWarrantyClaims.countNotGood;
					var countRisk = data.dcWarrantyClaims.countRisk;
					var goodThreshold = 100000;
					var riskThreshold = 1000000;

					var color = $scope.format.setColor(metricValue, countNotGood, countRisk, riskThreshold, goodThreshold, false);
					return color;
				},
				dcKeyAccountsChargebacks: function(data){
					var coalition = data.coalition;
					var metricValue = data.dcKeyAccountsChargebacks.value;
					var countNotGood = data.dcKeyAccountsChargebacks.countNotGood;
					var countRisk = data.dcKeyAccountsChargebacks.countRisk;
					var goodThreshold = 100000;
					var riskThreshold = 1000000;

					var color = $scope.format.setColor(metricValue, countNotGood, countRisk, riskThreshold, goodThreshold, false);
					return color;
				}
			}
		};

		$scope.getMetric = {
			coalition: function(data){
				return data.coalition;
			},
			supplychain: function(data){
				return data.supplychain;
			},
			majorDefectsOqlRate: function(data){
				return $scope.format.percentage(data.majorDefectsOqlRate.value);
			},
			packagingOqlRate: function(data){
				return $scope.format.percentage(data.packagingOqlRate.value);
			},
			fitOqlRate: function(data){
				return $scope.format.percentage(data.fitOqlRate.value);
			},
			dcMajorDefectsOqlRate: function(data){
				return $scope.format.percentage(data.dcMajorDefectsOqlRate.value);
			},
			dcPackagingOqlRate: function(data){
				return $scope.format.percentage(data.dcPackagingOqlRate.value);
			},
			dcFitOqlRate: function(data){
				return $scope.format.percentage(data.dcFitOqlRate.value);
			},
			dcCustomizationRate: function(data){
				return $scope.format.percentage(data.dcCustomizationRate.value);
			},
			majorDefectsSqlRate: function(data){
				return $scope.format.percentage(data.majorDefectsSqlRate.value);
			},
			firstPassRate: function(data){
				return $scope.format.percentage(data.firstPassRate.value);
			},
			processAuditScore: function(data){
				return $scope.format.percentage(data.processAuditScore.value);
			},
			dcReworkTotal: function(data){
				return $scope.format.currency(data.dcReworkTotal.value);
			},
			dcInternalChargebacks: function(data){
				return $scope.format.currency(data.dcInternalChargebacks.value);
			},
			dcVasCompliance: function(data){
				return $scope.format.currency(data.dcVasCompliance.value);
			},
			dcWarrantyClaims: function(data){
				return $scope.format.currency(data.dcWarrantyClaims.value);
			},
			dcClaimsRate: function(data){
				return $scope.format.percentage(data.dcClaimsRate.value);
			},
			dcKeyAccountsChargebacks: function(data){
				return $scope.format.currency(data.dcKeyAccountsChargebacks.value);
			}
		};

		$scope.modalDrilldown = function (size, data, metric) {

			var modalInstance = $modal.open({
				templateUrl: 'modules/metrics/views/drill-down.view.html',
				controller: ["$scope", "$modalInstance", function ($scope, $modalInstance) {

					var selectedData = {
						year: data.year,
						month: data.month,
						coalition: data.coalition,
						supplychain: data.supplychain
					};

					var getMetricTitle = function(metric){
						switch(metric){
							case 'majorDefectsOqlRate':
								return 'Major Defects Rate OQL';
							case 'packagingOqlRate':
								return 'Labeling & Packaging Defects Rate OQL';
							case 'fitOqlRate':
								return 'Measurement Defects Rate OQL';
							case 'dcMajorDefectsOqlRate':
								return 'Major Defects Rate OQL';
							case 'dcPackagingOqlRate':
								return 'Labeling & Packaging Defects Rate OQL';
							case 'dcFitOqlRate':
								return 'Measurement Defects Rate OQL';
							case 'majorDefectsSqlRate':
								return 'Major Defects Rate SQL';
							case 'dcCustomizationRate':
								return 'Customization Defects Rate';
							case 'firstPassRate':
								return 'First Pass Rate';
							case 'processAuditScore':
								return 'Process Audit Score';
							case 'dcReworkTotal':
								return 'Rework (Direct Cost Claims)';
							case 'dcInternalChargebacks':
								return 'Internal Chargebacks';
							case 'dcVasCompliance':
								return 'Additional Labl & Pkg (VAS) Compliance Costs';
							case 'dcClaimsRate':
								return 'DC Claims Rate';
							case 'dcWarrantyClaims':
								return 'DC Warranty Claims';
							case 'dcKeyAccountsChargebacks':
								return 'Key Accounts Chargebacks';
						}
					};

					$scope.selectedData = selectedData;
					$scope.selectedMetric = metric;
					$scope.metricTitle = getMetricTitle(metric);

					var queryData = function(){
						$http.put('/report/drilldown', selectedData).success(function(response){

							var removeNA = function(dataset, metric){
								var d1 = [];  //cleaned dataset to be returned

								dataset.forEach(function(d){
									var val = '';

									var filter = function(o, val){
										//add item if not null or na but keep 0
										if ( val !== 'N/A' && val || val === 0){
											d1.push(o);
										}

									};

									switch(metric){

										case 'majorDefectsOqlRate':
											val = d.metrics.factory.majorDefectsOql.val;
											filter(d, val);
											break;
										case 'packagingOqlRate':
											val = d.metrics.factory.packagingOql.val;
											filter(d, val);
											break;
										case 'fitOqlRate':
											val = d.metrics.factory.fitOql.val;
											filter(d, val);
											break;
										case 'dcMajorDefectsOqlRate':
											val = d.metrics.dc.majorDefectsOql.val;
											filter(d, val);
											break;
										case 'dcPackagingOqlRate':
											val = d.metrics.dc.packagingOql.val;
											filter(d, val);
											break;
										case 'dcFitOqlRate':
											val = d.metrics.dc.fitOql.val;
											filter(d, val);
											break;
										case 'dcCustomizationRate':
											val = d.metrics.dc.customization.val;
											filter(d, val);
											break;
										case 'majorDefectsSqlRate':
											val = d.metrics.factory.majorDefectsSql.val;
											filter(d, val);
											break;
										case 'firstPassRate':
											val = d.metrics.factory.firstPass.val;
											filter(d, val);
											break;
										case 'processAuditScore':
											val = d.metrics.factory.processAudit.score;
											filter(d, val);
											break;
										case 'dcReworkTotal':
											val = d.metrics.dc.rework.internalChargebacks;
											filter(d, val);
											break;
										case 'dcInternalChargebacks':
											val = d.metrics.dc.rework.internalChargebacks;
											filter(d, val);
											break;
										case 'dcVasCompliance':
											val = d.metrics.dc.vasCompliance;
											filter(d, val);
											break;
										case 'dcWarrantyClaims':
											val = d.metrics.dc.warrantyClaims;
											filter(d, val);
											break;
										case 'dcKeyAccountsChargebacks':
											val = d.metrics.dc.keyAccountsChargebacks;
											filter(d, val);
											break;
									}

								});

								return d1;
							};

							$scope.dataset = removeNA(response, metric);
							console.log($scope.dataset);
						});
					};

					queryData();

					$scope.setSort = function(selectedMetric){
						switch (selectedMetric){
							case 'majorDefectsOqlRate':
								return '-metrics.factory.majorDefectsOql.val';
							case 'packagingOqlRate':
								return '-metrics.factory.packagingOql.val';
							case 'fitOqlRate':
								return '-metrics.factory.fitOql.val';
							case 'dcMajorDefectsOqlRate':
								return '-metrics.dc.majorDefectsOql.val';
							case 'dcPackagingOqlRate':
								return '-metrics.dc.packagingOql.val';
							case 'dcFitOqlRate':
								return '-metrics.dc.fitOql.val';
							case 'dcCustomizationRate':
								return '-metrics.dc.customization.val';
							case 'majorDefectsSqlRate':
								return '-metrics.factory.majorDefectsSql.val';
							case 'firstPassRate':
								return 'metrics.factory.firstPass.val';
							case 'processAuditScore':
								return 'metrics.factory.processAudit.score';
							case 'dcReworkTotal':
								return '-metrics.dc.rework.internalChargebacks';
							case 'dcInternalChargebacks':
								return '-metrics.dc.rework.internalChargebacks';
							case 'dcVasCompliance':
								return '-metrics.dc.vasCompliance';
							case 'dcWarrantyClaims':
								return '-metrics.dc.warrantyClaims';
							case 'dcKeyAccountsChargebacks':
								return '-metrics.dc.keyAccountsChargebacks';
						}
					};

					//Potential refactoring with rootscope format object
					$scope.format = {
						percentage: function(data){
							if(data === 'NA' ){
								return '';
							} else {
								return (data*100).toFixed(2) + '%';
							}
						},
						currency: function(data){
							var numberWithCommas = function (x) {
								return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
							};
							if(data === 'NA'){
								return '';
							} else {
								return '$' + numberWithCommas(Math.round(data));
							}
						},
						setColor: function(metricValue, riskThreshold, goodThreshold, flip){
							if (flip) {
								if (isNaN(metricValue)){
									return 'na';
								} else if (metricValue <= riskThreshold) {
									return 'btn-danger';
								} else if (metricValue >= goodThreshold) {
									return 'btn-success';
								} else {
									return 'btn-warning';
								}
							} else {
								if (isNaN(metricValue)){
									return 'na';
								} else if (metricValue >= riskThreshold) {
									return 'btn-danger';
								} else if (metricValue <= goodThreshold) {
									return 'btn-success';
								} else {
									return 'btn-warning';
								}
							}
						},
						getIndicator: function(data, selectedMetric, key){
							var coalition = '';
							var numerator = '';
							var denominator = '';
							var metricValue = '';
							var riskThreshold = 0;
							var goodThreshold = 0;
							var color = '';

							var isLastItem = function(d, sm){
								var lastItemIndex = $scope.getSelectedMetric(d, sm).length - 1;
								if (key === lastItemIndex){
									return true;
								}
							};

							switch (selectedMetric) {
								case 'majorDefectsOqlRate':
									coalition = data.coalition;
									numerator = data.metrics.factory.majorDefectsOql.defects;
									denominator = data.metrics.factory.majorDefectsOql.audited;
									metricValue = numerator / denominator;
									riskThreshold = 0;
									goodThreshold = 0;

									switch (coalition) {
										case 'Jeanswear':
											goodThreshold = 0.04;
											riskThreshold = 0.06;
											break;
										case 'Imagewear':
											goodThreshold = 0.03;
											riskThreshold = 0.05;
											break;
										case 'Outdoor':
											goodThreshold = 0.02;
											riskThreshold = 0.03;
											break;
										case 'Footwear':
											goodThreshold = 0.02;
											riskThreshold = 0.03;
											break;
										case 'Sportswear':
											goodThreshold = 0.03;
											riskThreshold = 0.06;
											break;
										case 'Contemporary':
											goodThreshold = 0.03;
											riskThreshold = 0.06;
											break;
										default:
											return;
									} //end of switch

								 	color = $scope.format.setColor(metricValue, riskThreshold, goodThreshold, false);

									//Only highlight the last item (the metric value)
									if ( isLastItem(data, selectedMetric) ) {
										return color;
									}
									break;
								case 'packagingOqlRate':
									coalition = data.coalition;
									numerator = data.metrics.factory.packagingOql.defects;
									denominator = data.metrics.factory.packagingOql.audited;
									metricValue = numerator / denominator;
									riskThreshold = 0.005;
									goodThreshold = 0.01;

								 	color = $scope.format.setColor(metricValue, riskThreshold, goodThreshold, false);

									//Only highlight the last item (the metric value)
									if ( isLastItem(data, selectedMetric) ) {
										return color;
									}
									break;
								case 'fitOqlRate':
									coalition = data.coalition;
									numerator = data.metrics.factory.fitOql.defects;
									denominator = data.metrics.factory.fitOql.audited;
									metricValue = numerator / denominator;
									riskThreshold = 0;
									goodThreshold = 0;

									switch (coalition) {
										case 'Jeanswear':
											goodThreshold = 0.02;
											riskThreshold = 0.03;
											break;
										case 'JeanswearEU':
											goodThreshold = 0.05;
											riskThreshold = 0.07;
											break;
										default:
											goodThreshold = 0.01;
											riskThreshold = 0.02;
									} //end of switch

								 	color = $scope.format.setColor(metricValue, riskThreshold, goodThreshold, false);

									//Only highlight the last item (the metric value)
									if ( isLastItem(data, selectedMetric) ) {
										return color;
									}
									break;
								case 'dcMajorDefectsOqlRate':
									coalition = data.coalition;
									numerator = data.metrics.dc.majorDefectsOql.defects;
									denominator = data.metrics.dc.majorDefectsOql.audited;
									metricValue = numerator / denominator;
									riskThreshold = 0;
									goodThreshold = 0;

									switch (coalition) {
										case 'Jeanswear':
											goodThreshold = 0.04;
											riskThreshold = 0.06;
											break;
										case 'Imagewear':
											goodThreshold = 0.03;
											riskThreshold = 0.05;
											break;
										case 'Outdoor':
											goodThreshold = 0.02;
											riskThreshold = 0.03;
											break;
										case 'Footwear':
											goodThreshold = 0.02;
											riskThreshold = 0.03;
											break;
										case 'Sportswear':
											goodThreshold = 0.03;
											riskThreshold = 0.06;
											break;
										case 'Contemporary':
											goodThreshold = 0.03;
											riskThreshold = 0.06;
											break;
										default:
											return;
									} //end of switch

								 	color = $scope.format.setColor(metricValue, riskThreshold, goodThreshold, false);

									//Only highlight the last item (the metric value)
									if ( isLastItem(data, selectedMetric) ) {
										return color;
									}
									break;
								case 'dcPackagingOqlRate':
									coalition = data.coalition;
									numerator = data.metrics.dc.packagingOql.defects;
									denominator = data.metrics.dc.packagingOql.audited;
									metricValue = numerator / denominator;
									riskThreshold = 0.005;
									goodThreshold = 0.01;

								 	color = $scope.format.setColor(metricValue, riskThreshold, goodThreshold, false);

									//Only highlight the last item (the metric value)
									if ( isLastItem(data, selectedMetric) ) {
										return color;
									}
									break;
								case 'dcFitOqlRate':
									coalition = data.coalition;
									numerator = data.metrics.dc.fitOql.defects;
									denominator = data.metrics.dc.fitOql.audited;
									metricValue = numerator / denominator;
									riskThreshold = 0;
									goodThreshold = 0;

									switch (coalition) {
										case 'Jeanswear':
											goodThreshold = 0.02;
											riskThreshold = 0.03;
											break;
										case 'JeanswearEU':
											goodThreshold = 0.05;
											riskThreshold = 0.07;
											break;
										default:
											goodThreshold = 0.01;
											riskThreshold = 0.02;
									} //end of switch

								 	color = $scope.format.setColor(metricValue, riskThreshold, goodThreshold, false);

									//Only highlight the last item (the metric value)
									if ( isLastItem(data, selectedMetric) ) {
										return color;
									}
									break;
								case 'dcCustomizationRate':
									coalition = data.coalition;
									numerator = data.metrics.dc.customization.defects;
									denominator = data.metrics.dc.customization.audited;
									metricValue = numerator / denominator;
									goodThreshold = 0.005;
									riskThreshold = 0.01;

								 	color = $scope.format.setColor(metricValue, riskThreshold, goodThreshold, false);

									//Only highlight the last item (the metric value)
									if ( isLastItem(data, selectedMetric) ) {
										return color;
									}
									break;
								case 'majorDefectsSqlRate':
									coalition = data.coalition;
									numerator = data.metrics.factory.majorDefectsSql.defects;
									denominator = data.metrics.factory.majorDefectsSql.audited;
									metricValue = numerator / denominator;
									goodThreshold = 0;
									riskThreshold = 0;

									switch (coalition) {
										case 'Jeanswear':
											goodThreshold = 0.04;
											riskThreshold = 0.06;
											break;
										case 'Imagewear':
											goodThreshold = 0.03;
											riskThreshold = 0.05;
											break;
										case 'Outdoor':
											goodThreshold = 0.02;
											riskThreshold = 0.03;
											break;
										case 'Footwear':
											goodThreshold = 0.02;
											riskThreshold = 0.03;
											break;
										case 'Sportswear':
											goodThreshold = 0.03;
											riskThreshold = 0.06;
											break;
										case 'Contemporary':
											goodThreshold = 0.03;
											riskThreshold = 0.06;
											break;
										default:
											return;
									} //end of switch

								 	color = $scope.format.setColor(metricValue, riskThreshold, goodThreshold, false);

									//Only highlight the last item (the metric value)
									if ( isLastItem(data, selectedMetric) ) {
										return color;
									}
									break;
								case 'firstPassRate':
									coalition = data.coalition;
									numerator = data.metrics.factory.firstPass.passed;
									denominator = data.metrics.factory.firstPass.audited;
									metricValue = numerator / denominator;
									riskThreshold = 0.89;
									goodThreshold = 0.95;

									color = $scope.format.setColor(metricValue, riskThreshold, goodThreshold, true);

									//Only highlight the last item (the metric value)
									if ( isLastItem(data, selectedMetric) ) {
										return color;
									}
									break;
								case 'processAuditScore':
									coalition = data.coalition;
									metricValue = data.metrics.factory.processAudit.score;
									riskThreshold = 0.69;
									goodThreshold = 0.85;

									color = $scope.format.setColor(metricValue, riskThreshold, goodThreshold, true);

									//Only highlight the last item (the metric value)
									if ( isLastItem(data, selectedMetric) ) {
										return color;
									}
									break;
								case 'dcClaimsRate':
									coalition = data.coalition;
									numerator = data.metrics.dc.claims.returned;
									denominator = data.metrics.dc.claims.received;
									metricValue = numerator / denominator;
									goodThreshold = 0.005;
									riskThreshold = 0.01;

									color = $scope.format.setColor(metricValue, riskThreshold, goodThreshold, false);

									//Only highlight the last item (the metric value)
									if ( isLastItem(data, selectedMetric) ) {
										return color;
									}
									break;
								default:
									return;
							}
						}
					};

					$scope.getSelectedMetric = function(data, selectedMetric){
						var computedVal = 0;
						var numerator = 0;
						var denominator = 0;
						var total = 0;
						var vendorChargeback = 0;
						var score = 0;
						var date = 0;
						var dataset = [];

						switch (selectedMetric) {
							case 'majorDefectsOqlRate':
								numerator = data.metrics.factory.majorDefectsOql.defects;
								denominator = data.metrics.factory.majorDefectsOql.audited;
								computedVal = $scope.format.percentage(numerator / denominator);

								dataset.push(denominator, numerator, computedVal);
								return dataset;
							case 'packagingOqlRate':
								numerator = data.metrics.factory.packagingOql.defects;
								denominator = data.metrics.factory.packagingOql.audited;
								computedVal = $scope.format.percentage(numerator / denominator);

								dataset.push(denominator, numerator, computedVal);
								return dataset;
							case 'fitOqlRate':
								numerator = data.metrics.factory.fitOql.defects;
								denominator = data.metrics.factory.fitOql.audited;
								computedVal = $scope.format.percentage(numerator / denominator);

								dataset.push(denominator, numerator, computedVal);
								return dataset;
							case 'dcMajorDefectsOqlRate':
								numerator = data.metrics.dc.majorDefectsOql.defects;
								denominator = data.metrics.dc.majorDefectsOql.audited;
								computedVal = $scope.format.percentage(numerator / denominator);

								dataset.push(denominator, numerator, computedVal);
								return dataset;
							case 'dcPackagingOqlRate':
								numerator = data.metrics.dc.packagingOql.defects;
								denominator = data.metrics.dc.packagingOql.audited;
								computedVal = $scope.format.percentage(numerator / denominator);

								dataset.push(denominator, numerator, computedVal);
								return dataset;
							case 'dcFitOqlRate':
								numerator = data.metrics.dc.fitOql.defects;
								denominator = data.metrics.dc.fitOql.audited;
								computedVal = $scope.format.percentage(numerator / denominator);

								dataset.push(denominator, numerator, computedVal);
								return dataset;
							case 'dcCustomizationRate':
								numerator = data.metrics.dc.customization.defects;
								denominator = data.metrics.dc.customization.audited;
								computedVal = $scope.format.percentage(numerator / denominator);

								dataset.push(denominator, numerator, computedVal);
								return dataset;
							case 'majorDefectsSqlRate':
								numerator = data.metrics.factory.majorDefectsSql.defects;
								denominator = data.metrics.factory.majorDefectsSql.audited;
								computedVal = $scope.format.percentage(numerator / denominator);

								dataset.push(denominator, numerator, computedVal);
								return dataset;
							case 'firstPassRate':
								numerator = data.metrics.factory.firstPass.passed;
								denominator = data.metrics.factory.firstPass.audited;
								computedVal = $scope.format.percentage(numerator / denominator);

								dataset.push(denominator, numerator, computedVal);
								return dataset;
							case 'processAuditScore':
								score = $scope.format.percentage(data.metrics.factory.processAudit.score);
								date = data.metrics.factory.processAudit.date;

								dataset.push(date, score);
								return dataset;
							case 'dcReworkTotal':
								total = data.metrics.dc.rework.total;
								vendorChargeback = data.metrics.dc.rework.vendorChargeback;
								computedVal = $scope.format.currency(total - vendorChargeback);

								dataset.push(total, vendorChargeback, computedVal);
								return dataset;
							case 'dcInternalChargebacks':
								total = data.metrics.dc.rework.total;
								vendorChargeback = data.metrics.dc.rework.vendorChargeback;
								computedVal = $scope.format.currency(total - vendorChargeback);

								dataset.push(total, vendorChargeback, computedVal);
								return dataset;
							case 'dcVasCompliance':
								dataset.push($scope.format.currency(data.metrics.dc.vasCompliance));
								return dataset;
							case 'dcWarrantyClaims':
								dataset.push($scope.format.currency(data.metrics.dc.warrantyClaims));
								return dataset;
							case 'dcClaimsRate':
								numerator = data.metrics.dc.claims.returned;
								denominator = data.metrics.dc.claims.received;
								computedVal = $scope.format.percentage(numerator / denominator);

								dataset.push(denominator, numerator, computedVal);
								return dataset;
							case 'dcKeyAccountsChargebacks':
								dataset.push($scope.format.currency(data.metrics.dc.keyAccountsChargebacks));
								return dataset;
							default:
								return;
						}
					};

					$scope.getHeader = function(selectedMetric){
						var headers = [];

						switch (selectedMetric) {
							case 'processAuditScore':
								headers.push('Date','Score');
								return headers;
							case 'dcReworkTotal':
								headers.push('Total', 'Vendor Chargebacks', 'Internal Chargebacks');
								return headers;
							case 'dcInternalChargebacks':
								headers.push('Total', 'Vendor Chargebacks', 'Internal Chargebacks');
								return headers;
							case 'dcVasCompliance':
								headers.push('Total');
								return headers;
							case 'dcWarrantyClaims':
								headers.push('Total');
								return headers;
							case 'dcClaimsRate':
								headers.push('Received', 'Returned', getMetricTitle(selectedMetric));
								return headers;
							case 'dcKeyAccountsChargebacks':
								headers.push('Total');
								return headers;
							default:
								headers.push('Audited', 'Defects Found', getMetricTitle(selectedMetric));
								return headers;
						}
					};

					$scope.cancel = function () {
						$modalInstance.dismiss('cancel');
					};
				}],
				size: size
			});

			modalInstance.result.then(function () {
			}, function () {
				$log.info('Modal dismissed at: ' + new Date());
			});
		};
	}
]);

metricsApp.directive('reportCard', function(){
	return {
		restrict: 'EA',
		scope: {
			dataset: '=',
			selected: '=',
			getMetric: '=',
			format: '=',
			modalDrilldown: '=',
			coalition: '@'
		},
		transclude: true,
		templateUrl: 'modules/metrics/views/report-card-template.html'
	};
});

'use strict';

angular.module('customFilter', [])
  .filter('unique', function() {
    return function(input, key) {
        var unique = {};
        var uniqueList = [];
        for(var i = 0; i < input.length; i++){
            if(typeof unique[input[i][key]] === 'undefined'){
                unique[input[i][key]] = '';
                uniqueList.push(input[i]);
            }
        }
        return uniqueList;
    };
  });

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

'use strict';

// Config HTTP Error Handling
angular.module('users').config(['$httpProvider',
	function($httpProvider) {
		// Set the httpProvider "not authorized" interceptor
		$httpProvider.interceptors.push(['$q', '$location', 'Authentication',
			function($q, $location, Authentication) {
				return {
					responseError: function(rejection) {
						switch (rejection.status) {
							case 401:
								// Deauthenticate the global user
								Authentication.user = null;

								// Redirect to signin page
								$location.path('signin');
								break;
							case 403:
								// Add unauthorized behaviour 
								break;
						}

						return $q.reject(rejection);
					}
				};
			}
		]);
	}
]);
'use strict';

// Setting up route
angular.module('users').config(['$stateProvider',
	function($stateProvider) {
		// Users state routing
		$stateProvider.
		state('profile', {
			url: '/settings/profile',
			templateUrl: 'modules/users/views/settings/edit-profile.client.view.html'
		}).
		state('password', {
			url: '/settings/password',
			templateUrl: 'modules/users/views/settings/change-password.client.view.html'
		}).
		state('accounts', {
			url: '/settings/accounts',
			templateUrl: 'modules/users/views/settings/social-accounts.client.view.html'
		}).
		state('signup', {
			url: '/signup',
			templateUrl: 'modules/users/views/authentication/signup.client.view.html'
		}).
		state('signin', {
			url: '/signin',
			templateUrl: 'modules/users/views/authentication/signin.client.view.html'
		}).
		state('forgot', {
			url: '/password/forgot',
			templateUrl: 'modules/users/views/password/forgot-password.client.view.html'
		}).
		state('reset-invalid', {
			url: '/password/reset/invalid',
			templateUrl: 'modules/users/views/password/reset-password-invalid.client.view.html'
		}).
		state('reset-success', {
			url: '/password/reset/success',
			templateUrl: 'modules/users/views/password/reset-password-success.client.view.html'
		}).
		state('reset', {
			url: '/password/reset/:token',
			templateUrl: 'modules/users/views/password/reset-password.client.view.html'
		});
	}
]);
'use strict';

angular.module('users').controller('AuthenticationController', ['$scope', '$http', '$location', 'Authentication',
	function($scope, $http, $location, Authentication) {
		$scope.authentication = Authentication;

		// If user is signed in then redirect back home
		if ($scope.authentication.user) $location.path('/');

		$scope.signup = function() {
			$http.post('/auth/signup', $scope.credentials).success(function(response) {
				// If successful we assign the response to the global user model
				$scope.authentication.user = response;

				// And redirect to the index page
				$location.path('/');
			}).error(function(response) {
				$scope.error = response.message;
			});
		};

		$scope.signin = function() {
			$http.post('/auth/signin', $scope.credentials).success(function(response) {
				// If successful we assign the response to the global user model
				$scope.authentication.user = response;

				// And redirect to the index page
				$location.path('/metrics');
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);

'use strict';

angular.module('users').controller('PasswordController', ['$scope', '$stateParams', '$http', '$location', 'Authentication',
	function($scope, $stateParams, $http, $location, Authentication) {
		$scope.authentication = Authentication;

		//If user is signed in then redirect back home
		if ($scope.authentication.user) $location.path('/');

		// Submit forgotten password account id
		$scope.askForPasswordReset = function() {
			$scope.success = $scope.error = null;

			$http.post('/auth/forgot', $scope.credentials).success(function(response) {
				// Show user success message and clear form
				$scope.credentials = null;
				$scope.success = response.message;

			}).error(function(response) {
				// Show user error message and clear form
				$scope.credentials = null;
				$scope.error = response.message;
			});
		};

		// Change user password
		$scope.resetUserPassword = function() {
			$scope.success = $scope.error = null;

			$http.post('/auth/reset/' + $stateParams.token, $scope.passwordDetails).success(function(response) {
				// If successful show success message and clear form
				$scope.passwordDetails = null;

				// Attach user profile
				Authentication.user = response;

				// And redirect to the index page
				$location.path('/password/reset/success');
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);
'use strict';

angular.module('users').controller('SettingsController', ['$scope', '$http', '$location', 'Users', 'Authentication',
	function($scope, $http, $location, Users, Authentication) {
		$scope.user = Authentication.user;

		// If user is not signed in then redirect back home
		if (!$scope.user) $location.path('/');

		// Check if there are additional accounts 
		$scope.hasConnectedAdditionalSocialAccounts = function(provider) {
			for (var i in $scope.user.additionalProvidersData) {
				return true;
			}

			return false;
		};

		// Check if provider is already in use with current user
		$scope.isConnectedSocialAccount = function(provider) {
			return $scope.user.provider === provider || ($scope.user.additionalProvidersData && $scope.user.additionalProvidersData[provider]);
		};

		// Remove a user social account
		$scope.removeUserSocialAccount = function(provider) {
			$scope.success = $scope.error = null;

			$http.delete('/users/accounts', {
				params: {
					provider: provider
				}
			}).success(function(response) {
				// If successful show success message and clear form
				$scope.success = true;
				$scope.user = Authentication.user = response;
			}).error(function(response) {
				$scope.error = response.message;
			});
		};

		// Update a user profile
		$scope.updateUserProfile = function(isValid) {
			if (isValid) {
				$scope.success = $scope.error = null;
				var user = new Users($scope.user);

				user.$update(function(response) {
					$scope.success = true;
					Authentication.user = response;
				}, function(response) {
					$scope.error = response.data.message;
				});
			} else {
				$scope.submitted = true;
			}
		};

		// Change user password
		$scope.changeUserPassword = function() {
			$scope.success = $scope.error = null;

			$http.post('/users/password', $scope.passwordDetails).success(function(response) {
				// If successful show success message and clear form
				$scope.success = true;
				$scope.passwordDetails = null;
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);
'use strict';

// Authentication service for user variables
angular.module('users').factory('Authentication', [
	function() {
		var _this = this;

		_this._data = {
			user: window.user
		};

		return _this._data;
	}
]);
'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('users').factory('Users', ['$resource',
	function($resource) {
		return $resource('users', {}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);