import objectValues from 'object-values';
import test from 'ava';
import Insight from '../lib';

const insight = new Insight({
	trackingCode: 'xxx',
	packageName: 'yeoman',
	packageVersion: '0.0.0'
});

insight.optOut = false;

test('put tracked path in queue', t => {
	Insight.prototype._save = function () {
		t.is('/test', objectValues(this._queue)[0].path);
	};
	insight.track('test');
});

test('throw exception when trackingCode or packageName is not provided', t => {
	/* eslint-disable no-new */
	t.throws(() => {
		new Insight({});
	}, Error);

	t.throws(() => {
		new Insight({trackingCode: 'xxx'});
	}, Error);

	t.throws(() => {
		new Insight({packageName: 'xxx'});
	}, Error);
	/* eslint-enable no-new */
});
