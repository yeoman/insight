'use strict';
const path = require('path');
const fork = require('child_process').fork;
const osName = require('os-name');
const Configstore = require('configstore');
const chalk = require('chalk');
const debounce = require('lodash.debounce');
const inquirer = require('inquirer');
const uuid = require('uuid');
const providers = require('./providers');

class Insight {
	constructor(options) {
		options = options || {};
		options.pkg = options.pkg || {};

		// Deprecated options
		// TODO: Remove these at some point in the future
		if (options.packageName) {
			options.pkg.name = options.packageName;
		}

		if (options.packageVersion) {
			options.pkg.version = options.packageVersion;
		}

		if (!options.trackingCode || !options.pkg.name) {
			throw new Error('trackingCode and pkg.name required');
		}

		this.trackingCode = options.trackingCode;
		this.trackingProvider = options.trackingProvider || 'google';
		this.packageName = options.pkg.name;
		this.packageVersion = options.pkg.version || 'undefined';
		this.os = osName();
		this.nodeVersion = process.version;
		this.appVersion = this.packageVersion;
		this.config = options.config || new Configstore(`insight-${this.packageName}`, {
			clientId: options.clientId || Math.floor(Date.now() * Math.random())
		});
		this._queue = {};
		this._permissionTimeout = 30;
	}
	get optOut() {
		return this.config.get('optOut');
	}
	set optOut(val) {
		this.config.set('optOut', val);
	}
	get clientId() {
		return this.config.get('clientId');
	}
	set clientId(val) {
		this.config.set('clientId', val);
	}
	_save() {
		// Debounce in case of rapid .track() invocations
		debounce(() => {
			const cp = fork(path.join(__dirname, 'push.js'), {silent: true});
			cp.send(this._getPayload());
			cp.unref();
			cp.disconnect();

			this._queue = {};
		}, 100);
	}
	_getPayload() {
		return {
			queue: Object.assign({}, this._queue),
			packageName: this.packageName,
			packageVersion: this.packageVersion,
			trackingCode: this.trackingCode,
			trackingProvider: this.trackingProvider
		};
	}
	_getRequestObj() {
		return providers[this.trackingProvider].apply(this, arguments);
	}
	track() {
		if (this.optOut) {
			return;
		}

		const path = '/' + [].map.call(arguments, el => String(el).trim().replace(/ /, '-')).join('/');

		// Timestamp isn't unique enough since it can end up with duplicate entries
		this._queue[`${Date.now()} ${uuid.v4()}`] = {
			path,
			type: 'pageview'
		};
		this._save();
	}
	trackEvent(options) {
		if (this.optOut) {
			return;
		}

		if (this.trackingProvider !== 'google') {
			throw new Error('Event tracking is supported only for Google Analytics');
		}

		if (!options || !options.category || !options.action) {
			throw new Error('`category` and `action` required');
		}

		// Timestamp isn't unique enough since it can end up with duplicate entries
		this._queue[`${Date.now()} ${uuid.v4()}`] = {
			category: options.category,
			action: options.action,
			label: options.label,
			value: options.value,
			type: 'event'
		};
		this._save();
	}
	askPermission(msg, cb) {
		const defaultMsg = `May ${chalk.cyan(this.packageName)} anonymously report usage statistics to improve the tool over time?`;

		cb = cb || (() => {});

		if (!process.stdout.isTTY || process.argv.indexOf('--no-insight') !== -1 || process.env.CI) {
			setImmediate(cb, null, false);
			return;
		}

		const prompt = inquirer.prompt({
			type: 'confirm',
			name: 'optIn',
			message: msg || defaultMsg,
			default: true
		});

		// Add a 30 sec timeout before giving up on getting an answer
		const permissionTimeout = setTimeout(() => {
			// Stop listening for stdin
			prompt.ui.close();

			// Automatically opt out
			this.optOut = true;
			cb(null, false);
		}, this._permissionTimeout * 1000);

		prompt.then(result => {
			// Clear the permission timeout upon getting an answer
			clearTimeout(permissionTimeout);

			this.optOut = !result.optIn;
			cb(null, result.optIn);
		});
	}
}

module.exports = Insight;
