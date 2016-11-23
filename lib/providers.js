'use strict';
var qs = require('querystring');

/**
 * Tracking providers.
 *
 * Each provider is a function(id, path) that should return
 * options object for request() call. It will be called bound
 * to Insight instance object.
 */

module.exports = {
	// Google Analytics — https://www.google.com/analytics/
	google: function (id, payload) {
		var now = Date.now();

		var _qs = {
			// GA Measurement Protocol API version
			v: 1,

			// hit type
			t: payload.type,

			// anonymize IP
			aip: 1,

			tid: this.trackingCode,

			// random UUID
			cid: this.clientId,

			cd1: this.os,

			// GA custom dimension 2 = Node Version, scope = Session
			cd2: this.nodeVersion,

			// GA custom dimension 3 = App Version, scope = Session (temp solution until refactored to work w/ GA app tracking)
			cd3: this.appVersion,

			// queue time - delta (ms) between now and track time
			qt: now - parseInt(id, 10),

			// cache busting, need to be last param sent
			z: now
		};

		// set payload data based on the tracking type
		if (payload.type === 'event') {
			_qs.ec = payload.category;
			_qs.ea = payload.action;
			if (payload.label) {
				_qs.el = payload.label;
			}
			if (payload.value) {
				_qs.ev = payload.value;
			}
		} else {
			_qs.dp = payload.path;
		}

		return {
			url: 'https://ssl.google-analytics.com/collect',
			method: 'POST',
			// GA docs recommends body payload via POST instead of querystring via GET
			body: qs.stringify(_qs)
		};
	},
	// Yandex.Metrica - http://metrica.yandex.com
	yandex: function (id, payload) {
		var request = require('request');

		var ts = new Date(parseInt(id, 10))
			.toISOString()
			.replace(/[-:T]/g, '')
			.replace(/\..*$/, '');

		var path = payload.path;
		var qs = {
			'wmode': 3,
			'ut': 'noindex',
			'page-url': 'http://' + this.packageName + '.insight' + path + '?version=' + this.packageVersion,
			'browser-info': 'i:' + ts + ':z:0:t:' + path,
			// cache busting
			'rn': Date.now()
		};

		var url = 'https://mc.yandex.ru/watch/' + this.trackingCode;

		// set custom cookie using tough-cookie
		var _jar = request.jar();
		var cookieString = 'name=yandexuid; value=' + this.clientId + '; path=/;';
		var cookie = request.cookie(cookieString);
		_jar.setCookie(cookie, url);

		return {
			url: url,
			method: 'GET',
			qs: qs,
			jar: _jar
		};
	}
};
