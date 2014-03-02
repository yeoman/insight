/*global describe, it, beforeEach */
'use strict';
var assert = require('assert');
var sinon = require('sinon');
var Insight = require('../lib/insight');
var spawn = require('child_process').spawn;

var values = function (obj) {
    return Object.keys(obj).map(function (el) {
        return obj[el];
    });
}

describe('Insight()', function() {
	var insight = new Insight({
		trackingCode: 'xxx',
		packageName: 'yeoman',
		packageVersion: '0.0.0'
	});

	it('should put tracked path in queue', function(cb) {
		Insight.prototype._save = function() {
			assert.equal('/test', values(this._queue)[0]);
			cb();
		};
		insight.track('test');
	});

	it('should throw exception when trackingCode or packageName is not provided', function(cb) {
		assert.throws(function() {
			var insight = new Insight({});
		}, Error);

		assert.throws(function() {
			var insight = new Insight({ trackingCode: 'xxx' });
		}, Error);

		assert.throws(function() {
			var insight = new Insight({ packageName: 'xxx' });
		}, Error);

		cb();
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

describe('config providers', function () {
	beforeEach(function () {
		var pkg = 'yeoman';
		var ver = '0.0.0';

		this.config = {
			get: sinon.spy(function () { return true; }),
			set: sinon.spy()
		};

		this.insight = new Insight({
			trackingCode: 'xxx',
			packageName: pkg,
			packageVersion: ver,
			config: this.config
		});
	});

	it('should access the config object for reading', function () {
		assert(this.insight.optOut);
		assert(this.config.get.called);
	});

	it('should access the config object for writing', function () {
		var sentinel = {};
		this.insight.optOut = sentinel;
		assert(this.config.set.calledWith('optOut', sentinel));
	});
});

describe('askPermission', function () {
	it('should skip in TTY mode', function (done) {
		var insProcess = spawn('node', [
			'./test/fixtures/sub-process.js'
		]);
		insProcess.on('close', function (code) {
			assert.equal(code, 145);
			done();
		});
	});
});
