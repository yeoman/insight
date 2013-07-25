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

describe('providers', function() {
	var pkg = 'yeoman',
		ver = '0.0.0',
		code = 'GA-1234567-1',
		ts = Date.UTC(2013, 7, 24, 22, 33, 44),
		path = '/test/path';

	describe('Google Analytics', function() {
		var insight = new Insight({
			trackingCode: code,
			packageName: pkg,
			packageVersion: ver
		});

		it('should form valid request', function() {
			var req = insight.getRequest(ts, path),
				qs = req.qs;

			assert.equal(qs.tid, code);
			assert.equal(qs.cid, insight.clientId);
			assert.equal(qs.an, pkg);
			assert.equal(qs.av, ver);
			assert.equal(qs.dp, path);
		});
	});

	describe('Yandex.Metrica', function() {
		var insight = new Insight({
			trackingCode: code,
			trackingProvider: 'yandex',
			packageName: pkg,
			packageVersion: ver
		});

		it('should form valid request', function() {
			var req = insight.getRequest(ts, path),
				qs = req.qs,
				cookie = req.jar.cookies[0];

			assert.equal(qs['page-url'], 'http://' + pkg + '.insight/test/path?version=' + ver);
			assert.equal(qs['browser-info'], 'i:20130824223344:z:0:t:' + path);
			assert.equal(cookie.name, 'yandexuid');
			assert.equal(cookie.value, insight.clientId);
		});
	});
});
