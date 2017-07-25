
import sinon from 'sinon';
import test from 'ava';
import Insight from '../lib';

const pkg = 'yeoman';
const ver = '0.0.0';

let config;
let insight;

test.beforeEach(() => {
	config = {
		get: sinon.spy(() => {
			return true;
		}),
		set: sinon.spy()
	};

	insight = new Insight({
		trackingCode: 'xxx',
		packageName: pkg,
		packageVersion: ver,
		config: config
	});
});

test('access the config object for reading', t => {
	t.truthy(insight.optOut);
	t.truthy(config.get.called);
});

test('access the config object for writing', t => {
	const sentinel = {};
	insight.optOut = sentinel;
	t.truthy(config.set.calledWith('optOut', sentinel));
});
