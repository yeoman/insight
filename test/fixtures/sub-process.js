'use strict';
var Insight = require('../../lib');

var insight = new Insight({
	packageName: 'yeoman',
	packageVersion: '0.0.0',
	trackingCode: 'GA-1234567-1'
});

if (process.env.permissionTimeout) {
    insight._permissionTimeout = process.env.permissionTimeout;
}

insight.askPermission('', function () {
	process.exit(145);
});
