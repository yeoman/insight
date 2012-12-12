'use strict';
var request = require('request');
var Configstore = require('configstore');
var async = require('async');
var _ = require('lodash');

var BASE_URL = 'http://www.google-analytics.com/collect/__utm.gif';

// Messaged on each debounced track()
// Gets the queue, merges is with the previous and tries to upload everything
// If it fails, it will save everything again
process.on('message', function(msg) {
	var config = new Configstore('insight-' + msg.packageName);
	var qs = msg.qs;
	var q = config.get('queue') || {};

	_.extend(q, msg.queue);
	config.del('queue');

	async.forEachSeries(Object.keys(q), function(el, cb) {
		var parts = el.split(' ');
		var id = parts[0];
		var path = parts[1];

		qs.dp = path;
		// queue time - delta (ms) between now and track time
		qs.qt = Date.now() - parseInt(id, 10);

		request.get(BASE_URL, {qs: qs}, function(error) {
			if (error) {
				return cb(error);
			}
			cb();
		});
	}, function(error) {
		if (error) {
			var q2 = config.get('queue') || {};
			_.extend(q2, q);
			config.set('queue', q2);
		}
		process.exit(0);
	});
});
