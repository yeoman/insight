/*global describe, it */
'use strict';
var assert = require('assert');
var Insight = require('../lib/insight');
var _ = require('lodash');

describe('Insight()', function() {
	var insight = new Insight({
		trackingCode: '',
		packageName: 'yeoman',
		packageVersion: '0.0.0'
	});

	it('should put tracked path in queue', function(cb) {
		Insight.prototype._save = function() {
			assert.equal('/test', _.values(this._queue)[0]);
			cb();
		};
		insight.track('test');
	});
});
