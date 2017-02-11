/* eslint-env mocha */
'use strict';
const assert = require('assert');
const qs = require('querystring');
const spawn = require('child_process').spawn;
const osName = require('os-name');
const sinon = require('sinon');
const objectValues = require('object-values');
const Insight = require('../lib');

describe('Insight()', () => {
	const insight = new Insight({
		trackingCode: 'xxx',
		packageName: 'yeoman',
		packageVersion: '0.0.0'
	});

	insight.optOut = false;

	it('should put tracked path in queue', cb => {
		Insight.prototype._save = function () {
			assert.equal('/test', objectValues(this._queue)[0].path);
			cb();
		};
		insight.track('test');
	});

	it('should throw exception when trackingCode or packageName is not provided', cb => {
		/* eslint-disable no-new */
		assert.throws(() => {
			new Insight({});
		}, Error);

		assert.throws(() => {
			new Insight({trackingCode: 'xxx'});
		}, Error);

		assert.throws(() => {
			new Insight({packageName: 'xxx'});
		}, Error);
		/* eslint-enable no-new */

		cb();
	});
});

describe('providers', () => {
	const pkg = 'yeoman';
	const ver = '0.0.0';
	const code = 'GA-1234567-1';
	const ts = Date.UTC(2013, 7, 24, 22, 33, 44);
	const pageviewPayload = {
		path: '/test/path',
		type: 'pageview'
	};
	const eventPayload = {
		category: 'category',
		action: 'action',
		label: 'label',
		value: 'value',
		type: 'event'
	};

	describe('Google Analytics', () => {
		const insight = new Insight({
			trackingCode: code,
			packageName: pkg,
			packageVersion: ver
		});

		it('should form valid request for pageview', () => {
			const reqObj = insight._getRequestObj(ts, pageviewPayload);
			const _qs = qs.parse(reqObj.body);

			assert.equal(_qs.tid, code);
			assert.equal(_qs.cid, insight.clientId);
			assert.equal(_qs.dp, pageviewPayload.path);
			assert.equal(_qs.cd1, osName());
			assert.equal(_qs.cd2, process.version);
			assert.equal(_qs.cd3, ver);
		});

		it('should form valid request for eventTracking', () => {
			const reqObj = insight._getRequestObj(ts, eventPayload);
			const _qs = qs.parse(reqObj.body);

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

		// Please see contributing.md
		it('should show submitted data in Real Time dashboard, see docs on how to manually test');
	});

	describe('Yandex.Metrica', () => {
		const insight = new Insight({
			trackingCode: code,
			trackingProvider: 'yandex',
			packageName: pkg,
			packageVersion: ver
		});

		it('should form valid request', done => {
			const request = require('request');

			// Test querystrings
			const reqObj = insight._getRequestObj(ts, pageviewPayload);
			const _qs = reqObj.qs;

			assert.equal(_qs['page-url'], `http://${pkg}.insight/test/path?version=${ver}`);
			assert.equal(_qs['browser-info'], `i:20130824223344:z:0:t:${pageviewPayload.path}`);

			// Test cookie
			request(reqObj, err => {
				// Cookie string looks like:
				// [{"key":"name","value":"yandexuid",
				//   "extensions":["value=80579748502"],"path":"/","creation":...
				const cookieClientId = reqObj.jar.getCookies(reqObj.url)[0].extensions[0].split('=')[1];
				assert.equal(cookieClientId, insight.clientId);
				done(err);
			});
		});
	});
});

describe('config providers', () => {
	beforeEach(function () {
		const pkg = 'yeoman';
		const ver = '0.0.0';

		this.config = {
			get: sinon.spy(() => {
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
		const sentinel = {};
		this.insight.optOut = sentinel;
		assert(this.config.set.calledWith('optOut', sentinel));
	});
});

describe('askPermission', () => {
	it('should skip in TTY mode', done => {
		const insProcess = spawn('node', [
			'./test/fixtures/sub-process.js'
		]);
		insProcess.on('close', code => {
			assert.equal(code, 145);
			done();
		});
	});

	it('should skip when using the --no-insight flag', done => {
		const insProcess = spawn('node', [
			'./test/fixtures/sub-process.js',
			'--no-insight'
		], {stdio: 'inherit'});
		insProcess.on('close', code => {
			assert.equal(code, 145);
			done();
		});
	});

	it('should skip in CI mode', done => {
		const env = JSON.parse(JSON.stringify(process.env));
		env.CI = true;

		const insProcess = spawn('node', [
			'./test/fixtures/sub-process.js'
		], {stdio: 'inherit', env});
		insProcess.on('close', code => {
			assert.equal(code, 145);
			done();
		});
	});

	it('should skip after timeout', done => {
		const env = JSON.parse(JSON.stringify(process.env));
		env.permissionTimeout = 0.1;

		const insProcess = spawn('node', [
			'./test/fixtures/sub-process.js'
		], {stdio: 'inherit', env});

		insProcess.on('close', code => {
			assert.equal(code, 145);
			done();
		});
	});
});
