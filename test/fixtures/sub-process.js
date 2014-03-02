var Insight = require('../../lib/insight.js');
var pkg = 'yeoman',
	ver = '0.0.0',
	code = 'GA-1234567-1';
var insight = new Insight({
	trackingCode: code,
	packageName: pkg,
	packageVersion: ver
});

insight.askPermission('', function () {
	process.exit(145);
});
