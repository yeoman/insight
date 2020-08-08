const objectValues = require('object-values');
const sinon = require('sinon');
const test = require('ava');
const Insight = require('../lib');

test('throw exception when trackingCode or packageName is not provided', t => {
	/* eslint-disable no-new */
	t.throws(() => {
		new Insight({});
	});

	t.throws(() => {
		new Insight({trackingCode: 'xxx'});
	});

	t.throws(() => {
		new Insight({packageName: 'xxx'});
	});
	/* eslint-enable no-new */
});

test.cb('forks a new tracker right after track()', t => {
	const insight = newInsight();
	insight.track('test');
	setImmediate(() => {
		t.deepEqual(forkedCalls(insight), [
			// A single fork with a single path
			['/test']
		]);
		t.end();
	});
});

test.cb('only forks once if many pages are tracked in the same event loop run', t => {
	const insight = newInsight();
	insight.track('foo');
	insight.track('bar');
	setImmediate(() => {
		t.deepEqual(forkedCalls(insight), [
			// A single fork with both paths
			['/foo', '/bar']
		]);
		t.end();
	});
});

test.cb('debounces forking every 100 millis (close together)', t => {
	const insight = newInsight();
	insight.track('0');
	setTimeout(() => insight.track('50'), 50);
	setTimeout(() => insight.track('100'), 100);
	setTimeout(() => insight.track('150'), 150);
	setTimeout(() => insight.track('200'), 200);
	setTimeout(() => {
		t.deepEqual(forkedCalls(insight), [
			// The first one is sent straight away because of the leading debounce
			['/0'],
			// The others are grouped together because they're all < 100ms apart
			['/50', '/100', '/150', '/200']
		]);
		t.end();
	}, 1000);
});

test.cb('debounces forking every 100 millis (far apart)', t => {
	const insight = newInsight();
	insight.track('0');
	setTimeout(() => insight.track('50'), 50);
	setTimeout(() => insight.track('100'), 100);
	setTimeout(() => insight.track('150'), 150);
	setTimeout(() => insight.track('300'), 300);
	setTimeout(() => insight.track('350'), 350);
	setTimeout(() => {
		t.deepEqual(forkedCalls(insight), [
			// Leading call
			['/0'],
			// Sent together since there is an empty 100ms window afterwards
			['/50', '/100', '/150'],
			// Sent on its own because it's a new leading debounce
			['/300'],
			// Finally, the last one is sent
			['/350']
		]);
		t.end();
	}, 1000);
});

// Return a valid insight instance which doesn't actually send analytics (mocked)
function newInsight() {
	const insight = new Insight({
		trackingCode: 'xxx',
		packageName: 'yeoman',
		packageVersion: '0.0.0'
	});
	insight.optOut = false;
	insight._fork = sinon.stub();
	return insight;
}

// Returns all forked calls, and which paths were tracked in that fork
// This is handy to get a view of all forks at once instead of debugging 1 by 1
// [
//   ['/one', 'two'],       // first call tracked 2 paths
//   ['/three', 'four'],    // second call tracked 2 more paths
// ]
function forkedCalls(insight) {
	return insight._fork.args.map(callArgs => {
		return objectValues(callArgs[0].queue).map(q => q.path);
	});
}
