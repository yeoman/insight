/* eslint-env mocha */
'use strict';
var assert = require('assert');
var qs = require('querystring');
var spawn = require('child_process').spawn;
var spawnPty = require('child_pty').spawn;
var osName = require('os-name');
var sinon = require('sinon');
var stripAnsi = require('strip-ansi');
var objectValues = require('object-values');
var Insight = require('../lib');

describe('Insight()', function () {
	var insight = new Insight({
		trackingCode: 'xxx',
		packageName: 'yeoman',
		packageVersion: '0.0.0'
	});

	it('should put tracked path in queue', function (cb) {
		Insight.prototype._save = function () {
			assert.equal('/test', objectValues(this._queue)[0].path);
			cb();
		};
		insight.track('test');
	});

	it('should throw exception when trackingCode or packageName is not provided', function (cb) {
		/* eslint-disable no-new */
		assert.throws(function () {
			new Insight({});
		}, Error);

		assert.throws(function () {
			new Insight({trackingCode: 'xxx'});
		}, Error);

		assert.throws(function () {
			new Insight({packageName: 'xxx'});
		}, Error);
		/* eslint-enable no-new */

		cb();
	});
});

describe('providers', function () {
	var pkg = 'yeoman';
	var ver = '0.0.0';
	var code = 'GA-1234567-1';
	var ts = Date.UTC(2013, 7, 24, 22, 33, 44);
	var pageviewPayload = {
		path: '/test/path',
		type: 'pageview'
	};
	var eventPayload = {
		category: 'category',
		action: 'action',
		label: 'label',
		value: 'value',
		type: 'event'
	};

	describe('Google Analytics', function () {
		var insight = new Insight({
			trackingCode: code,
			packageName: pkg,
			packageVersion: ver
		});

		it('should form valid request for pageview', function () {
			var reqObj = insight._getRequestObj(ts, pageviewPayload);
			var _qs = qs.parse(reqObj.body);

			assert.equal(_qs.tid, code);
			assert.equal(_qs.cid, insight.clientId);
			assert.equal(_qs.dp, pageviewPayload.path);
			assert.equal(_qs.cd1, osName());
			assert.equal(_qs.cd2, process.version);
			assert.equal(_qs.cd3, ver);
		});

		it('should form valid request for eventTracking', function () {
			var reqObj = insight._getRequestObj(ts, eventPayload);
			var _qs = qs.parse(reqObj.body);

			assert.equal(_qs.tid, code);
			assert.equal(_qs.cid, insight.clientId);
			assert.equal(_qs.ec, eventPayload.category);
			assert.equal(_qs.ea, eventPayload.action);
			assert.equal(_qs.el, eventPayload.label);
			assert.equal(_qs.ev, eventPayload.value);
			assert.equal(_qs.cd1, osName());
			assert.equal(_qs.cd2, process.version);
			assert.equal(_qs.cd3, ver);
		});

		// please see contributing.md
		it('should show submitted data in Real Time dashboard, see docs on how to manually test');
	});

	describe('Yandex.Metrica', function () {
		var insight = new Insight({
			trackingCode: code,
			trackingProvider: 'yandex',
			packageName: pkg,
			packageVersion: ver
		});

		it('should form valid request', function (done) {
			var request = require('request');

			// test querystrings
			var reqObj = insight._getRequestObj(ts, pageviewPayload);
			var _qs = reqObj.qs;

			assert.equal(_qs['page-url'], 'http://' + pkg + '.insight/test/path?version=' + ver);
			assert.equal(_qs['browser-info'], 'i:20130824223344:z:0:t:' + pageviewPayload.path);

			// test cookie
			request(reqObj, function (err) {
				// cookie string looks like:
				// [{"key":"name","value":"yandexuid",
				//   "extensions":["value=80579748502"],"path":"/","creation":...
				var cookieClientId = reqObj.jar.getCookies(reqObj.url)[0].extensions[0].split('=')[1];
				assert.equal(cookieClientId, insight.clientId);
				done(err);
			});
		});
	});
});

describe('config providers', function () {
	beforeEach(function () {
		var pkg = 'yeoman';
		var ver = '0.0.0';

		this.config = {
			get: sinon.spy(function () {
				return true;
			}),
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
	it('should skip in non-TTY mode', function (done) {
		var insProcess = spawn('node', [
			'./test/fixtures/sub-process.js'
		]);
		insProcess.on('close', function (code) {
			assert.strictEqual(insProcess.stdout.read(), null);
			assert.strictEqual(insProcess.stderr.read(), null);
			assert.equal(code, 145);
			done();
		});
	});

	it('should skip when using the --no-insight flag', function (done) {
		var insProcess = spawnPty('node', [
			'./test/fixtures/sub-process.js',
			'--no-insight'
		], {stdio: ['pty', 'pty', 'pipe']});
		var stdout;
		var stderr;
		insProcess.stdout.on('data', function (chunk) {
			stdout = (stdout || '') + String(chunk);
		});
		insProcess.stderr.on('data', function (chunk) {
			stderr = (stderr || '') + String(chunk);
		});
		insProcess.on('close', function (code) {
			assert.strictEqual(stdout, undefined);
			assert.strictEqual(stderr, undefined);
			assert.equal(code, 145);
			done();
		});
	});

	it('should skip in CI environment', function (done) {
		var env = JSON.parse(JSON.stringify(process.env));
		env.CI = true;

		var insProcess = spawnPty('node', [
			'./test/fixtures/sub-process.js'
		], {stdio: ['pty', 'pty', 'pipe'], env: env});
		var stdout;
		var stderr;
		insProcess.stdout.on('data', function (chunk) {
			stdout = (stdout || '') + String(chunk);
		});
		insProcess.stderr.on('data', function (chunk) {
			stderr = (stderr || '') + String(chunk);
		});
		insProcess.on('close', function (code) {
			assert.strictEqual(stdout, undefined);
			assert.strictEqual(stderr, undefined);
			assert.equal(code, 145);
			done();
		});
	});

	it('should skip after timeout', function (done) {
		var env = JSON.parse(JSON.stringify(process.env));
		env.permissionTimeout = 0.1;

		var insProcess = spawnPty('node', [
			'./test/fixtures/sub-process.js'
		], {stdio: ['pty', 'pty', 'pipe'], env: env});
		var stdout;
		var stderr;
		insProcess.stdout.on('data', function (chunk) {
			stdout = (stdout || '') + String(chunk);
		});
		insProcess.stderr.on('data', function (chunk) {
			stderr = (stderr || '') + String(chunk);
		});
		insProcess.on('close', function (code) {
			assert.equal(stripAnsi(stdout),
				'? May yeoman anonymously report usage statistics to improve the tool over time?' +
				' (Y/n) ');
			assert.strictEqual(stderr, undefined);
			assert.equal(code, 145);
			done();
		});
	});

	it('should take yes for an answer', function (done) {
		var env = JSON.parse(JSON.stringify(process.env));
		env.permissionTimeout = 1;

		var insProcess = spawnPty('node', [
			'./test/fixtures/sub-process.js'
		], {stdio: ['pty', 'pty', 'pipe'], env: env});
		var stdin = 'Y\n';
		var stdout;
		var stderr;
		insProcess.stdout.on('data', function (chunk) {
			stdout = (stdout || '') + String(chunk);
			if (stdin && /y\/n/i.test(stripAnsi(stdout))) {
				insProcess.stdin.write(stdin);
				stdin = false;
			}
		});
		insProcess.stderr.on('data', function (chunk) {
			stderr = (stderr || '') + String(chunk);
		});
		insProcess.on('close', function (code) {
			assert.ok(/Yes[\r\n]*$/.test(stripAnsi(stdout)), 'input acknowledged');
			assert.equal(stderr, 'optOut=false');
			assert.equal(code, 145);
			done();
		});
	});
});
