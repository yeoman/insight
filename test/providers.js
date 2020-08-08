const sinon = require('sinon');
const test = require('ava');
const Insight = require('../lib');

const pkg = 'yeoman';
const ver = '0.0.0';

let config;
let insight;

test.beforeEach(() => {
	config = {
		get: sinon.spy(() => true),
		set: sinon.spy()
	};

	insight = new Insight({
		trackingCode: 'xxx',
		packageName: pkg,
		packageVersion: ver,
		config
	});
});

test('access the config object for reading', t => {
	t.true(insight.optOut);
	t.true(config.get.called);
});

test('access the config object for writing', t => {
	const sentinel = {};
	insight.optOut = sentinel;
	t.true(config.set.calledWith('optOut', sentinel));
});
