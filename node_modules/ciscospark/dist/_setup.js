'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**!
 *
 * Copyright (c) 2015-2016 Cisco Systems, Inc. See LICENSE file.
 */

// Disable eslint because this file needs to be es5 compatible
/* eslint-disable */

var testUsers = require('@ciscospark/test-helper-test-users');
var ciscospark = require('..');

before(function () {
  this.timeout(60000);

  if (ciscospark.credentials.authorization.access_token) {
    return _promise2.default.resolve();
  }
  return testUsers.create({ count: 1 }).then(function (users) {
    /* eslint camelcase: [0] */
    ciscospark.credentials.authorization.access_token = users[0].token.access_token;
    ciscospark.credentials.authorization.refresh_token = users[0].token.refresh_token;
  });
});

after(function () {
  ciscospark.credentials.authorization.access_token = undefined;
  ciscospark.credentials.authorization.refresh_token = undefined;
});
//# sourceMappingURL=_setup.js.map
