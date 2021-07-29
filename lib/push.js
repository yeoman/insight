'use strict';
const request = require('request');
const async = require('async');
const Insight = require('.');

// Messaged on each debounced `track()`
// Gets the queue, merges is with the previous and tries to upload everything
// If it fails, it will save everything again
process.on('message', message => {
	const insight = new Insight(message);
	const {config} = insight;
	const q = config.get('queue') || {};

	Object.assign(q, message.queue);
	config.delete('queue');

	async.forEachSeries(Object.keys(q), (element, cb) => {
		const parts = element.split(' ');
		const id = parts[0];
		const payload = q[element];

		request(insight._getRequestObj(id, payload), error => {
			if (error) {
				cb(error);
				return;
			}

			cb();
		});
	}, error => {
		if (error) {
			const q2 = config.get('queue') || {};
			Object.assign(q2, q);
			config.set('queue', q2);
		}

		process.exit();
	});
});
