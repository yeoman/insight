'use strict';

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
			v: 1, // GA Measurement Protocol API version
			t: 'pageview', // hit type
			aip: 1, // anonymize IP
			tid: this.trackingCode,
			cid: this.clientId, // random UUID
			// this app's name, only works when GA property is set up for app-based tracking
			an: this.packageName,
			// this app's version, only works when GA property is set up for app-based tracking
			av: this.packageVersion,
			// GA custom dimension 1 = OS, scope = Session
			cd1: this.os,
			// GA custom dimension 2 = Node Version, scope = Session
			cd2: this.nodeVersion,
			// GA custom dimension 3 = App Version, scope = Session (temp solution until refactored to work w/ GA app tracking)
			cd3: this.appVersion,
			dp: path,
			qt: now - parseInt(id, 10), // queue time - delta (ms) between now and track time
			z: now // cache busting, need to be last param sent
		};

		return {
			url: 'https://ssl.google-analytics.com/collect',
			qs: qs
		};
	},
	// Yandex.Metrica — http://metrica.yandex.com
	yandex: function(id, path) {
		var request = require('request');

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
