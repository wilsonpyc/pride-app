'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Metrics Schema
 */
var MetricSchema = new Schema({
	ffc: {
		type: Number,
		default: '',
		trim: true
	},
	factoryname: {
		type: String,
		default: '',
		trim: true
	},
	coalition: {
		type: String,
		default: '',
		trim: true
	},
	supplychain: {
		type: String,
		default: '',
		trim: true
	},
	brand: {
		type: String,
    default: '',
    trim: true
	},
	productcategory: {
		type: String,
    default: '',
    trim: true
	},
	region: {
		type: String,
    default: '',
    trim: true
	},
	year: {
		type: Number,
		default: '',
		trim: true
	},
	month: {
		type: String,
		default: '',
		trim: true
	},
	metrics: {
		factory: {
			majorDefectsOql: { audited: {type: Number, min: 0}, defects: {type: Number, min: 0} },
			packagingOql: { audited: {type: Number, min: 0}, defects: {type: Number, min: 0} },
			fitOql: { audited: {type: Number, min: 0}, defects: {type: Number, min: 0} },
			majorDefectsSql: { audited: {type: Number, min: 0}, defects: {type: Number, min: 0} },
			firstPass: { audited: {type: Number, min: 0}, passed: {type: Number, min: 0} },
			processAudit: { score: Number, date: Date }
		},
		dc: {
			majorDefectsOql: { audited: {type: Number, min: 0}, defects: {type: Number, min: 0} },
			packagingOql: { audited: {type: Number, min: 0}, defects: {type: Number, min: 0} },
			fitOql: { audited: {type: Number, min: 0}, defects: {type: Number, min: 0} },
			customization: { audited: {type: Number, min: 0}, defects: {type: Number, min: 0} },
			rework: { total: {type: Number, min: 0}, vendorChargeback: {type: Number, min: 0} },
			internalChargebacks: Number,
			vasCompliance: Number,
			warrantyClaims: Number,
			claims: { received: {type: Number, min: 0}, returned: {type: Number, min: 0} },
			keyAccountsChargebacks: Number
		}
	},
	created: {
		type: Date,
		default: Date.now
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	}
});

mongoose.model('Metric', MetricSchema);
