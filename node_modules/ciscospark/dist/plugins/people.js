'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sparkCore = require('@ciscospark/spark-core');

/**
 * @typedef {Object} Types~Person
 * @property {uuid} id - Unique identifier for the person
 * @property {Array<email>} emails - Email addresses of the person
 * @property {string} displayName - Display name of the person
 * @property {isoDate} created - The date and time that the person was created
 */

/**
 * @class
 * @extends SparkPlugin
 */
var People = _sparkCore.SparkPlugin.extend({
  /**
   * Returns a single person by ID
   * @instance
   * @memberof People
   * @param {Types~Person|uuid} person
   * @returns {Promise<Types~Person>}
   * @example
   * var ciscospark = require('../..');
   * ciscospark.rooms.create({title: 'Get Person Example'})
   *   .then(function(room) {
   *     return ciscospark.memberships.create({
   *       personEmail: 'alice@example.com',
   *       roomId: room.id
   *     });
   *   })
   *   .then(function(membership) {
   *     return ciscospark.people.get(membership.personId);
   *   })
   *   .then(function(alice) {
   *     var assert = require('assert');
   *     assert(alice.id);
   *     assert(Array.isArray(alice.emails));
   *     assert.equal(alice.emails.filter(function(email) {
   *       return email === 'alice@example.com';
   *     }).length, 1);
   *     assert(alice.displayName);
   *     assert(alice.created);
   *     return 'success';
   *   });
   *   // => success
   */
  get: function get(person) {
    var id = person.personId || person.id || person;
    return this.request({
      uri: this.config.hydraServiceUrl + '/people/' + id
    }).then(function (res) {
      return res.body;
    });
  },


  /**
   * Returns a list of people
   * @instance
   * @memberof People
   * @param {Object} options
   * @param {email} options.email - Returns people with an email that contains this string
   * @param {string} options.name - Returns people with a name that contains this string
   * @returns {Promise<Page<Types~Person>>}
   * @example
   * var ciscospark = require('../..');
   * var room;
   * ciscospark.rooms.create({title: 'List People Example'})
   *   .then(function(r) {
   *     room = r;
   *     return ciscospark.memberships.create({
   *       personEmail: 'alice@example.com',
   *       roomId: room.id
   *     });
   *   })
   *   .then(function() {
   *     return ciscospark.memberships.create({
   *       personEmail: 'bob@example.com',
   *       roomId: room.id
   *     });
   *   })
   *   .then(function() {
   *     return ciscospark.people.list({email: 'alice@example.com'});
   *   })
   *   .then(function(people) {
   *     var assert = require('assert');
   *     assert.equal(people.length, 1);
   *     var person = people.items[0];
   *     assert(person.id);
   *     assert(Array.isArray(person.emails));
   *     assert(person.displayName);
   *     assert(person.created);
   *     return 'success';
   *   });
   *   // => success
   */
  list: function list(options) {
    var _this = this;

    return this.request({
      uri: this.config.hydraServiceUrl + '/people',
      qs: options
    }).then(function (res) {
      return new _sparkCore.Page(res, _this.spark);
    });
  }
}); /**!
     *
     * Copyright (c) 2015-2016 Cisco Systems, Inc. See LICENSE file.
     * @private
     */

exports.default = People;
//# sourceMappingURL=people.js.map
