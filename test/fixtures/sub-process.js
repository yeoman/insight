'use strict';
const Insight = require('../../lib');

const insight = new Insight({
	packageName: 'yeoman',
	packageVersion: '0.0.0',
	trackingCode: 'GA-1234567-1'
});

if (process.env.permissionTimeout) {
	insight._permissionTimeout = process.env.permissionTimeout;
}

insight.askPermission('').then(() => {
	process.exit(145);
});
