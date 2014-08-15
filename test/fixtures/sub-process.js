'use strict';
var Insight = require('../../lib');

var insight = new Insight({
	packageName: 'yeoman',
	packageVersion: '0.0.0',
	trackingCode: 'GA-1234567-1'
});

insight.askPermission('', function () {
	process.exit(145);
});
