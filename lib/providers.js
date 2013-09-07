'use strict';
var request = require('request');
/**
 * Tracking providers.
 *
 * Each provider is a function(id, path) that should return
 * options object for request() call. It will be called bound
 * to Insight instance object.
 */
module.exports = {
	// Google Analytics — https://www.google.com/analytics/
	google: function(id, path) {
		var now = Date.now();
		var qs = {
			v: 1, // GA API version
			t: 'pageview', // event type
			aip: 1, // anonymize IP
			tid: this.trackingCode,
			cid: this.clientId,
			an: this.packageName,
			av: this.packageVersion,
			dp: path,
			qt: now - parseInt(id, 10), // queue time - delta (ms) between now and track time
			z: now // cache busting
		};

		return {
			url: 'http://www.google-analytics.com/collect',
			qs: qs
		};
	},
	// Yandex.Metrica — http://metrica.yandex.com
	yandex: function(id, path) {
		var ts = new Date(parseInt(id, 10))
			.toISOString()
			.replace(/[-:T]/g, '')
			.replace(/\..*$/, '');

		var qs = {
			wmode: 3,
			ut: 'noindex',
			'page-url': 'http://' + this.packageName + '.insight' + path + '?version=' + this.packageVersion,
			'browser-info': 'i:' + ts + ':z:0:t:' + path,
			rn: Date.now() // cache busting
		};

		var jar = request.jar();
		jar.add({
			name: 'yandexuid',
			value: this.clientId,
			path: '/',
			expires: Infinity
		});

		return {
			url: 'http://mc.yandex.ru/watch/' + this.trackingCode,
			qs: qs,
			jar: jar
		};
	}
};
