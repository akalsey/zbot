var express = require('express');
var bodyParser = require('body-parser');
var rp = require('request-promise');
var request = require('request');
var troposdk = require('tropo-webapi');
var util = require('util')
var Promise = require("bluebird");
var ciscospark = require("ciscospark");

var app = express();

var port = 5432;

var zmachine = 'http://localhost:'+port+'/zmachine/';

app.use('/zmachine', require('../zmachine-api/src/app'));

//var sparkbearer = 'YzA3OGYwMTItYjBhOS00NTA0LTg3NDYtZTY4MjA4ZWIwYzMzOTNhM2QzYzItYjBj';

app.use(bodyParser.json()); // to support JSON-encoded bodies

app.post('/tropo', function(req, res) {
    if (req.body.session.to.channel == 'TEXT') {
      var message = req.body.session.initialText;
      var session = req.body.session.from.e164Id;

      performAction(message, session)
        .then(reply => {
          var tropo = new troposdk.TropoWebAPI();
          tropo.say(reply);
          res.send(troposdk.TropoJSON(tropo));
        })
        .catch(function (err) {
            console.log("something went wrong in the action " + err);
        });
    } else {
      tropo.reject();
      res.send(troposdk.TropoJSON(tropo));
    }
});

app.post('/spark', function(req, res) {
    var session = req.body.data.roomId;

    ciscospark.messages.get(req.body.data.id)
      .then(message => {
        return performAction(message.text, session);
      })
      .then(reply => {
        //var md = reply.replace(/^/g, "`");
        var md = reply.replace(/\n/, "`\n");
        md = "`" + md;
        md = md.replace(/\n/g, "<br/>");
        res.send(md);
        //res.send(reply);
        return ciscospark.messages.create({
          markdown: md,
          text: reply,
          roomId: session
        });
      })
      .catch(function (err) {
          console.log("something went wrong in the action " + err);
      });
});

function performAction(action, session) {
  var find = {
    method: 'GET',
    uri: zmachine + 'games/',
    json: true
  }

  var act = {
    method: 'POST',
    body: {
        action: action
    },
    json: true
  };

  var create = {
    method: 'POST',
    uri: zmachine + 'games/',
    json: true
  };

  return rp(find)
    .then(body => {
      var game = body.find(o => o.label === session);
      if (undefined != game && game.pid) {
        // there is a game already, send the action to it
        act.uri = zmachine + 'games/' + game.pid + '/action';
        act.body = {action: action};
        return rp(act);
      } else {
        // start a new game & return the intro
        create.body = { game: 'zork', label: session };
        return rp(create);
      }
    })
    .then(response => {
      reply = response.data
      console.log(reply);
      return reply;
    })
    .catch(function (err) {
        console.log("something went wrong " + err);
    });
}


var server = app.listen(port, function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log('All listening on %s:%s', host, port);
});