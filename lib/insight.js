'use strict';
var path = require('path');
var fork = require('child_process').fork;
var Configstore = require('configstore');
var colors = require('colors');
var _ = require('lodash');
var prompt = require('prompt');


function Insight (options) {
	options = options || {};

	if (!options.packageName && !options.packageVersion) {
		this.packageFile = require(path.resolve(path.dirname(module.parent.filename), options.packagePath || 'package'));
	}

	this.trackingCode = options.trackingCode;
	this.packageName = options.packageName || this.packageFile.name;
	this.packageVersion = options.packageVersion || this.packageFile.version;
	this.config = new Configstore('insight-' + this.packageName, {
		clientId: Math.floor(Date.now() * Math.random())
	});
	this._queue = {};
}

Object.defineProperty(Insight.prototype, 'optOut', {
	get: function () {
		return this.config.get('optOut');
	},
	set: function (val) {
		this.config.set('optOut', val);
	}
});

// debounce in case of rapid .track() invocations
Insight.prototype._save = _.debounce(function () {
	var qs = {
		v: 1, // GA API version
		t: 'pageview', // event type
		aip: 1, // anonymize IP
		tid: this.trackingCode,
		cid: this.config.get('clientId'),
		an: this.packageName,
		av: this.packageVersion,
		z: Date.now() // cache busting
	};

	var cp = fork(path.join(__dirname, 'push.js'));
	cp.send({
		queue: _.extend({}, this._queue),
		packageName: this.packageName,
		qs: qs
	});
	cp.unref();
	cp.disconnect();

	this._queue = {};
}, 100);

Insight.prototype.track = function () {
	if (this.config.get('optOut')) {
		return;
	}

	var path = '/' + [].map.call(arguments, function (el) {
		return String(el).trim().replace(/ /, '-');
	}).join('/');

	// timestamp isn't unique enough since it can end up with duplicate entries
	this._queue[Date.now() + ' ' + path] = path;
	this._save();
};

Insight.prototype.askPermission = function (msg, cb) {
	var defaultMsg = 'May ' + this.packageName.cyan + ' anonymously report usage statistics to improve the tool over time?';

	cb = cb || function () {};
	console.log(msg || defaultMsg);

	prompt.message = '[' + '?'.green + ']';
	prompt.delimiter = ' ';
	prompt.start();
	prompt.get([{
		name: 'optIn',
		message: '[Y/n]:',
		default: 'Y',
		validator: /^[yn]{1}/i,
		empty: false
	}], function (err, result) {
		if (err) {
			return cb(err);
		}
		this.optOut = /n/i.test(result.optIn);
		cb(null, this.optOut);
	}.bind(this));
};

module.exports = Insight;
