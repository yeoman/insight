'use strict';
const got = require('got');
const async = require('async');
const Insight = require('.');

// Messaged on each debounced `track()`
// Gets the queue, merges is with the previous and tries to upload everything
// If it fails, it will save everything again
process.on('message', msg => {
	const insight = new Insight(msg);
	const config = insight.config;
	const q = config.get('queue') || {};

	Object.assign(q, msg.queue);
	config.del('queue');

	async.forEachSeries(Object.keys(q), (el, cb) => {
		const parts = el.split(' ');
		const id = parts[0];
		const payload = q[el];
		const gotObject = insight._getGotObj(id, payload);
		got(gotObject.url, gotObject.options).then(() => cb()).catch(err => cb(err));
	}, err => {
		if (err) {
			const q2 = config.get('queue') || {};
			Object.assign(q2, q);
			config.set('queue', q2);
		}

		process.exit();
	});
});
