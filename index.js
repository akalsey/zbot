var express = require('express');
var bodyParser = require('body-parser');
var rp = require('request-promise');
var request = require('request');
var troposdk = require('tropo-webapi');
var util = require('util')
var Promise = require("bluebird");
var ciscospark = require("ciscospark");
const winston = require('winston');

var app = express();

var port = process.env.PORT || 5432;

winston.level = process.env.LOG_LEVEL || 'warn';

var zmachine = process.env.APIHOST;

var sparkbotself = '';

// Who am I? Allows me to ignore Spark messages sent by myself
ciscospark.people.get('me')
  .then(me => {
    winston.log('debug', 'My Spark data is ', me);
    sparkbotself = me.id;
  })
  .catch(function (err) {
    winston.log('error', "I don't know who I am on Spark.", err);
  });


app.use(bodyParser.json()); // to support JSON-encoded bodies

// A Tropo text message webapi listener. Each incoming caller ID is treated as
// a different game.
// Set your Tropo app to WebAPI with an app URL of <your-server>/tropo
app.post('/tropo', function(req, res) {
  winston.log('silly', 'Incoming Tropo message', req.body);
    if (req.body.session.to.channel == 'TEXT') {
      var message = req.body.session.initialText;
      var session = req.body.session.from.e164Id;

      performAction(message, session)
        .then(reply => {
          winston.log('debug', 'Tropo reply', {reply: reply, session: session});
          var tropo = new troposdk.TropoWebAPI();
          tropo.say(reply);
          var tropoML = troposdk.TropoJSON(tropo);
          winston.log('silly', 'Sending TropoML', tropoML);
          res.send(tropoML);
        })
        .catch(function (err) {
          winston.log('error', 'Tropo action failed', err);
        });
    } else {
      winston.log('debug', 'Rejecting voice call');
      tropo.reject();
      var tropoML = troposdk.TropoJSON(tropo);
      winston.log('silly', 'Sending TropoML', tropoML);
      res.send(tropoML);
    }
});

// A Cisco Spark message webhook listener. Each Spark room is treated as
// a different game.
// Create a Message webhook as your bot with a URL of <your-server>/spark
// an action of 'create' and no room filter
// Set the env variable CISCOSPARK_ACCESS_TOKEN to your bot's access token
app.post('/spark', function(req, res) {
  winston.log('debug', 'Spark wehook', req.body);

    if (req.body.data.personId == sparkbotself) {
      winston.log('silly', "It's my own message.");
      return;
    }

    var session = req.body.data.roomId;

    ciscospark.messages.get(req.body.data.id)
      .then(message => {
        winston.log('debug', 'Spark message content', message);
        // strip the mention & HTML from the message
        var pattern = new RegExp('<spark-mention[^>]*data-object-id="' + sparkbotself + '"[^>]*>[^<]*<\/spark-mention>');
        var action = message.html.replace(pattern,'');
        action = action.replace(/<[^>]*>/g,'')
        return performAction(action, session);
      })
      .then(reply => {
        res.send(reply);
        return sparkmessage(reply, session);
      })
      .catch(function (err) {
        winston.log('error', 'Spark action failed', err);
      });
});

// A Cisco Spark membership webhook listener. When the bot is added to a room,
// it will start a game.
// Create a Membership webhook as your bot with a URL of <your-server>/sparkroom
// an event of 'created' and a filter of personEmail = adventure@sparkbot.io
// Set the env variable CISCOSPARK_ACCESS_TOKEN to your bot's access token
app.post('/sparkroom', function(req, res) {
  winston.log('debug', 'Spark wehook', req.body);

    var session = req.body.data.roomId;
    var create = {
      method: 'POST',
      uri: zmachine + 'games/',
      json: true
    };

    create.body = { game: 'zork', label: session };
    return rp(create)
      .then(response => {
        reply = response.data
        winston.log('silly', 'zmachine reply', reply);
        return sparkmessage(reply, session);
      })
      .catch(function (err) {
        winston.log('error', 'Something went wrong', err);
        return sparkmessage("Something went very wrong. It's not you, it's me.", session);
      });
});

function sparkmessage(text, room) {
  var md = text.replace(/\n/, "`\n");
  md = "`" + md;
  md = md.replace(/\n/g, "<br/>");
  var message = {
    markdown: md,
    text: text,
    roomId: room
  };
  winston.log('debug', 'Sending message to Spark', message);
  return ciscospark.messages.create(message);
}

function performAction(action, session) {
  action = action.trim();
  winston.log('silly', 'action requested', action);

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
      winston.log('silly', 'games running ', body);
      var game = body.find(o => o.label === session);
      if (undefined != game && game.pid) {
        winston.log('silly', 'Existing game found', game);
        // there is a game already, send the action to it
        switch (action.toLowerCase()) {
          case 'quit':
          case 'save':
          case 'restore':
          case 'restart':
          case 'script':
          case 'unscript':
            return {data: "Sorry, I can't do that."};
          case '/game':
            return {data: "Not yet."};
        }
        act.uri = zmachine + 'games/' + game.pid + '/action';
        act.body = {action: action};
        return rp(act);
      } else {
        // start a new game & return the intro
        winston.log('silly', 'No game found, starting new one.', body);
        create.body = { game: 'zork', label: session };
        return rp(create);
      }
    })
    .then(response => {
      reply = response.data
      winston.log('silly', 'zmachine reply', reply);
      return reply;
    })
    .catch(function (err) {
      winston.log('error', 'Something went wrong', err);
      return "Something went very wrong. It's not you, it's me."
    });
}

var server = app.listen(port, function() {
    var host = server.address().address;
    var port = server.address().port;

    winston.log('info', 'listening', {host: host, port: port});
});