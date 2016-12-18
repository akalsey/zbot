'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _sparkCore = require('@ciscospark/spark-core');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @class CiscoSparkAuthInterceptor
 * @private
 */
var CiscoSparkAuthInterceptor = function (_AuthInterceptor) {
  (0, _inherits3.default)(CiscoSparkAuthInterceptor, _AuthInterceptor);

  function CiscoSparkAuthInterceptor() {
    (0, _classCallCheck3.default)(this, CiscoSparkAuthInterceptor);
    return (0, _possibleConstructorReturn3.default)(this, (CiscoSparkAuthInterceptor.__proto__ || (0, _getPrototypeOf2.default)(CiscoSparkAuthInterceptor)).apply(this, arguments));
  }

  (0, _createClass3.default)(CiscoSparkAuthInterceptor, [{
    key: 'requiresCredentials',


    /**
     * @param {Object} options
     * @returns {boolean}
     */
    value: function requiresCredentials(options) {
      if (options.uri.includes(this.spark.config.hydraServiceUrl)) {
        return true;
      }

      return false;
    }
  }], [{
    key: 'create',

    /**
     * @returns {CiscoSparkAuthInterceptor}
     */
    value: function create() {
      /* eslint no-invalid-this: [0] */
      return new CiscoSparkAuthInterceptor({ spark: this });
    }
  }]);
  return CiscoSparkAuthInterceptor;
}(_sparkCore.AuthInterceptor); /**!
                                *
                                * Copyright (c) 2015-2016 Cisco Systems, Inc. See LICENSE file.
                                * @private
                                */

exports.default = CiscoSparkAuthInterceptor;
//# sourceMappingURL=auth.js.map
