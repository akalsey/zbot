'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _decorators = require('./decorators');

Object.defineProperty(exports, 'persist', {
  enumerable: true,
  get: function get() {
    return _decorators.persist;
  }
});
Object.defineProperty(exports, 'waitForValue', {
  enumerable: true,
  get: function get() {
    return _decorators.waitForValue;
  }
});

var _makeSparkStore = require('./make-spark-store.js');

Object.defineProperty(exports, 'makeSparkStore', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_makeSparkStore).default;
  }
});

var _makeSparkPluginStore = require('./make-spark-plugin-store.js');

Object.defineProperty(exports, 'makeSparkPluginStore', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_makeSparkPluginStore).default;
  }
});

var _memoryStoreAdapter = require('./memory-store-adapter');

Object.defineProperty(exports, 'MemoryStoreAdapter', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_memoryStoreAdapter).default;
  }
});

var _errors = require('./errors');

Object.defineProperty(exports, 'StorageError', {
  enumerable: true,
  get: function get() {
    return _errors.StorageError;
  }
});
Object.defineProperty(exports, 'NotFoundError', {
  enumerable: true,
  get: function get() {
    return _errors.NotFoundError;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
//# sourceMappingURL=index.js.map
