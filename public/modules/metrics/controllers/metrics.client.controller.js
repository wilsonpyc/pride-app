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
				controller: function ($scope, $modalInstance) {

					$scope.addMetric = function () {
						console.log('1 record has been added.');
						$modalInstance.close();
						loadAndRefresh();
				};

					$scope.cancel = function () {
						$modalInstance.dismiss('cancel');
					};
				},
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
				controller: function ($scope, $modalInstance) {

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
				},
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

				combineData(datasets[0].data, datasets[1].data);
			});

		};

		$http.post('/report', $scope.selected).success(function(res){
			console.log(res);
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
						if (countNotGood >= 0) {
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
					} else if (metricValue >= riskThreshold) {
						return 'btn-danger';
					} else if (metricValue <= goodThreshold) {
						if (countNotGood >= 0) {
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

					var color = $scope.format.setColor(metricValue, countRisk, riskThreshold, goodThreshold, false);
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
				controller: function ($scope, $modalInstance) {

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
							$scope.dataset = response;
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
							if(data === 'NA' || !data){
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

					$scope.isNa = function(data, selectedMetric){
						var d = data;
						var sm = selectedMetric;
						var v = $scope.getSelectedMetric(d, sm);

						if ( v[v.length - 1] === 'NaN%' || !v[v.length - 1]){
							return true;
						}
					};

					$scope.cancel = function () {
						$modalInstance.dismiss('cancel');
					};
				},
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
