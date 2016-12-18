'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sparkCore = require('@ciscospark/spark-core');

/**
 * @typedef {Object} Types~Membership
 * @property {uuid} id - Unique identifier for the membership
 * @property {string} roomId - The room ID
 * @property {uuid} personId - The person ID
 * @property {email} personEmail - The email address of the person / room member
 * @property {boolean} isModerator - Indicates whether the specified person should be a room moderator.
 * @property {boolean} isMonitor - Indicates whether the specified member is a room monitor.
 * @property {isoDate} created - The date and time that this membership was created.
 */

/**
 * @class
 * @extends SparkPlugin
 */
var Memberships = _sparkCore.SparkPlugin.extend({
  /**
   * Adds a person to a room. The person can be added by ID (personId) or by
   * Email Address (personEmail). The person can be optionally added to the room
   * as a moderator.
   * @instance
   * @memberof Memberships
   * @param {Types~Membership} membership
   * @returns {Promise<Types~Membership>}
   * @example
   * var ciscospark = require('../..');
   * ciscospark.rooms.create({title: 'Create Membership Example'})
   *   .then(function(room) {
   *     return ciscospark.memberships.create({
   *      personEmail: 'alice@example.com',
   *      roomId: room.id
   *    });
   *   })
   *   .then(function(membership) {
   *     var assert = require('assert');
   *     assert(membership.id);
   *     assert(membership.roomId);
   *     assert(membership.personId);
   *     assert(membership.personEmail);
   *     assert('isModerator' in membership);
   *     assert('isMonitor' in membership);
   *     assert(membership.created);
   *     return 'success';
   *   });
   *   // => success
   */
  create: function create(membership) {
    return this.request({
      method: 'POST',
      uri: this.config.hydraServiceUrl + '/memberships',
      body: membership
    }).then(function (res) {
      return res.body;
    });
  },


  /**
   * Returns a single membership.
   * @instance
   * @memberof Memberships
   * @param {Types~Membership|uuid} membership
   * @returns {Promise<Types~Membership>}
   * @example
   * var ciscospark = require('../..');
   * var membership;
   * ciscospark.rooms.create({title: 'Get Membership Example'})
   *   .then(function(room) {
   *     return ciscospark.memberships.create({
   *       personEmail: 'alice@example.com',
   *       roomId: room.id
   *     });
   *   })
   *   .then(function(m) {
   *     membership = m;
   *     return ciscospark.memberships.get(m.id);
   *   })
   *   .then(function(m) {
   *     var assert = require('assert');
   *     assert.deepEqual(m, membership);
   *     return 'success';
   *   });
   *   // => success
   */
  get: function get(membership) {
    var id = membership.id || membership;
    return this.request({
      uri: this.config.hydraServiceUrl + '/memberships/' + id
    }).then(function (res) {
      return res.body.items || res.body;
    });
  },


  /**
   * Returns a list of memberships. In most cases the results will only contain
   * rooms that the authentiated user is a member of. You can filter the results
   * by room to list people in a room or by person to find rooms that a
   * specific person is a member of.
   * @instance
   * @memberof Memberships
   * @param {Object} options
   * @param {string} options.personId
   * @param {string} options.personEmail
   * @param {string} options.roomId
   * @param {number} options.max
   * @returns {Promise<Page<Types~Membership>>}
   * @example
   * var ciscospark = require('../..');
   * var room;
   * ciscospark.rooms.create({title: 'List Membership Example'})
   *   .then(function(r) {
   *     room = r;
   *     return ciscospark.memberships.create({
   *      personEmail: 'alice@example.com',
   *      roomId: room.id
   *     });
   *   })
   *   .then(function() {
   *     return ciscospark.memberships.list({roomId: room.id});
   *   })
   *   .then(function(memberships) {
   *     var assert = require('assert');
   *     assert.equal(memberships.length, 2);
   *     for (var i = 0; i < memberships.length; i++) {
   *       assert.equal(memberships.items[i].roomId, room.id);
   *     }
   *     return 'success';
   *   });
   *   // => success
   */
  list: function list(options) {
    var _this = this;

    return this.request({
      uri: this.config.hydraServiceUrl + '/memberships',
      qs: options
    }).then(function (res) {
      return new _sparkCore.Page(res, _this.spark);
    });
  },


  /**
   * Deletes a single membership.
   * @instance
   * @memberof Memberships
   * @param {Types~Membership|uuid} membership
   * @returns {Promise}
   * @example
   * var ciscospark = require('../..');
   * var membership, room;
   * ciscospark.rooms.create({title: 'Remove Membership Example'})
   *   .then(function(r) {
   *     room = r;
   *     return ciscospark.memberships.create({
   *      personEmail: 'alice@example.com',
   *      roomId: room.id
   *     });
   *   })
   *   .then(function(m) {
   *     membership = m;
   *     return ciscospark.memberships.list({roomId: room.id});
   *   })
   *   .then(function(memberships) {
   *     var assert = require('assert');
   *     assert.equal(memberships.length, 2);
   *     return ciscospark.memberships.remove(membership);
   *   })
   *   .then(function() {
   *     return ciscospark.memberships.list({roomId: room.id});
   *   })
   *   .then(function(memberships) {
   *     var assert = require('assert');
   *     assert.equal(memberships.length, 1);
   *     return 'success';
   *   });
   *   // => success
   */
  remove: function remove(membership) {
    var id = membership.id || membership;

    return this.request({
      method: 'DELETE',
      uri: this.config.hydraServiceUrl + '/memberships/' + id
    }).then(function (res) {
      // Firefox has some issues with 204s and/or DELETE. This should move to
      // http-core
      if (res.statusCode === 204) {
        return undefined;
      }
      return res.body;
    });
  },


  /**
   * Used to update a single membership's properties
   * @instance
   * @memberof Memberships
   * @param {Types~Membership|uuid} membership
   * @returns {Promise<Types~Membership>}
   * @example
   * var ciscospark = require('../..');
   * var membership, room;
   * ciscospark.rooms.create({title: 'Memberships Example'})
   *   .then(function(r) {
   *     room = r;
   *     return ciscospark.memberships.list({roomId: room.id});
   *   })
   *   .then(function(memberships) {
   *     membership = memberships.items[0];
   *     var assert = require('assert');
   *     assert.equal(membership.isModerator, false);
   *     membership.isModerator = true;
   *     return ciscospark.memberships.update(membership);
   *   })
   *   .then(function() {
   *     return ciscospark.memberships.get(membership.id);
   *   })
   *   .then(function(membership) {
   *     var assert = require('assert');
   *     assert.equal(membership.isModerator, true);
   *     return 'success';
   *   });
   *   // => success
   */
  update: function update(membership) {
    var id = membership.id || membership;
    return this.request({
      method: 'PUT',
      uri: this.config.hydraServiceUrl + '/memberships/' + id,
      body: membership
    }).then(function (res) {
      return res.body;
    });
  }
}); /**!
     *
     * Copyright (c) 2015-2016 Cisco Systems, Inc. See LICENSE file.
     * @private
     */

exports.default = Memberships;
//# sourceMappingURL=memberships.js.map
