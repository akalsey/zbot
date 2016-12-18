'use strict';

module.exports = function configurKarma(config) {
	var browsers = require('./browsers');
	var fs = require('fs');
	var pkg = require('./package');

	// Use ENV vars on Travis and sauce.json locally to get credentials
	if (!process.env.SAUCE_USERNAME) {
		if (!fs.existsSync('sauce.json')) {
			console.log('Create a sauce.json with your credentials based on the sauce-sample.json file.');
			/* eslint no-process-exit: [0] */
			process.exit(1);
		}
		else {
			process.env.SAUCE_USERNAME = require('./sauce').SAUCE_USERNAME;
			process.env.SAUCE_ACCESS_KEY = require('./sauce').SAUCE_ACCESS_KEY;
		}
	}

	config.set({
		basePath: '',

		browserify: {
			debug: true,
			watch: true
		},

		browsers: Object.keys(browsers),

		colors: true,

		customLaunchers: browsers,

		files: [
			'test/**/*.js'
		],

		frameworks: [
			'browserify',
			'mocha'
		],

		logLevel: config.LOG_DEBUG,

		port: 8000,

		preprocessors: {
			'test/**/*.js': ['browserify']
		},

		reporters: [
			'mocha',
			'saucelabs'
		],

		sauceLabs: {
			build: process.env.DRONE_BUILD_NUMBER,
			tags: [
				process.env.DRONE_BRANCH
			],
			testName: pkg.name
		},

		singleRun: true
	});
};
