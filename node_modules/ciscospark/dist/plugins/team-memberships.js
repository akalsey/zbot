'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sparkCore = require('@ciscospark/spark-core');

/**
 * @typedef {Object} Types~TeamMembership
 * @property {string} id - (server generated) The team ID
 * @property {string} personId - The person ID
 * @property {string} personEmail - The email address of the person
 * @property {boolean} isModerator - Set to `true` to make the person a team
 * moderator
 */

/**
 * Team Memberships represent a person's relationship to a team. Use this API to
 * list members of any team that you're in or create memberships to invite
 * someone to a team. Team memberships can also be updated to make someome a
 * moderator or deleted to remove them from the team.
 *
 * Just like in the Spark app, you must be a member of the team in order to list
 * its memberships or invite people.
 * @class
 * @extends SparkPlugin
 */
var TeamMemberships = _sparkCore.SparkPlugin.extend({
  /**
   * Add someone to a team by Person ID or email address; optionally making them
   * a moderator.
   * @instance
   * @memberof TeamMemberships
   * @param {Types~TeamMembership} membership
   * @returns {Promise<Types~TeamMembership>}
   * @example
   * var ciscospark = require('../..');
   * ciscospark.teams.create({name: 'Create Team Membership Example'})
   *   .then(function(team) {
   *     return ciscospark.teamMemberships.create({
   *      personEmail: 'alice@example.com',
   *      teamId: team.id
   *    });
   *   })
   *   .then(function(membership) {
   *     var assert = require('assert');
   *     assert(membership.id);
   *     assert(membership.teamId);
   *     assert(membership.personId);
   *     assert(membership.personEmail);
   *     assert('isModerator' in membership);
   *     assert(membership.created);
   *     return 'success';
   *   });
   *   // => success
   */
  create: function create(membership) {
    return this.request({
      method: 'POST',
      uri: this.config.hydraServiceUrl + '/team/memberships',
      body: membership
    }).then(function (res) {
      return res.body;
    });
  },


  /**
   * Get details for a membership by ID.
   * @instance
   * @memberof TeamMemberships
   * @param {Types~TeamMembership|string} membership
   * @returns {Promise<Types~TeamMembership>}
   * @example
   * var ciscospark = require('../..');
   * var membership;
   * ciscospark.teams.create({name: 'Get Team Memberships Example'})
   *   .then(function(team) {
   *     return ciscospark.teamMemberships.create({
   *       personEmail: 'alice@example.com',
   *       teamId: team.id
   *     });
   *   })
   *   .then(function(m) {
   *     membership = m;
   *     return ciscospark.teamMemberships.get(m.id);
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
      uri: this.config.hydraServiceUrl + '/team/memberships/' + id
    }).then(function (res) {
      return res.body.items || res.body;
    });
  },


  /**
   * Lists all team memberships. By default, lists memberships for teams to
   * which the authenticated user belongs.
   * @instance
   * @memberof TeamMemberships
   * @param {Object} options
   * @param {string} options.max
   * @returns {[type]}
   * @example
   * var ciscospark = require('../..');
   * var team;
   * ciscospark.teams.create({name: 'List Team Memberships Example'})
   *   .then(function(t) {
   *     team = t;
   *     return ciscospark.teamMemberships.create({
   *      personEmail: 'alice@example.com',
   *      teamId: team.id
   *     });
   *   })
   *   .then(function() {
   *     return ciscospark.teamMemberships.list({teamId: team.id});
   *   })
   *   .then(function(teamMemberships) {
   *     var assert = require('assert');
   *     assert.equal(teamMemberships.length, 2);
   *     for (var i = 0; i < teamMemberships.length; i++) {
   *       assert.equal(teamMemberships.items[i].teamId, team.id);
   *     }
   *     return 'success';
   *   });
   *   // => success
   */
  list: function list(options) {
    var _this = this;

    return this.request({
      uri: this.config.hydraServiceUrl + '/team/memberships',
      qs: options
    }).then(function (res) {
      return new _sparkCore.Page(res, _this.spark);
    });
  },


  /**
   * Deletes a membership by ID.
   * @instance
   * @memberof TeamMemberships
   * @param {Types~TeamMembership|string} membership
   * @returns {Promise}
   * @example
   * var ciscospark = require('../..');
   * var membership, team;
   * ciscospark.teams.create({name: 'Remove Team Memberships Example'})
   *   .then(function(t) {
   *     team = t;
   *     return ciscospark.teamMemberships.create({
   *      personEmail: 'alice@example.com',
   *      teamId: team.id
   *     });
   *   })
   *   .then(function(m) {
   *     membership = m;
   *     return ciscospark.teamMemberships.list({teamId: team.id});
   *   })
   *   .then(function(teamMemberships) {
   *     var assert = require('assert');
   *     assert.equal(teamMemberships.length, 2);
   *     return ciscospark.teamMemberships.remove(membership);
   *   })
   *   .then(function() {
   *     return ciscospark.teamMemberships.list({teamId: team.id});
   *   })
   *   .then(function(teamMemberships) {
   *     var assert = require('assert');
   *     assert.equal(teamMemberships.length, 1);
   *     return 'success';
   *   });
   *   // => success
   */
  remove: function remove(membership) {
    var id = membership.id || membership;

    return this.request({
      method: 'DELETE',
      uri: this.config.hydraServiceUrl + '/team/memberships/' + id
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
   * Updates properties for a membership.
   * @instance
   * @memberof TeamMemberships
   * @param {Types~TeamMembership} membership
   * @returns {Promise<Types~TeamMembership>}
   */
  update: function update(membership) {
    var id = membership.id || membership;
    return this.request({
      method: 'PUT',
      uri: this.config.hydraServiceUrl + '/team/memberships/' + id,
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

exports.default = TeamMemberships;
//# sourceMappingURL=team-memberships.js.map
