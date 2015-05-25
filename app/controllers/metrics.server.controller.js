'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
		Metric = mongoose.model('Metric'),
	_ = require('lodash');

/**
 * Create a Metric
 */
exports.create = function(req, res) {
	console.log(req.body);

	var metric = new Metric(req.body);

	metric.save(function(err, docs){
		if(err){console.log(err);}
		res.json(docs);
	});
};

/**
 * Setting the params for query
 */
exports.query = function(req, res) {
	console.log(req.body); //req.body is the object that has the selected options from the filter modal

	var params = {
		coalition: req.body.coalition,
		supplychain: req.body.supplychain,
		brand: req.body.brand,
		year: req.body.year,
		month: req.body.month
	};

	Metric
		.find({})
		.where('coalition').equals(params.coalition)
		.where('supplychain').equals(params.supplychain)
		.where('brand').equals(params.brand)
		.where('year').equals(params.year)
		.where('month').equals(params.month)
		.sort('-ffc')
		.select('ffc factoryname coalition supplychain brand year month defects')
		.exec(function(err, result){
			res.json(result); //result is the filtered metrics that get sent back to the controller
		});
};

/**
 * Aggregation function for report
 */
exports.aggregate = function(req, res) {
	console.log('Aggregating data...');
	Metric
		.aggregate(
			{ //Getting Fields From Nested Objects
				$project : {
					_id: 1,
					year: '$year',
					month: '$month',
					coalition: '$coalition',
					supplychain: '$supplychain',
					countNotGood: 1,
					majorDefectsOqlAudited: '$metrics.factory.majorDefectsOql.audited',
					majorDefectsOqlDefects: '$metrics.factory.majorDefectsOql.defects',
					packagingOqlAudited: '$metrics.factory.packagingOql.audited',
					packagingOqlDefects: '$metrics.factory.packagingOql.defects',
					fitOqlAudited: '$metrics.factory.fitOql.audited',
					fitOqlDefects: '$metrics.factory.fitOql.defects',
					majorDefectsSqlAudited: '$metrics.factory.majorDefectsSql.audited',
					majorDefectsSqlDefects: '$metrics.factory.majorDefectsSql.defects',
					firstPassAudited: '$metrics.factory.firstPass.audited',
					firstPassPassed: '$metrics.factory.firstPass.passed',
					processAuditScore: '$metrics.factory.processAudit.score',
					dcMajorDefectsOqlAudited: '$metrics.dc.majorDefectsOql.audited',
					dcMajorDefectsOqlDefects: '$metrics.dc.majorDefectsOql.defects',
					dcPackagingOqlAudited: '$metrics.dc.packagingOql.audited',
					dcPackagingOqlDefects: '$metrics.dc.packagingOql.defects',
					dcFitOqlAudited: '$metrics.dc.fitOql.audited',
					dcFitOqlDefects: '$metrics.dc.fitOql.defects',
					dcCustomizationAudited: '$metrics.dc.customization.audited',
					dcCustomizationDefects: '$metrics.dc.customization.defects',
					dcReworkTotal: '$metrics.dc.rework.total',
					dcReworkVendorChargeback: '$metrics.dc.rework.vendorChargeback',
					dcInternalChargebacks: '$metrics.dc.internalChargebacks',
					dcVasCompliance: '$metrics.dc.vasCompliance',
					dcWarrantyClaims: '$metrics.dc.warrantyClaims',
					dcClaimsReceived: '$metrics.dc.claims.received',
					dcClaimsReturned: '$metrics.dc.claims.returned',
					dcKeyAccountsChargebacks: '$metrics.dc.keyAccountsChargebacks'
				}
			},
			{ //Group By _id: {year, month, coalition, supplychain}
				$group : {
					_id : {year: '$year', month: '$month', coalition: '$coalition', supplychain: '$supplychain'},
					majorDefectsOqlAudited : {$sum: '$majorDefectsOqlAudited'},
					majorDefectsOqlDefects : {$sum: '$majorDefectsOqlDefects'},
					packagingOqlAudited : {$sum: '$packagingOqlAudited'},
					packagingOqlDefects : {$sum: '$packagingOqlDefects'},
					fitOqlAudited : {$sum: '$fitOqlAudited'},
					fitOqlDefects : {$sum: '$fitOqlDefects'},
					majorDefectsSqlAudited : {$sum: '$majorDefectsSqlAudited'},
					majorDefectsSqlDefects : {$sum: '$majorDefectsSqlDefects'},
					firstPassAudited : {$sum: '$firstPassAudited'},
					firstPassPassed : {$sum: '$firstPassPassed'},
					processAuditScore: {$avg: '$processAuditScore'},
					dcMajorDefectsOqlAudited: {$sum: '$dcMajorDefectsOqlAudited'},
					dcMajorDefectsOqlDefects: {$sum: '$dcMajorDefectsOqlDefects'},
					dcPackagingOqlAudited: {$sum: '$dcPackagingOqlAudited'},
					dcPackagingOqlDefects: {$sum: '$dcPackagingOqlDefects'},
					dcFitOqlAudited: {$sum: '$dcFitOqlAudited'},
					dcFitOqlDefects: {$sum: '$dcFitOqlDefects'},
					dcCustomizationAudited: {$sum: '$dcCustomizationAudited'},
					dcCustomizationDefects: {$sum: '$dcCustomizationDefects'},
					dcReworkTotal: {$sum: '$dcReworkTotal'},
					dcReworkVendorChargeback: {$sum: '$dcReworkVendorChargeback'},
					dcInternalChargebacks: {$sum: '$dcInternalChargebacks'},
					dcVasCompliance: {$sum: '$dcVasCompliance'},
					dcWarrantyClaims: {$sum: '$dcWarrantyClaims'},
					dcClaimsReceived: {$sum: '$dcClaimsReceived'},
					dcClaimsReturned: {$sum: '$dcClaimsReturned'},
					dcKeyAccountsChargebacks: {$sum: '$dcKeyAccountsChargebacks'}
				}
			},
			{ //Calculate Percentage
				$project : {
					_id:1,
					firstPassAudited: 1,
					firstPassPassed: 1,
					processAuditScore: 1,
					dcCustomizationAudited: 1,
					dcCustomizationDefects: 1,
					dcReworkTotal: 1,
					dcReworkVendorChargeback: 1,
					dcInternalChargebacks: 1,
					dcVasCompliance: 1,
					dcWarrantyClaims: 1,
					dcKeyAccountsChargebacks: 1,
					majorDefectsOqlRate: { $cond: [ { $eq: [ '$majorDefectsOqlAudited', 0] }, 'N/A', { $divide: [ '$majorDefectsOqlDefects', '$majorDefectsOqlAudited' ] } ] },
					packagingOqlRate: { $cond: [ { $eq: [ '$packagingOqlAudited', 0] }, 'N/A', { $divide: [ '$packagingOqlDefects', '$packagingOqlAudited' ] } ] },
					fitOqlRate: { $cond: [ { $eq: [ '$fitOqlAudited', 0] }, 'N/A', { $divide: [ '$fitOqlDefects', '$fitOqlAudited' ] } ] },
					majorDefectsSqlRate: { $cond: [ { $eq: [ '$majorDefectsSqlAudited', 0] }, 'N/A', { $divide: [ '$majorDefectsSqlDefects', '$majorDefectsSqlAudited' ] } ] },
					firstPassRate: { $cond: [ { $eq: [ '$firstPassAudited', 0] }, 'N/A', { $divide: [ '$firstPassPassed', '$firstPassAudited' ] } ] },
					dcMajorDefectsOqlRate: { $cond: [ { $eq: [ '$dcMajorDefectsOqlAudited', 0] }, 'N/A', { $divide: [ '$dcMajorDefectsOqlDefects', '$dcMajorDefectsOqlAudited'] } ] },
					dcPackagingOqlRate: { $cond: [ { $eq: [ '$dcPackagingOqlAudited', 0] }, 'N/A', { $divide: [ '$dcPackagingOqlDefects', '$dcPackagingOqlAudited'] } ] },
					dcFitOqlRate: { $cond: [ { $eq: [ '$dcFitOqlAudited', 0] }, 'N/A', { $divide: [ '$dcFitOqlDefects', '$dcFitOqlAudited'] } ] },
					dcCustomizationRate: { $cond: [ { $eq: [ '$dcCustomizationAudited', 0] }, 'N/A', { $divide: [ '$dcCustomizationDefects', '$dcCustomizationAudited'] } ] },
					dcClaimsRate: { $cond: [ { $eq: [ '$dcClaimsReceived', 0] }, 'N/A', { $divide: [ '$dcClaimsReturned', '$dcClaimsReceived'] } ] }
				}
			},
			{ //Only Show Percentage
				$project : {
					_id: 0,
					year: '$_id.year',
					month: '$_id.month',
					coalition: '$_id.coalition',
					supplychain: '$_id.supplychain',
					majorDefectsOqlRate: 1,
					packagingOqlRate: 1,
					fitOqlRate: 1,
					majorDefectsSqlRate: 1,
					firstPassRate: 1,
					processAuditScore: 1,
					dcMajorDefectsOqlRate: 1,
					dcPackagingOqlRate: 1,
					dcFitOqlRate: 1,
					dcReworkTotal: 1,
					dcReworkVendorChargeback: 1,
					dcInternalChargebacks: 1,
					dcVasCompliance: 1,
					dcWarrantyClaims: 1,
					dcClaimsRate: 1,
					dcCustomizationRate: 1,
					dcKeyAccountsChargebacks: 1
				}
			}
		)
		.exec(function(err,result){
			res.json(result);
		});
};

/**
 * Aggregation function for report with select
 */
exports.getReport = function(req, res) {
	console.log('Filtering...');
	console.log('Aggregating...');

	var match = {};
	if (req.body.year){ match.year = req.body.year; }
	if (req.body.month){ match.month = req.body.month; }
	if (req.body.coalition){ match.coalition = req.body.coalition; }
	console.log(match);

	Metric
		.aggregate(
			{
				$match : match
			},
			{ //Getting Fields From Nested Objects
				$project : {
					_id: 1,
					year: '$year',
					month: '$month',
					coalition: '$coalition',
					supplychain: '$supplychain',
					countNotGood: 1,
					majorDefectsOqlAudited: '$metrics.factory.majorDefectsOql.audited',
					majorDefectsOqlDefects: '$metrics.factory.majorDefectsOql.defects',
					packagingOqlAudited: '$metrics.factory.packagingOql.audited',
					packagingOqlDefects: '$metrics.factory.packagingOql.defects',
					fitOqlAudited: '$metrics.factory.fitOql.audited',
					fitOqlDefects: '$metrics.factory.fitOql.defects',
					majorDefectsSqlAudited: '$metrics.factory.majorDefectsSql.audited',
					majorDefectsSqlDefects: '$metrics.factory.majorDefectsSql.defects',
					firstPassAudited: '$metrics.factory.firstPass.audited',
					firstPassPassed: '$metrics.factory.firstPass.passed',
					processAuditScore: '$metrics.factory.processAudit.score',
					dcMajorDefectsOqlAudited: '$metrics.dc.majorDefectsOql.audited',
					dcMajorDefectsOqlDefects: '$metrics.dc.majorDefectsOql.defects',
					dcPackagingOqlAudited: '$metrics.dc.packagingOql.audited',
					dcPackagingOqlDefects: '$metrics.dc.packagingOql.defects',
					dcFitOqlAudited: '$metrics.dc.fitOql.audited',
					dcFitOqlDefects: '$metrics.dc.fitOql.defects',
					dcCustomizationAudited: '$metrics.dc.customization.audited',
					dcCustomizationDefects: '$metrics.dc.customization.defects',
					dcReworkTotal: '$metrics.dc.rework.total',
					dcReworkVendorChargeback: '$metrics.dc.rework.vendorChargeback',
					dcInternalChargebacks: '$metrics.dc.internalChargebacks',
					dcVasCompliance: '$metrics.dc.vasCompliance',
					dcWarrantyClaims: '$metrics.dc.warrantyClaims',
					dcClaimsReceived: '$metrics.dc.claims.received',
					dcClaimsReturned: '$metrics.dc.claims.returned',
					dcKeyAccountsChargebacks: '$metrics.dc.keyAccountsChargebacks'
				}
			},
			{ //Group By _id: {year, month, coalition, supplychain}
				$group : {
					_id : {year: '$year', month: '$month', coalition: '$coalition', supplychain: '$supplychain'},
					majorDefectsOqlAudited : {$sum: '$majorDefectsOqlAudited'},
					majorDefectsOqlDefects : {$sum: '$majorDefectsOqlDefects'},
					packagingOqlAudited : {$sum: '$packagingOqlAudited'},
					packagingOqlDefects : {$sum: '$packagingOqlDefects'},
					fitOqlAudited : {$sum: '$fitOqlAudited'},
					fitOqlDefects : {$sum: '$fitOqlDefects'},
					majorDefectsSqlAudited : {$sum: '$majorDefectsSqlAudited'},
					majorDefectsSqlDefects : {$sum: '$majorDefectsSqlDefects'},
					firstPassAudited : {$sum: '$firstPassAudited'},
					firstPassPassed : {$sum: '$firstPassPassed'},
					processAuditScore: {$avg: '$processAuditScore'},
					dcMajorDefectsOqlAudited: {$sum: '$dcMajorDefectsOqlAudited'},
					dcMajorDefectsOqlDefects: {$sum: '$dcMajorDefectsOqlDefects'},
					dcPackagingOqlAudited: {$sum: '$dcPackagingOqlAudited'},
					dcPackagingOqlDefects: {$sum: '$dcPackagingOqlDefects'},
					dcFitOqlAudited: {$sum: '$dcFitOqlAudited'},
					dcFitOqlDefects: {$sum: '$dcFitOqlDefects'},
					dcCustomizationAudited: {$sum: '$dcCustomizationAudited'},
					dcCustomizationDefects: {$sum: '$dcCustomizationDefects'},
					dcReworkTotal: {$sum: '$dcReworkTotal'},
					dcReworkVendorChargeback: {$sum: '$dcReworkVendorChargeback'},
					dcInternalChargebacks: {$sum: '$dcInternalChargebacks'},
					dcVasCompliance: {$sum: '$dcVasCompliance'},
					dcWarrantyClaims: {$sum: '$dcWarrantyClaims'},
					dcClaimsReceived: {$sum: '$dcClaimsReceived'},
					dcClaimsReturned: {$sum: '$dcClaimsReturned'},
					dcKeyAccountsChargebacks: {$sum: '$dcKeyAccountsChargebacks'}
				}
			},
			{ //Calculate Percentage
				$project : {
					_id:1,
					firstPassAudited: 1,
					firstPassPassed: 1,
					processAuditScore: 1,
					dcCustomizationAudited: 1,
					dcCustomizationDefects: 1,
					dcReworkTotal: 1,
					dcReworkVendorChargeback: 1,
					dcInternalChargebacks: 1,
					dcVasCompliance: 1,
					dcWarrantyClaims: 1,
					dcKeyAccountsChargebacks: 1,
					majorDefectsOqlRate: { $cond: [ { $eq: [ '$majorDefectsOqlAudited', 0] }, 'N/A', { $divide: [ '$majorDefectsOqlDefects', '$majorDefectsOqlAudited' ] } ] },
					packagingOqlRate: { $cond: [ { $eq: [ '$packagingOqlAudited', 0] }, 'N/A', { $divide: [ '$packagingOqlDefects', '$packagingOqlAudited' ] } ] },
					fitOqlRate: { $cond: [ { $eq: [ '$fitOqlAudited', 0] }, 'N/A', { $divide: [ '$fitOqlDefects', '$fitOqlAudited' ] } ] },
					majorDefectsSqlRate: { $cond: [ { $eq: [ '$majorDefectsSqlAudited', 0] }, 'N/A', { $divide: [ '$majorDefectsSqlDefects', '$majorDefectsSqlAudited' ] } ] },
					firstPassRate: { $cond: [ { $eq: [ '$firstPassAudited', 0] }, 'N/A', { $divide: [ '$firstPassPassed', '$firstPassAudited' ] } ] },
					dcMajorDefectsOqlRate: { $cond: [ { $eq: [ '$dcMajorDefectsOqlAudited', 0] }, 'N/A', { $divide: [ '$dcMajorDefectsOqlDefects', '$dcMajorDefectsOqlAudited'] } ] },
					dcPackagingOqlRate: { $cond: [ { $eq: [ '$dcPackagingOqlAudited', 0] }, 'N/A', { $divide: [ '$dcPackagingOqlDefects', '$dcPackagingOqlAudited'] } ] },
					dcFitOqlRate: { $cond: [ { $eq: [ '$dcFitOqlAudited', 0] }, 'N/A', { $divide: [ '$dcFitOqlDefects', '$dcFitOqlAudited'] } ] },
					dcCustomizationRate: { $cond: [ { $eq: [ '$dcCustomizationAudited', 0] }, 'N/A', { $divide: [ '$dcCustomizationDefects', '$dcCustomizationAudited'] } ] },
					dcClaimsRate: { $cond: [ { $eq: [ '$dcClaimsReceived', 0] }, 'N/A', { $divide: [ '$dcClaimsReturned', '$dcClaimsReceived'] } ] }
				}
			},
			{ //Only Show Percentage
				$project : {
					_id: 0,
					year: '$_id.year',
					month: '$_id.month',
					coalition: '$_id.coalition',
					supplychain: '$_id.supplychain',
					majorDefectsOqlRate: 1,
					packagingOqlRate: 1,
					fitOqlRate: 1,
					majorDefectsSqlRate: 1,
					firstPassRate: 1,
					processAuditScore: 1,
					dcMajorDefectsOqlRate: 1,
					dcPackagingOqlRate: 1,
					dcFitOqlRate: 1,
					dcReworkTotal: 1,
					dcReworkVendorChargeback: 1,
					dcInternalChargebacks: 1,
					dcVasCompliance: 1,
					dcWarrantyClaims: 1,
					dcClaimsRate: 1,
					dcCustomizationRate: 1,
					dcKeyAccountsChargebacks: 1
				}
			}
		)
		.exec(function(err,result){
			res.json(result);
		});
};

/**
 * Counting not good and risk
 */
exports.getCount = function(req, res) {
	console.log('Counting...');

	var match = {};
	if (req.body.year){ match.year = req.body.year; }
	if (req.body.month){ match.month = req.body.month; }
	if (req.body.coalition){ match.coalition = req.body.coalition; }

	Metric
		.aggregate(
			[
				{
					$match: match
				},
				{ //Select fields
					$project : {
						_id: 1,
						year: '$year',
						month: '$month',
						coalition: '$coalition',
						supplychain: '$supplychain',
						majorDefectsOqlAudited: '$metrics.factory.majorDefectsOql.audited',
						majorDefectsOqlDefects: '$metrics.factory.majorDefectsOql.defects',
						packagingOqlAudited: '$metrics.factory.packagingOql.audited',
						packagingOqlDefects: '$metrics.factory.packagingOql.defects',
						fitOqlAudited: '$metrics.factory.fitOql.audited',
						fitOqlDefects: '$metrics.factory.fitOql.defects',
						majorDefectsSqlAudited: '$metrics.factory.majorDefectsSql.audited',
						majorDefectsSqlDefects: '$metrics.factory.majorDefectsSql.defects',
						firstPassAudited: '$metrics.factory.firstPass.audited',
						firstPassPassed: '$metrics.factory.firstPass.passed',
						processAuditScore: '$metrics.factory.processAudit.score',
						dcMajorDefectsOqlAudited: '$metrics.dc.majorDefectsOql.audited',
						dcMajorDefectsOqlDefects: '$metrics.dc.majorDefectsOql.defects',
						dcPackagingOqlAudited: '$metrics.dc.packagingOql.audited',
						dcPackagingOqlDefects: '$metrics.dc.packagingOql.defects',
						dcFitOqlAudited: '$metrics.dc.fitOql.audited',
						dcFitOqlDefects: '$metrics.dc.fitOql.defects',
						dcCustomizationAudited: '$metrics.dc.customization.audited',
						dcCustomizationDefects: '$metrics.dc.customization.defects',
						dcClaimsReceived: '$metrics.dc.claims.received',
						dcClaimsReturned: '$metrics.dc.claims.returned',
						dcReworkTotal: '$metrics.dc.rework.total',
						dcReworkVendorChargeback: '$metrics.dc.rework.vendorChargeback',
						dcInternalChargebacks: '$metrics.dc.internalChargebacks',
						dcWarrantyClaims: '$metrics.dc.warrantyClaims',
						dcVasCompliance: '$metrics.dc.vasCompliance',
						dcKeyAccountsChargebacks: '$metrics.dc.keyAccountsChargebacks'
					}
				},
				{ //Calculations
					$project : {
						_id: 1,
						year: 1,
						month: 1,
						coalition: 1,
						supplychain: 1,
						processAuditScore: 1,
						dcReworkTotal: 1,
						dcReworkVendorChargeback: 1,
						dcWarrantyClaims: 1,
						dcVasCompliance: 1,
						dcKeyAccountsChargebacks: 1,
						majorDefectsOqlRate: {
							$cond: {
								if: { $eq: ['$majorDefectsOqlAudited', 0] },
								then: null,
								else: {$divide: [ '$majorDefectsOqlDefects', '$majorDefectsOqlAudited']}
							}
						},
						packagingOqlRate: {
							$cond: {
								if: { $eq: ['$packagingOqlAudited', 0] },
								then: null,
								else: {$divide: [ '$packagingOqlDefects', '$packagingOqlAudited']}
							}
						},
						fitOqlRate: {
							$cond: {
								if: { $eq: ['$fitOqlAudited', 0] },
								then: null,
								else: {$divide: [ '$fitOqlDefects', '$fitOqlAudited']}
							}
						},
						dcMajorDefectsOqlRate: {
							$cond: {
								if: { $eq: ['$dcMajorDefectsOqlAudited', 0] },
								then: null,
								else: {$divide: [ '$dcMajorDefectsOqlDefects', '$dcMajorDefectsOqlAudited']}
							}
						},
						dcPackagingOqlRate: {
							$cond: {
								if: { $eq: ['$dcPackagingOqlAudited', 0] },
								then: null,
								else: {$divide: [ '$dcPackagingOqlDefects', '$dcPackagingOqlAudited']}
							}
						},
						dcFitOqlRate: {
							$cond: {
								if: { $eq: ['$dcFitOqlAudited', 0] },
								then: null,
								else: {$divide: [ '$dcFitOqlDefects', '$dcFitOqlAudited']}
							}
						},
						majorDefectsSqlRate: {
							$cond: {
								if: { $eq: ['$majorDefectsSqlAudited', 0] },
								then: null,
								else: {$divide: [ '$majorDefectsSqlDefects', '$majorDefectsSqlAudited']}
							}
						},
						firstPassRate: {
							$cond: {
								if: { $ne: ['$firstPassAudited', 0] },
								then: {$divide: [ '$firstPassPassed', '$firstPassAudited']},
								else: null
							}
						},
						dcCustomizationRate: {
							$cond: {
								if: { $eq: ['$dcCustomizationAudited', 0] },
								then: null,
								else: {$divide: [ '$dcCustomizationDefects', '$dcCustomizationAudited']}
							}
						},
						dcClaimsRate: {
							$cond: {
								if: { $eq: ['$dcClaimsReturned', 0] },
								then: null,
								else: {$divide: [ '$dcClaimsReturned', '$dcClaimsReceived']}
							}
						},
						dcInternalChargebacks: {
							$cond: {
								if: { $eq: ['$dcReworkTotal', 0] },
								then: null,
								else: {$subtract: [ '$dcReworkVendorChargeback', '$dcReworkTotal']}
							}
						}
					}
				},
				{ //Conditional checks on previous calculation
					$project : {
						_id: 1,
						year: 1,
						month: 1,
						coalition: 1,
						supplychain: 1,
						majorDefectsOqlRate_notGood:
						{
							$cond: {
								if: { //Jeanswear
									$and: [ {$eq: [ '$coalition', 'Jeanswear' ]}, {$gte: [ '$majorDefectsOqlRate', 0.04]} ]
								},
								then: 1,
								else: {
									$cond: {
										if: { //Imagewear
											$and: [ {$eq: [ '$coalition', 'Imagewear' ]}, {$gte: [ '$majorDefectsOqlRate', 0.03]} ]
										},
										then: 1,
										else: {
											$cond: {
												if: { //outdoor
													$and: [ {$eq: [ '$coalition', 'Outdoor' ]}, {$gte: [ '$majorDefectsOqlRate', 0.02]} ]
												},
												then: 1,
												else: {
 													$cond: {
														if: { //Footwear
															$and: [ {$eq: [ '$coalition', 'Footwear' ]}, {$gte: [ '$majorDefectsOqlRate', 0.02]} ]
														},
														then: 1,
														else: {
															$cond: {
																if: { //Sportswear
																	$and: [ {$eq: [ '$coalition', 'Sportswear' ]}, {$gte: [ '$majorDefectsOqlRate', 0.03]} ]
																},
																then: 1,
																else: {
																	$cond: {
																		if: { //Contemproary
																			$and: [ {$eq: [ '$coalition', 'Contemproary' ]}, {$gte: [ '$majorDefectsOqlRate', 0.03]} ]
																		},
																		then: 1,
																		else: 0
																	} //end of Contemproary $cond
																} //end of Sportswear else
															} //end of Sportswear $cond
														} //end of Footwear else
													} //end of Footwear $cond
												} //end of Outdoor else
											} //end of Outdoor $cond
										} // end of imagewear else
									} // end of imagewear $cond
								} //end of Jeanswear else
							} //end of Jeanswear $cond
						},
						packagingOqlRate_notGood:
						{
							$cond: {
								if: { //Jeanswear
									$and: [ {$eq: [ '$coalition', 'Jeanswear' ]}, {$gte: [ '$packagingOqlRate', 0.005]} ]
								},
								then: 1,
								else: {
									$cond: {
										if: { //Imagewear
											$and: [ {$eq: [ '$coalition', 'Imagewear' ]}, {$gte: [ '$packagingOqlRate', 0.005]} ]
										},
										then: 1,
										else: {
											$cond: {
												if: { //outdoor
													$and: [ {$eq: [ '$coalition', 'Outdoor' ]}, {$gte: [ '$packagingOqlRate', 0.005]} ]
												},
												then: 1,
												else: {
													$cond: {
														if: { //Footwear
															$and: [ {$eq: [ '$coalition', 'Footwear' ]}, {$gte: [ '$packagingOqlRate', 0.005]} ]
														},
														then: 1,
														else: {
															$cond: {
																if: { //Sportswear
																	$and: [ {$eq: [ '$coalition', 'Sportswear' ]}, {$gte: [ '$packagingOqlRate', 0.005]} ]
																},
																then: 1,
																else: {
																	$cond: {
																		if: { //Contemproary
																			$and: [ {$eq: [ '$coalition', 'Contemproary' ]}, {$gte: [ '$packagingOqlRate', 0.005]} ]
																		},
																		then: 1,
																		else: 0
																	} //end of Contemproary $cond
																} //end of Sportswear else
															} //end of Sportswear $cond
														} //end of Footwear else
													} //end of Footwear $cond
												} //end of Outdoor else
											} //end of Outdoor $cond
										} // end of imagewear else
									} // end of imagewear $cond
								} //end of Jeanswear else
							} //end of Jeanswear $cond
						},
						fitOqlRate_notGood:
						{
							$cond: {
								if: { //Jeanswear
									$and: [ {$eq: [ '$coalition', 'Jeanswear' ]}, {$gte: [ '$fitOqlRate', 0.02]} ]
								},
								then: 1,
								else: {
									$cond: {
										if: { //Imagewear
											$and: [ {$eq: [ '$coalition', 'Imagewear' ]}, {$gte: [ '$fitOqlRate', 0.01]} ]
										},
										then: 1,
										else: {
											$cond: {
												if: { //outdoor
													$and: [ {$eq: [ '$coalition', 'Outdoor' ]}, {$gte: [ '$fitOqlRate', 0.01]} ]
												},
												then: 1,
												else: {
													$cond: {
														if: { //Footwear
															$and: [ {$eq: [ '$coalition', 'Footwear' ]}, {$gte: [ '$fitOqlRate', 0]} ]
														},
														then: 1,
														else: {
															$cond: {
																if: { //Sportswear
																	$and: [ {$eq: [ '$coalition', 'Sportswear' ]}, {$gte: [ '$fitOqlRate', 0.01]} ]
																},
																then: 1,
																else: {
																	$cond: {
																		if: { //Contemproary
																			$and: [ {$eq: [ '$coalition', 'Contemproary' ]}, {$gte: [ '$fitOqlRate', 0.01]} ]
																		},
																		then: 1,
																		else: 0
																	} //end of Contemproary $cond
																} //end of Sportswear else
															} //end of Sportswear $cond
														} //end of Footwear else
													} //end of Footwear $cond
												} //end of Outdoor else
											} //end of Outdoor $cond
										} // end of imagewear else
									} // end of imagewear $cond
								} //end of Jeanswear else
							} //end of Jeanswear $cond
						},
						dcMajorDefectsOqlRate_notGood:
						{
							$cond: {
								if: { //Jeanswear
									$and: [ {$eq: [ '$coalition', 'Jeanswear' ]}, {$gte: [ '$dcMajorDefectsOqlRate', 0.04]} ]
								},
								then: 1,
								else: {
									$cond: {
										if: { //Imagewear
											$and: [ {$eq: [ '$coalition', 'Imagewear' ]}, {$gte: [ '$dcMajorDefectsOqlRate', 0.03]} ]
										},
										then: 1,
										else: {
											$cond: {
												if: { //outdoor
													$and: [ {$eq: [ '$coalition', 'Outdoor' ]}, {$gte: [ '$dcMajorDefectsOqlRate', 0.02]} ]
												},
												then: 1,
												else: {
													$cond: {
														if: { //Footwear
															$and: [ {$eq: [ '$coalition', 'Footwear' ]}, {$gte: [ '$dcMajorDefectsOqlRate', 0.02]} ]
														},
														then: 1,
														else: {
															$cond: {
																if: { //Sportswear
																	$and: [ {$eq: [ '$coalition', 'Sportswear' ]}, {$gte: [ '$dcMajorDefectsOqlRate', 0.03]} ]
																},
																then: 1,
																else: {
																	$cond: {
																		if: { //Contemproary
																			$and: [ {$eq: [ '$coalition', 'Contemproary' ]}, {$gte: [ '$dcMajorDefectsOqlRate', 0.03]} ]
																		},
																		then: 1,
																		else: 0
																	} //end of Contemproary $cond
																} //end of Sportswear else
															} //end of Sportswear $cond
														} //end of Footwear else
													} //end of Footwear $cond
												} //end of Outdoor else
											} //end of Outdoor $cond
										} // end of imagewear else
									} // end of imagewear $cond
								} //end of Jeanswear else
							} //end of Jeanswear $cond
						},
						dcPackagingOqlRate_notGood:
						{
							$cond: {
								if: { //Jeanswear
									$and: [ {$eq: [ '$coalition', 'Jeanswear' ]}, {$gte: [ '$dcPackagingOqlRate', 0.005]} ]
								},
								then: 1,
								else: {
									$cond: {
										if: { //Imagewear
											$and: [ {$eq: [ '$coalition', 'Imagewear' ]}, {$gte: [ '$dcPackagingOqlRate', 0.005]} ]
										},
										then: 1,
										else: {
											$cond: {
												if: { //outdoor
													$and: [ {$eq: [ '$coalition', 'Outdoor' ]}, {$gte: [ '$dcPackagingOqlRate', 0.005]} ]
												},
												then: 1,
												else: {
													$cond: {
														if: { //Footwear
															$and: [ {$eq: [ '$coalition', 'Footwear' ]}, {$gte: [ '$dcPackagingOqlRate', 0.005]} ]
														},
														then: 1,
														else: {
															$cond: {
																if: { //Sportswear
																	$and: [ {$eq: [ '$coalition', 'Sportswear' ]}, {$gte: [ '$dcPackagingOqlRate', 0.005]} ]
																},
																then: 1,
																else: {
																	$cond: {
																		if: { //Contemproary
																			$and: [ {$eq: [ '$coalition', 'Contemproary' ]}, {$gte: [ '$dcPackagingOqlRate', 0.005]} ]
																		},
																		then: 1,
																		else: 0
																	} //end of Contemproary $cond
																} //end of Sportswear else
															} //end of Sportswear $cond
														} //end of Footwear else
													} //end of Footwear $cond
												} //end of Outdoor else
											} //end of Outdoor $cond
										} // end of imagewear else
									} // end of imagewear $cond
								} //end of Jeanswear else
							} //end of Jeanswear $cond
						},
						dcFitOqlRate_notGood:
						{
							$cond: {
								if: { //Jeanswear
									$and: [ {$eq: [ '$coalition', 'Jeanswear' ]}, {$gte: [ '$dcFitOqlRate', 0.02]} ]
								},
								then: 1,
								else: {
									$cond: {
										if: { //Imagewear
											$and: [ {$eq: [ '$coalition', 'Imagewear' ]}, {$gte: [ '$dcFitOqlRate', 0.01]} ]
										},
										then: 1,
										else: {
											$cond: {
												if: { //outdoor
													$and: [ {$eq: [ '$coalition', 'Outdoor' ]}, {$gte: [ '$dcFitOqlRate', 0.01]} ]
												},
												then: 1,
												else: {
													$cond: {
														if: { //Footwear
															$and: [ {$eq: [ '$coalition', 'Footwear' ]}, {$gte: [ '$dcFitOqlRate', 0]} ]
														},
														then: 1,
														else: {
															$cond: {
																if: { //Sportswear
																	$and: [ {$eq: [ '$coalition', 'Sportswear' ]}, {$gte: [ '$dcFitOqlRate', 0.01]} ]
																},
																then: 1,
																else: {
																	$cond: {
																		if: { //Contemproary
																			$and: [ {$eq: [ '$coalition', 'Contemproary' ]}, {$gte: [ '$dcFitOqlRate', 0.01]} ]
																		},
																		then: 1,
																		else: 0
																	} //end of Contemproary $cond
																} //end of Sportswear else
															} //end of Sportswear $cond
														} //end of Footwear else
													} //end of Footwear $cond
												} //end of Outdoor else
											} //end of Outdoor $cond
										} // end of imagewear else
									} // end of imagewear $cond
								} //end of Jeanswear else
							} //end of Jeanswear $cond
						},
						majorDefectsSqlRate_notGood:
						{
							$cond: {
								if: { //Jeanswear
									$and: [ {$eq: [ '$coalition', 'Jeanswear' ]}, {$gte: [ '$majorDefectsSqlRate', 0.04]} ]
								},
								then: 1,
								else: {
									$cond: {
										if: { //Imagewear
											$and: [ {$eq: [ '$coalition', 'Imagewear' ]}, {$gte: [ '$majorDefectsSqlRate', 0.03]} ]
										},
										then: 1,
										else: {
											$cond: {
												if: { //outdoor
													$and: [ {$eq: [ '$coalition', 'Outdoor' ]}, {$gte: [ '$majorDefectsSqlRate', 0.02]} ]
												},
												then: 1,
												else: {
													$cond: {
														if: { //Footwear
															$and: [ {$eq: [ '$coalition', 'Footwear' ]}, {$gte: [ '$majorDefectsSqlRate', 0.02]} ]
														},
														then: 1,
														else: {
															$cond: {
																if: { //Sportswear
																	$and: [ {$eq: [ '$coalition', 'Sportswear' ]}, {$gte: [ '$majorDefectsSqlRate', 0.03]} ]
																},
																then: 1,
																else: {
																	$cond: {
																		if: { //Contemproary
																			$and: [ {$eq: [ '$coalition', 'Contemproary' ]}, {$gte: [ '$majorDefectsSqlRate', 0.03]} ]
																		},
																		then: 1,
																		else: 0
																	} //end of Contemproary $cond
																} //end of Sportswear else
															} //end of Sportswear $cond
														} //end of Footwear else
													} //end of Footwear $cond
												} //end of Outdoor else
											} //end of Outdoor $cond
										} // end of imagewear else
									} // end of imagewear $cond
								} //end of Jeanswear else
							} //end of Jeanswear $cond
						},
						firstPassRate_notGood:
						{
							$cond: {
								if: {
									$and: [
										{$ne: ['$firstPassRate', null ]},
										{$lt: ['$firstPassRate', 0.95 ]}
									]
								},
								then: 1,
								else: 0
							}
						},
						processAuditScore_notGood:
						{
							$cond: { if: { $lte: [ '$processAuditScore', 0.85 ] }, then: 1, else: 0 }
						},
						dcCustomizationRate_notGood:
						{
							$cond: { if: { $gte: [ '$dcCustomizationRate', 0.005 ] }, then: 1, else: 0 }
						},
						dcClaimsRate_notGood:
						{
							$cond: { if: { $gte: [ '$dcClaimsRate', 1 ] }, then: 1, else: 0 }
						},
						dcReworkTotal_notGood:
						{
							$cond: { if: { $gte: [ '$dcReworkTotal', 0 ] }, then: 0, else: 0 }
						},
						dcInternalChargebacks_notGood:
						{
							$cond: { if: { $gte: [ '$dcInternalChargebacks', 0 ] }, then: 0, else: 0 }
						},
						dcWarrantyClaims_notGood:
						{
							$cond: { if: { $gte: [ '$dcWarrantyClaims', 0 ] }, then: 0, else: 0 }
						},
						dcVasCompliance_notGood:
						{
							$cond: { if: { $gte: [ '$dcVasCompliance', 0 ] }, then: 0, else: 0 }
						},
						dcKeyAccountsChargebacks_notGood:
						{
							$cond: { if: { $gte: [ '$dcKeyAccountsChargebacks', 0 ] }, then: 0, else: 0 }
						},
						majorDefectsOqlRate_risk:
						{
							$cond: {
								if: { //Jeanswear
									$and: [ {$eq: [ '$coalition', 'Jeanswear' ]}, {$gt: [ '$majorDefectsOqlRate', 0.06]} ]
								},
								then: 1,
								else: {
									$cond: {
										if: { //Imagewear
											$and: [ {$eq: [ '$coalition', 'Imagewear' ]}, {$gt: [ '$majorDefectsOqlRate', 0.05]} ]
										},
										then: 1,
										else: {
											$cond: {
												if: { //outdoor
													$and: [ {$eq: [ '$coalition', 'Outdoor' ]}, {$gt: [ '$majorDefectsOqlRate', 0.03]} ]
												},
												then: 1,
												else: {
													$cond: {
														if: { //Footwear
															$and: [ {$eq: [ '$coalition', 'Footwear' ]}, {$gt: [ '$majorDefectsOqlRate', 0.03]} ]
														},
														then: 1,
														else: {
															$cond: {
																if: { //Sportswear
																	$and: [ {$eq: [ '$coalition', 'Sportswear' ]}, {$gt: [ '$majorDefectsOqlRate', 0.06]} ]
																},
																then: 1,
																else: {
																	$cond: {
																		if: { //Contemproary
																			$and: [ {$eq: [ '$coalition', 'Contemproary' ]}, {$gt: [ '$majorDefectsOqlRate', 0.06]} ]
																		},
																		then: 1,
																		else: 0
																	} //end of Contemproary $cond
																} //end of Sportswear else
															} //end of Sportswear $cond
														} //end of Footwear else
													} //end of Footwear $cond
												} //end of Outdoor else
											} //end of Outdoor $cond
										} // end of imagewear else
									} // end of imagewear $cond
								} //end of Jeanswear else
							} //end of Jeanswear $cond
						},
						packagingOqlRate_risk:
						{
							$cond: { if: { $gt: [ '$packagingOqlRate', 0.01 ] }, then: 1, else: 0 }
						},
						fitOqlRate_risk:
						{
							$cond: {
								if: { //Jeanswear
									$and: [ {$eq: [ '$coalition', 'Jeanswear' ]}, {$gt: [ '$fitOqlRate', 0.03]} ]
								},
								then: 1,
								else: {
									$cond: {
										if: { //Imagewear
											$and: [ {$eq: [ '$coalition', 'Imagewear' ]}, {$gt: [ '$fitOqlRate', 0.02]} ]
										},
										then: 1,
										else: {
											$cond: {
												if: { //outdoor
													$and: [ {$eq: [ '$coalition', 'Outdoor' ]}, {$gt: [ '$fitOqlRate', 0.02]} ]
												},
												then: 1,
												else: {
													$cond: {
														if: { //Footwear
															$and: [ {$eq: [ '$coalition', 'Footwear' ]}, {$gt: [ '$fitOqlRate', 0]} ]
														},
														then: 1,
														else: {
															$cond: {
																if: { //Sportswear
																	$and: [ {$eq: [ '$coalition', 'Sportswear' ]}, {$gt: [ '$fitOqlRate', 0.02]} ]
																},
																then: 1,
																else: {
																	$cond: {
																		if: { //Contemproary
																			$and: [ {$eq: [ '$coalition', 'Contemproary' ]}, {$gt: [ '$fitOqlRate', 0.02]} ]
																		},
																		then: 1,
																		else: 0
																	} //end of Contemproary $cond
																} //end of Sportswear else
															} //end of Sportswear $cond
														} //end of Footwear else
													} //end of Footwear $cond
												} //end of Outdoor else
											} //end of Outdoor $cond
										} // end of imagewear else
									} // end of imagewear $cond
								} //end of Jeanswear else
							} //end of Jeanswear $cond
						},
						dcMajorDefectsOqlRate_risk:
						{
							$cond: {
								if: { //Jeanswear
									$and: [ {$eq: [ '$coalition', 'Jeanswear' ]}, {$gte: [ '$dcMajorDefectsOqlRate', 0.06]} ]
								},
								then: 1,
								else: {
									$cond: {
										if: { //Imagewear
											$and: [ {$eq: [ '$coalition', 'Imagewear' ]}, {$gte: [ '$dcMajorDefectsOqlRate', 0.05]} ]
										},
										then: 1,
										else: {
											$cond: {
												if: { //outdoor
													$and: [ {$eq: [ '$coalition', 'Outdoor' ]}, {$gte: [ '$dcMajorDefectsOqlRate', 0.03]} ]
												},
												then: 1,
												else: {
													$cond: {
														if: { //Footwear
															$and: [ {$eq: [ '$coalition', 'Footwear' ]}, {$gte: [ '$dcMajorDefectsOqlRate', 0.03]} ]
														},
														then: 1,
														else: {
															$cond: {
																if: { //Sportswear
																	$and: [ {$eq: [ '$coalition', 'Sportswear' ]}, {$gte: [ '$dcMajorDefectsOqlRate', 0.06]} ]
																},
																then: 1,
																else: {
																	$cond: {
																		if: { //Contemproary
																			$and: [ {$eq: [ '$coalition', 'Contemproary' ]}, {$gte: [ '$dcMajorDefectsOqlRate', 0.06]} ]
																		},
																		then: 1,
																		else: 0
																	} //end of Contemproary $cond
																} //end of Sportswear else
															} //end of Sportswear $cond
														} //end of Footwear else
													} //end of Footwear $cond
												} //end of Outdoor else
											} //end of Outdoor $cond
										} // end of imagewear else
									} // end of imagewear $cond
								} //end of Jeanswear else
							} //end of Jeanswear $cond
						},
						dcPackagingOqlRate_risk:
						{
							$cond: { if: { $gt: [ '$dcPackagingOqlRate', 0.01 ] }, then: 1, else: 0 }
						},
						dcFitOqlRate_risk:
						{
							$cond: {
								if: { //Jeanswear
									$and: [ {$eq: [ '$coalition', 'Jeanswear' ]}, {$gt: [ '$dcFitOqlRate', 0.03]} ]
								},
								then: 1,
								else: {
									$cond: {
										if: { //Imagewear
											$and: [ {$eq: [ '$coalition', 'Imagewear' ]}, {$gt: [ '$dcFitOqlRate', 0.02]} ]
										},
										then: 1,
										else: {
											$cond: {
												if: { //outdoor
													$and: [ {$eq: [ '$coalition', 'Outdoor' ]}, {$gt: [ '$dcFitOqlRate', 0.02]} ]
												},
												then: 1,
												else: {
													$cond: {
														if: { //Footwear
															$and: [ {$eq: [ '$coalition', 'Footwear' ]}, {$gt: [ '$dcFitOqlRate', 0]} ]
														},
														then: 1,
														else: {
															$cond: {
																if: { //Sportswear
																	$and: [ {$eq: [ '$coalition', 'Sportswear' ]}, {$gt: [ '$dcFitOqlRate', 0.02]} ]
																},
																then: 1,
																else: {
																	$cond: {
																		if: { //Contemproary
																			$and: [ {$eq: [ '$coalition', 'Contemproary' ]}, {$gt: [ '$dcFitOqlRate', 0.02]} ]
																		},
																		then: 1,
																		else: 0
																	} //end of Contemproary $cond
																} //end of Sportswear else
															} //end of Sportswear $cond
														} //end of Footwear else
													} //end of Footwear $cond
												} //end of Outdoor else
											} //end of Outdoor $cond
										} // end of imagewear else
									} // end of imagewear $cond
								} //end of Jeanswear else
							} //end of Jeanswear $cond
						},
						majorDefectsSqlRate_risk:
						{
							$cond: {
								if: { //Jeanswear
									$and: [ {$eq: [ '$coalition', 'Jeanswear' ]}, {$gt: [ '$majorDefectsSqlRate', 0.06]} ]
								},
								then: 1,
								else: {
									$cond: {
										if: { //Imagewear
											$and: [ {$eq: [ '$coalition', 'Imagewear' ]}, {$gt: [ '$majorDefectsSqlRate', 0.05]} ]
										},
										then: 1,
										else: {
											$cond: {
												if: { //outdoor
													$and: [ {$eq: [ '$coalition', 'Outdoor' ]}, {$gt: [ '$majorDefectsSqlRate', 0.03]} ]
												},
												then: 1,
												else: {
													$cond: {
														if: { //Footwear
															$and: [ {$eq: [ '$coalition', 'Footwear' ]}, {$gt: [ '$majorDefectsSqlRate', 0.03]} ]
														},
														then: 1,
														else: {
															$cond: {
																if: { //Sportswear
																	$and: [ {$eq: [ '$coalition', 'Sportswear' ]}, {$gt: [ '$majorDefectsSqlRate', 0.06]} ]
																},
																then: 1,
																else: {
																	$cond: {
																		if: { //Contemproary
																			$and: [ {$eq: [ '$coalition', 'Contemproary' ]}, {$gt: [ '$majorDefectsSqlRate', 0.06]} ]
																		},
																		then: 1,
																		else: 0
																	} //end of Contemproary $cond
																} //end of Sportswear else
															} //end of Sportswear $cond
														} //end of Footwear else
													} //end of Footwear $cond
												} //end of Outdoor else
											} //end of Outdoor $cond
										} // end of imagewear else
									} // end of imagewear $cond
								} //end of Jeanswear else
							} //end of Jeanswear $cond
						},
						firstPassRate_risk:
						{
							$cond: {
								if: {
									$and: [
										{$ne: ['$firstPassRate', null ]},
										{$lte: ['$firstPassRate', 0.89 ]}
									]
								},
								then: 1,
								else: 0
							}
						},
						processAuditScore_risk:
						{
							$cond: { if: { $lte: [ '$processAuditScore', 0.69 ] }, then: 1, else: 0 }
						},
						dcCustomizationRate_risk:
						{
							$cond: { if: { $gte: [ '$dcCustomizationRate', 0.01 ] }, then: 1, else: 0 }
						},
						dcClaimsRate_risk:
						{
							$cond: { if: { $gte: [ '$dcClaimsRate', 1 ] }, then: 1, else: 0 }
						}
					}
				},
				{ //Group by year, month, coalition and supplychain
					$group : {
						_id: { year: '$year', month: '$month', coalition: '$coalition', supplychain: '$supplychain'},
						majorDefectsOqlRate_countNotGood: {
							$sum: {
								$cond: {
									if: { $eq: [ '$majorDefectsOqlRate_notGood', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countNotGood
						packagingOqlRate_countNotGood: {
							$sum: {
								$cond: {
									if: { $eq: [ '$packagingOqlRate_notGood', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countNotGood
						fitOqlRate_countNotGood: {
							$sum: {
								$cond: {
									if: { $eq: [ '$fitOqlRate_notGood', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countNotGood
						dcMajorDefectsOqlRate_countNotGood: {
							$sum: {
								$cond: {
									if: { $eq: [ '$dcMajorDefectsOqlRate_notGood', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countNotGood
						dcPackagingOqlRate_countNotGood: {
							$sum: {
								$cond: {
									if: { $eq: [ '$dcPackagingOqlRate_notGood', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countNotGood
						dcFitOqlRate_countNotGood: {
							$sum: {
								$cond: {
									if: { $eq: [ '$dcFitOqlRate_notGood', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countNotGood
						majorDefectsSqlRate_countNotGood: {
							$sum: {
								$cond: {
									if: { $eq: [ '$majorDefectsSqlRate_notGood', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countNotGood
						firstPassRate_countNotGood: {
							$sum: {
								$cond: {
									if: { $eq: [ '$firstPassRate_notGood', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countNotGood
						processAuditScore_countNotGood: {
							$sum: {
								$cond: {
									if: { $eq: [ '$processAuditScore_notGood', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countNotGood
						dcCustomizationRate_countNotGood: {
							$sum: {
								$cond: {
									if: { $eq: [ '$dcCustomizationRate_notGood', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countNotGood
						dcClaimsRate_countNotGood: {
							$sum: {
								$cond: {
									if: { $eq: [ '$dcClaimsRate_notGood', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countNotGood
						dcReworkTotal_countNotGood: {
							$sum: {
								$cond: {
									if: { $eq: [ '$dcReworkTotal_notGood', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countNotGood
						dcWarrantyClaims_countNotGood: {
							$sum: {
								$cond: {
									if: { $eq: [ '$dcWarrantyClaims_notGood', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countNotGood
						dcInternalChargebacks_countNotGood: {
							$sum: {
								$cond: {
									if: { $eq: [ '$dcInternalChargebacks_notGood', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countNotGood
						dcVasCompliance_countNotGood: {
							$sum: {
								$cond: {
									if: { $eq: [ '$dcVasCompliance_notGood', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countNotGood
						dcKeyAccountsChargebacks_countNotGood: {
							$sum: {
								$cond: {
									if: { $eq: [ '$dcKeyAccountsChargebacks_notGood', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countNotGood
						majorDefectsOqlRate_countRisk: {
							$sum: {
								$cond: {
									if: { $eq: [ '$majorDefectsOqlRate_risk', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countRisk
						packagingOqlRate_countRisk: {
							$sum: {
								$cond: {
									if: { $eq: [ '$packagingOqlRate_risk', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countRisk
						fitOqlRate_countRisk: {
							$sum: {
								$cond: {
									if: { $eq: [ '$fitOqlRate_risk', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countRisk
						dcMajorDefectsOqlRate_countRisk: {
							$sum: {
								$cond: {
									if: { $eq: [ '$dcMajorDefectsOqlRate_risk', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countRisk
						dcPackagingOqlRate_countRisk: {
							$sum: {
								$cond: {
									if: { $eq: [ '$dcPackagingOqlRate_risk', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countRisk
						dcFitOqlRate_countRisk: {
							$sum: {
								$cond: {
									if: { $eq: [ '$dcFitOqlRate_risk', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countRisk
						majorDefectsSqlRate_countRisk: {
							$sum: {
								$cond: {
									if: { $eq: [ '$majorDefectsSqlRate_risk', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countRisk
						firstPassRate_countRisk: {
							$sum: {
								$cond: {
									if: { $eq: [ '$firstPassRate_risk', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countRisk
						processAuditScore_countRisk: {
							$sum: {
								$cond: {
									if: { $eq: [ '$processAuditScore_risk', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countRisk
						dcCustomizationRate_countRisk: {
							$sum: {
								$cond: {
									if: { $eq: [ '$dcCustomizationRate_risk', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countRisk
						dcClaimsRate_countRisk: {
							$sum: {
								$cond: {
									if: { $eq: [ '$dcClaimsRate_risk', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countRisk
						dcReworkTotal_countRisk: {
							$sum: {
								$cond: {
									if: { $eq: [ '$dcReworkTotal_risk', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countRisk
						dcWarrantyClaims_countRisk: {
							$sum: {
								$cond: {
									if: { $eq: [ '$dcWarrantyClaims_risk', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countRisk
						dcInternalChargebacks_countRisk: {
							$sum: {
								$cond: {
									if: { $eq: [ '$dcInternalChargebacks_risk', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countRisk
						dcVasCompliance_countRisk: {
							$sum: {
								$cond: {
									if: { $eq: [ '$dcVasCompliance_risk', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						}, //end of countRisk
						dcKeyAccountsChargebacks_countRisk: {
							$sum: {
								$cond: {
									if: { $eq: [ '$dcKeyAccountsChargebacks_risk', 1] },
									then: 1,
									else: 0
								} //end of cond
							} //end of sum
						} //end of countRisk
					} //end of Group
				},
				{ //flatten
					$project : {
						_id: 0,
						year: '$_id.year',
						month: '$_id.month',
						coalition: '$_id.coalition',
						supplychain: '$_id.supplychain',
						majorDefectsOqlRate_countNotGood: 1,
						packagingOqlRate_countNotGood: 1,
						fitOqlRate_countNotGood: 1,
						dcMajorDefectsOqlRate_countNotGood: 1,
						dcPackagingOqlRate_countNotGood: 1,
						dcFitOqlRate_countNotGood: 1,
						majorDefectsSqlRate_countNotGood: 1,
						firstPassRate_countNotGood: 1,
						processAuditScore_countNotGood: 1,
						dcCustomizationRate_countNotGood: 1,
						dcClaimsRate_countNotGood: 1,
						dcReworkTotal_countNotGood: 1,
						dcInternalChargebacks_countNotGood: 1,
						dcWarrantyClaims_countNotGood: 1,
						dcVasCompliance_countNotGood: 1,
						dcKeyAccountsChargebacks_countNotGood: 1,
						majorDefectsOqlRate_countRisk: 1,
						packagingOqlRate_countRisk: 1,
						fitOqlRate_countRisk: 1,
						dcMajorDefectsOqlRate_countRisk: 1,
						dcPackagingOqlRate_countRisk: 1,
						dcFitOqlRate_countRisk: 1,
						majorDefectsSqlRate_countRisk: 1,
						firstPassRate_countRisk: 1,
						processAuditScore_countRisk: 1,
						dcCustomizationRate_countRisk: 1,
						dcClaimsRate_countRisk: 1,
						dcReworkTotal_countRisk: 1,
						dcInternalChargebacks_countRisk: 1,
						dcWarrantyClaims_countRisk: 1,
						dcVasCompliance_countRisk: 1,
						dcKeyAccountsChargebacks_countRisk: 1,
					}
				}
    	]
		)
		.exec(function(err,result){
			res.json(result);
		});
};

/**
 * Query the raw data from report view
 */
exports.drilldown = function(req, res){
	console.log('Querying...');

	var match = {
		year: req.body.year,
		month: req.body.month,
		coalition: req.body.coalition,
		supplychain: req.body.supplychain
	};

	Metric
		.aggregate([
			{
				$match: match
			},
			{
				$project: {
					_id: 1,
					factoryname: '$factoryname',
					year: '$year',
					month: '$month',
					coalition: '$coalition',
					supplychain: '$supplychain',
					brand: '$brand',
					majorDefectsOqlAudited: '$metrics.factory.majorDefectsOql.audited',
					majorDefectsOqlDefects: '$metrics.factory.majorDefectsOql.defects',
					packagingOqlAudited: '$metrics.factory.packagingOql.audited',
					packagingOqlDefects: '$metrics.factory.packagingOql.defects',
					fitOqlAudited: '$metrics.factory.fitOql.audited',
					fitOqlDefects: '$metrics.factory.fitOql.defects',
					majorDefectsSqlAudited: '$metrics.factory.majorDefectsSql.audited',
					majorDefectsSqlDefects: '$metrics.factory.majorDefectsSql.defects',
					firstPassAudited: '$metrics.factory.firstPass.audited',
					firstPassPassed: '$metrics.factory.firstPass.passed',
					processAuditScore: '$metrics.factory.processAudit.score',
					processAuditDate: '$metrics.factory.processAudit.date',
					dcMajorDefectsOqlAudited: '$metrics.dc.majorDefectsOql.audited',
					dcMajorDefectsOqlDefects: '$metrics.dc.majorDefectsOql.defects',
					dcPackagingOqlAudited: '$metrics.dc.packagingOql.audited',
					dcPackagingOqlDefects: '$metrics.dc.packagingOql.defects',
					dcFitOqlAudited: '$metrics.dc.fitOql.audited',
					dcFitOqlDefects: '$metrics.dc.fitOql.defects',
					dcCustomizationAudited: '$metrics.dc.customization.audited',
					dcCustomizationDefects: '$metrics.dc.customization.defects',
					dcReworkTotal: '$metrics.dc.rework.total',
					dcReworkVendorChargeback: '$metrics.dc.rework.vendorChargeback',
					dcInternalChargebacks: '$metrics.dc.internalChargebacks',
					dcVasCompliance: '$metrics.dc.vasCompliance',
					dcWarrantyClaims: '$metrics.dc.warrantyClaims',
					dcClaimsReceived: '$metrics.dc.claims.received',
					dcClaimsReturned: '$metrics.dc.claims.returned',
					dcKeyAccountsChargebacks: '$metrics.dc.keyAccountsChargebacks'
				}
			},
			{
				$group: {
					_id : {factoryname: '$factoryname', year: '$year', month: '$month', coalition: '$coalition', supplychain: '$supplychain', brand: '$brand'},
					majorDefectsOqlAudited : {$sum: '$majorDefectsOqlAudited'},
					majorDefectsOqlDefects : {$sum: '$majorDefectsOqlDefects'},
					packagingOqlAudited : {$sum: '$packagingOqlAudited'},
					packagingOqlDefects : {$sum: '$packagingOqlDefects'},
					fitOqlAudited : {$sum: '$fitOqlAudited'},
					fitOqlDefects : {$sum: '$fitOqlDefects'},
					majorDefectsSqlAudited : {$sum: '$majorDefectsSqlAudited'},
					majorDefectsSqlDefects : {$sum: '$majorDefectsSqlDefects'},
					firstPassAudited : {$sum: '$firstPassAudited'},
					firstPassPassed : {$sum: '$firstPassPassed'},
					processAuditScore: {$first: '$processAuditScore'},
					processAuditDate: {$first: '$processAuditDate'},
					dcMajorDefectsOqlAudited: {$sum: '$dcMajorDefectsOqlAudited'},
					dcMajorDefectsOqlDefects: {$sum: '$dcMajorDefectsOqlDefects'},
					dcPackagingOqlAudited: {$sum: '$dcPackagingOqlAudited'},
					dcPackagingOqlDefects: {$sum: '$dcPackagingOqlDefects'},
					dcFitOqlAudited: {$sum: '$dcFitOqlAudited'},
					dcFitOqlDefects: {$sum: '$dcFitOqlDefects'},
					dcCustomizationAudited: {$sum: '$dcCustomizationAudited'},
					dcCustomizationDefects: {$sum: '$dcCustomizationDefects'},
					dcReworkTotal: {$sum: '$dcReworkTotal'},
					dcReworkVendorChargeback: {$sum: '$dcReworkVendorChargeback'},
					dcInternalChargebacks: {$sum: '$dcInternalChargebacks'},
					dcVasCompliance: {$sum: '$dcVasCompliance'},
					dcWarrantyClaims: {$sum: '$dcWarrantyClaims'},
					dcClaimsReceived: {$sum: '$dcClaimsReceived'},
					dcClaimsReturned: {$sum: '$dcClaimsReturned'},
					dcKeyAccountsChargebacks: {$sum: '$dcKeyAccountsChargebacks'}
				}
			},
			{
				$project: {
					_id: 0,
					factoryname: '$_id.factoryname',
					year: '$_id.year',
					month: '$_id.month',
					coalition: '$_id.coalition',
					supplychain: '$_id.supplychain',
					brand: '$_id.brand',
					metrics: {
						factory: {
							majorDefectsOql: { audited: '$majorDefectsOqlAudited', defects: '$majorDefectsOqlDefects', val: { $cond: [ { $eq: [ '$majorDefectsOqlAudited', 0] }, 'N/A', { $divide: [ '$majorDefectsOqlDefects', '$majorDefectsOqlAudited' ] } ] } },
							packagingOql: { audited: '$packagingOqlAudited', defects: '$packagingOqlDefects', val: { $cond: [ { $eq: [ '$packagingOqlAudited', 0] }, 'N/A', { $divide: [ '$packagingOqlDefects', '$packagingOqlAudited' ] } ] } },
							fitOql: { audited: '$fitOqlAudited', defects: '$fitOqlDefects', val: { $cond: [ { $eq: [ '$fitOqlAudited', 0] }, 'N/A', { $divide: [ '$fitOqlDefects', '$fitOqlAudited' ] } ] } },
							majorDefectsSql: { audited: '$majorDefectsSqlAudited', defects: '$majorDefectsSqlDefects', val: { $cond: [ { $eq: [ '$majorDefectsSqlAudited', 0] }, 'N/A', { $divide: [ '$majorDefectsSqlDefects', '$majorDefectsSqlAudited' ] } ] } },
							firstPass: { audited: '$firstPassAudited', passed: '$firstPassPassed', val: { $cond: [ { $eq: [ '$firstPassAudited', 0] }, 'N/A', { $divide: [ '$firstPassPassed', '$firstPassAudited' ] } ] } },
							processAudit: { score: '$processAuditScore', date: '$processAuditDate'}
						},
						dc: {
							majorDefectsOql : { audited: '$dcMajorDefectsOqlAudited', defects: '$dcMajorDefectsOqlDefects', val: { $cond: [ { $eq: [ '$dcMajorDefectsOqlAudited', 0] }, 'N/A', { $divide: [ '$dcMajorDefectsOqlDefects', '$dcMajorDefectsOqlAudited' ] } ] } },
							packagingOql: { audited: '$dcPackagingOqlAudited', defects: '$dcPackagingOqlDefects', val: { $cond: [ { $eq: [ '$dcPackagingOqlAudited', 0] }, 'N/A', { $divide: [ '$dcPackagingOqlDefects', '$dcPackagingOqlAudited' ] } ] } },
							fitOql: { audited: '$dcFitOqlAudited', defects: '$dcFitOqlDefects', val: { $cond: [ { $eq: [ '$dcFitOqlAudited', 0] }, 'N/A', { $divide: [ '$dcFitOqlDefects', '$dcFitOqlAudited' ] } ] } },
							customization: { audited: '$dcCustomizationAudited', defects: '$dcCustomizationDefects', val: { $cond: [ { $eq: [ '$dcCustomizationAudited', 0] }, 'N/A', { $divide: [ '$dcCustomizationDefects', '$dcCustomizationAudited' ] } ] } },
							rework: { total: '$dcReworkTotal', vendorChargeback: '$dcReworkVendorChargeback', internalChargebacks: { $cond: [ { $eq: [ '$dcReworkTotal', 0] }, 0, { $subtract: [ '$dcReworkTotal', '$dcReworkVendorChargeback' ] } ] } },
							vasCompliance: '$dcVasCompliance',
							warrantyClaims: '$dcWarrantyClaims',
							claims: { received: '$dcClaimsReceived', returned: '$dcClaimsReturned', val: { $cond: [ { $eq: [ '$dcClaimsReceived', 0] }, 'N/A', { $divide: [ '$dcClaimsReturned', '$dcClaimsReceived' ] } ] } },
							keyAccountsChargebacks: '$dcKeyAccountsChargebacks'
						}
					}
				}
			}
		])
		.exec(function(err, result){
			if(err){throw err;}
			res.json(result);
			console.log(result);
		});
};

/**
 * Show the current Metric entry
 */
exports.read = function(req, res) {
		var id = req.params.id;
		console.log(id);
		Metric.findOne({_id: id}, function(err, docs){
			res.json(docs);
		});
};

/**
 * Update an entry
 */
exports.update = function(req, res) {
	var id = req.params.id;
  var update = {
    $set: {
			ffc: req.body.ffc,
      factoryname: req.body.factoryname,
      coalition: req.body.coalition,
      supplychain: req.body.supplychain,
      brand: req.body.brand,
      year: req.body.year,
      month: req.body.month,
			metrics: req.body.metrics
    }
  };
  var callback = function(err, doc){
		if (err) { console.log(err); }
    res.json(doc); //updated object
  };

  console.log('Record of id: ' + id + ' has been updated.');
  Metric.findByIdAndUpdate(id, update, callback);
};

/**
 * Delete an entry
 */
exports.delete = function(req, res) {
	var id = req.params.id;
  console.log(id);
  Metric.remove({_id: id}, function(err, docs){
    res.json(docs);
  });
};

/**
 * List of Metrics
 */
exports.list = function(req, res) {
	Metric.find().sort('-created').populate('user', 'displayName').exec(function(err, metrics) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			//Find All
			Metric.find(function(err, docs){
				if(err) return console.err(err);
				res.json(docs);
			});
		}
	});
};

/**
 * Customer middleware
 */
exports.metricByID = function(req, res, next, id) {
	Metric.findById(id).populate('user', 'displayName').exec(function(err, metric) {
		if (err) return next(err);
		if (! metric) return next(new Error('Failed to load Metric ' + id));
		req.metric = metric ;
		next();
	});
};

/**
 * Customer authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.customer.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
