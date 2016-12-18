'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sparkCore = require('@ciscospark/spark-core');

var _storageAdapterLocalStorage = require('@ciscospark/storage-adapter-local-storage');

var _storageAdapterLocalStorage2 = _interopRequireDefault(_storageAdapterLocalStorage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**!
 *
 * Copyright (c) 2015 Cisco Systems, Inc. See LICENSE file.
 * @private
 */

exports.default = {
  boundedAdapter: new _storageAdapterLocalStorage2.default('ciscospark'),
  unboundedAdapter: _sparkCore.MemoryStoreAdapter
};
//# sourceMappingURL=config-storage.shim.js.map
