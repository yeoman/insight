# Insight [![Build Status](https://secure.travis-ci.org/yeoman/insight.png?branch=master)](http://travis-ci.org/yeoman/insight)

Understand how your tool is being used by anonymously reporting usage metrics to [Google Analytics](http://www.google.com/analytics/)

*This module uses the [newly released Universal Analytics API](http://analytics.blogspot.com/2013/03/expanding-universal-analytics-into.html) from Google Analytics*


## Analytics dashboard example

Displaying metrics from [Yeoman](http://yeoman.io) which makes use of Insight.

![analytics screenshot](https://raw.github.com/yeoman/insight/master/screenshot.png)


## Example usage

```js
var Insight = require('insight');

var insight = new Insight({
	// Google Analytics tracking code
	trackingCode: 'UA-XXXXXXXX-X'
});

// ask for permission the first time
if (insight.optOut === undefined) {
	return insight.askPermission();
}

insight.track('foo', 'bar');
// recorded in Analytics as `/foo/bar`
```

or a [live example](https://github.com/yeoman/yeoman)


## Documentation


### Insight(settings)

#### trackingCode

Type: `string`  
**Required**

Your Google Analytics [trackingCode](https://support.google.com/analytics/bin/answer.py?hl=en&answer=1008080)


#### packagePath

Type: `string`  
Default: `'package.json'`

Relative path to your module `package.json`


#### packageName

Type: `string`  
Default: Inferred from `packageFile`

Used instead of inferring it from `packageFile`  
Requires you to also specify `packageVersion`


#### packageVersion

Type: `string`  
Default: Inferred from `packageFile`

Used instead of inferring it from `packageFile`  
Requires you to also specify `packageName`


### Instance methods


#### .track(keyword, [keyword, ...])

Accepts keywords which ends up as a path in Analytics.

`.track('init', 'backbone')` becomes `/init/backbone`


#### .askPermission([message, callback])

Asks the user for permission to track and sets the `optOut` property. You can also choose to set this manually.

![askPermission screenshot](https://raw.github.com/yeoman/insight/master/screenshot-askpermission.png)

Optionally supply your own `message` and `callback`. The callback will be called with the arguments `error` and `optOut` when the prompt is done, and is useful for when you want to continue the execution while the prompt is running.


#### .optOut

Returns a boolean whether the user has opted out of tracking. Should preferably only be set by a user action, eg. a prompt.


## License

[BSD license](http://opensource.org/licenses/bsd-license.php) and copyright Google
