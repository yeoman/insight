import sinon from 'sinon';
import test from 'ava';
import Insight from '../lib';

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

test.cb('sends right after calling track()', t => {
	const insight = newInsight();
	insight.track('test');
	setImmediate(() => {
		t.is(insight._send.callCount, 1);
		t.end();
	});
});

test.cb('only sends once if many pages are tracked in the same event loop run', t => {
	const insight = newInsight();
	insight.track('foo');
	insight.track('bar');
	setImmediate(() => {
		t.is(insight._send.callCount, 1);
		t.end();
	});
});

test.cb('debounces sending every 100 millis (close together)', t => {
	const insight = newInsight();

	// The first one is sent straight away because of the leading debounce
	setTimeout(() => insight.track('0'), 0);

	// The others are grouped together because they're all < 100ms apart
	setTimeout(() => insight.track('50'), 50);
	setTimeout(() => insight.track('100'), 100);
	setTimeout(() => insight.track('150'), 150);
	setTimeout(() => insight.track('200'), 200);

	setTimeout(() => {
		t.is(insight._send.callCount, 2);
		t.end();
	}, 1000);
});

test.cb('debounces sending every 100 millis (far apart)', t => {
	const insight = newInsight();

	// Leading call
	setTimeout(() => insight.track('0'), 0);

	// Sent together since there is an empty 100ms window afterwards
	setTimeout(() => insight.track('50'), 50);
	setTimeout(() => insight.track('100'), 100);
	setTimeout(() => insight.track('150'), 150);

	// Sent on its own because it's a new leading debounce
	setTimeout(() => insight.track('300'), 300);

	// Finally, the last one is sent
	setTimeout(() => insight.track('350'), 350);

	setTimeout(() => {
		t.is(insight._send.callCount, 4);
		t.end();
	}, 1000);
});

// Return a valid insight instance which doesn't actually send analytics (mocked)
function newInsight() {
	// _debouncedSend wraps _send during construction, so we have to replace
	// Insight.prototype._send with a stub. However, if we do that on Insight,
	// then tests executed in parallel will share the same stub. That's why we
	// create a new class for every caller.
	class StubbedInsight extends Insight {}
	StubbedInsight.prototype._send = sinon.stub();

	const insight = new StubbedInsight({
		trackingCode: 'xxx',
		packageName: 'yeoman',
		packageVersion: '0.0.0'
	});
	insight.optOut = false;
	return insight;
}
