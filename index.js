var express = require('express');
var bodyParser = require('body-parser');
var rp = require('request-promise');
var request = require('request');
var troposdk = require('tropo-webapi');
var util = require('util')
var Promise = require("bluebird");
var ciscospark = require("ciscospark");
var logger = require('winston');
var textchunk = require('textchunk');

var app = express();

var port = process.env.PORT || 5432;

logger.level = process.env.LOG_LEVEL || 'warn';
logger.log('debug', 'Logging at', process.env.LOG_LEVEL);

var zmachine = process.env.APIHOST;

var sparkbotself = '';

// Who am I? Allows me to ignore Spark messages sent by myself
ciscospark.people.get('me')
  .then(me => {
    logger.log('debug', 'My Spark data is ', me);
    sparkbotself = me.id;
  })
  .catch(function (err) {
    logger.log('warn', "I don't know who I am on Spark.", err);
  });

var defaultgame = process.env.DEFAULT_GAME || 'Zork';

app.use(bodyParser.json()); // to support JSON-encoded bodies

// A Tropo text message webapi listener. Each incoming caller ID is treated as
// a different game.
// Set your Tropo app to WebAPI with an app URL of <your-server>/tropo
app.post('/tropo', function(req, res) {
  logger.log('silly', 'Incoming Tropo message', req.body);

    if (req.body.session.to.channel == 'TEXT') {
      var message = req.body.session.initialText;
      var session = req.body.session.from.e164Id;

      performAction(message, session)
        .then(reply => {
          var tropo = new troposdk.TropoWebAPI();
          textchunk.chunk(reply, 140, {callback: function(result) {
            result.forEach(function(chunk) {
              tropo.say(chunk);
              tropo.wait(1200);
            });
            var tropoML = troposdk.TropoJSON(tropo);
            logger.log('debug', 'Sending TropoML', tropoML);
            res.send(tropoML);
          }});
        })
        .catch(function (err) {
          writelog('error', 'Tropo action failed', err);
        });
    } else {
      logger.log('debug', 'Rejecting voice call');
      tropo.reject();
      var tropoML = troposdk.TropoJSON(tropo);
      logger.log('silly', 'Sending TropoML', tropoML);
      res.send(tropoML);
    }
});

// A health check URL.  Does a self diagnostic and tells what might be wrong
app.get('/healthcheck', function(req, res) {
  ciscospark.people.get('me')
    .then(me => {
      res.send('Spark API OK')
      logger.log('debug', 'HEALTH I am', me);
    })
    .catch(function (err) {
      logger.log('warn', "HEALTH something is wrong.", err);
      res.send('Spark API ERROR ' + err);
    });

    request(zmachine + 'titles/', function (error, response, body) {
      if (error) {
        writelog('warn', "HEALTH something is wrong.", error);
        res.send('zmachine API connection ERROR');
      } else if (response.statusCode != 200) {
        writelog('warn', "HEALTH something is wrong.", response.statusCode);
        res.send('zmachine API ERROR');
      } else {
        logger.log('debug', "HEALTH API OK");
        res.send('zmachine API OK');
      }
    });
});

// A Cisco Spark message webhook listener. Each Spark room is treated as
// a different game.
// Create a Message webhook as your bot with a URL of <your-server>/spark
// an action of 'create' and no room filter
// Set the env variable CISCOSPARK_ACCESS_TOKEN to your bot's access token
app.post('/spark', function(req, res) {
  logger.log('debug', 'Spark wehook', req.body);

    if (req.body.data.personId == sparkbotself) {
      logger.log('silly', "It's my own message.");
      return;
    }

    var session = req.body.data.roomId;
    var sha1 = require('sha1');

    ciscospark.messages.get(req.body.data.id)
      .then(message => {
        logger.log('debug', 'Spark message content', message);
        // messages without mentions or markdown don't have HTML
        if (message.html) {
          // strip the mention & HTML from the message
          var pattern = new RegExp('<spark-mention[^>]*data-object-id="' + sparkbotself + '"[^>]*>[^<]*<\/spark-mention>');
          var action = message.html.replace(pattern,'');
          action = action.replace(/<[^>]*>/g,'');
        } else {
          action = message.text;
        }
        // Spark room IDs are too long for Frotz to use as filenames
        // shorten by hashing
        return performAction(action, sha1(session));
      })
      .then(reply => {
        logger.log('silly', 'replying', reply);
        res.send(reply);
        return sparkmessage(reply, session);
      })
      .catch(function (err) {
        logger.log('silly', 'catching error', err);
        writelog('error', 'Spark action failed', err, reply, req.body);
        res.status(500).send("Something went very wrong. It's not you, it's me.");
        return sparkmessage("Something went very wrong. It's not you, it's me.`", session);
      });
});

function writelog(level, message, data) {
  logger.log(level, message, data);
  if (process.env.ADMIN && level == "error") {
    var text = level + ' - ' + message + ' ' + util.inspect(data, {showHidden: false, depth: null});
    text = text.substring(0, 7439);
    var message = {
      text: text,
      toPersonEmail: process.env.ADMIN
    };
    return ciscospark.messages.create(message)
    .catch(function (err) {
      logger.log('silly', 'catching error', err);
      logger.log('error', 'Spark action failed', err, message);
    });;
  }
}

// A Cisco Spark membership webhook listener. When the bot is added to a room,
// it will start a game.
// Create a Membership webhook as your bot with a URL of <your-server>/sparkroom
// an event of 'created' and a filter of personEmail = adventure@sparkbot.io
// Set the env variable CISCOSPARK_ACCESS_TOKEN to your bot's access token
app.post('/sparkroom', function(req, res) {
  logger.log('debug', 'Spark wehook', req.body);

    var session = req.body.data.roomId;
    var sha1 = require('sha1');

    var introduction = "Oh, hello there!\n\nI'm a bot for playing text adventure games. Thanks for adding me to this space. I'm going to start a game of **" + defaultgame + "** now. Anyone can play. Just remember to @mention me when giving commands, so I know you're talking to me.";

    return sparkmessage(introduction, session)
    .then(reply => {
      return performAction('look', sha1(session))
    })
    .then(reply => {
      res.send(reply);
      return sparkmessage(reply, session);
    })
    .catch(function (err) {
      writelog('error', 'sparkroom error', err);
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
  logger.log('debug', 'Sending message to Spark', message);
  return ciscospark.messages.create(message)
  .catch(function (err) {
    logger.log('silly', 'catching error', err);
    writelog('error', 'Spark action failed', err);
  });
  ;
}

function performAction(action, session) {
  action = action.trim();
  logger.log('silly', 'action requested', action);
  logger.log('silly', 'session', session);

  var restore = {
    method: 'POST',
    json: true,
    simple: false,
    resolveWithFullResponse: true,
    body: {file: "save"},
    forever: true // solves a funky bug with some versions of node
  }

  var save = {
    method: 'POST',
    json: true,
    body: {file: "save"},
    forever: true // solves a funky bug with some versions of node
  }

  var del = {
    method: 'DELETE',
    json: true,
    forever: true // solves a funky bug with some versions of node
  }

  var act = {
    method: 'POST',
    body: { action: action },
    json: true,
    forever: true // solves a funky bug with some versions of node
  };

  var create = {
    method: 'POST',
    uri: zmachine + 'games/',
    json: true,
    body: { game: defaultgame.toLowerCase(), label: session },
    forever: true // solves a funky bug with some versions of node
  };

  var gameid;
  var reply;

  return rp(create)
    .then(response => {
      // Game spawned, store the response in case it's a new game
      reply =  response.data;
      gameid = response.pid;
      logger.log('debug', 'Game spawned', response.pid);
      restore.uri = zmachine + 'games/' + gameid + '/restore';
      logger.log('debug', 'Attempting to restore', restore);
      return rp(restore);
    })
    .then(response => {
      if (response.statusCode == '200') {
        // game already exists
        logger.log('debug', 'Found a game', response.body);
        gameid = response.body.pid;
        // Block actions that make no sense in this context.
        switch (action.toLowerCase()) {
          case 'quit':
          case 'q':
          case 'save':
          case 'restore':
          case 'restart':
          case 'script':
          case 'unscript':
            reply = "Sorry, I can't do that.";
            return response;
          case '/game':
            reply = "Not yet.";
            return response;
        }
        act.uri = zmachine + 'games/' + gameid + '/action';
        act.body = {action: action};
        // Send the player's command to zmachine, store the game's response
        return rp(act);
      } else {
        // game isn't saved, so it's a new game, we're done
        logger.log('debug', 'New game', response.body);
        return reply;
      }
    })
    .then(response => {
      // If this was a new game, then there's no data element in the body
      // but if it was an action on an existing game, update the reply.
      if (undefined !== response.data) {
        reply = response.data;
      }
      logger.log('debug', 'saving game', gameid);
      save.uri = zmachine + 'games/' + gameid + '/save';
      return rp(save); // save the game
    })
    .then(response =>  {
      logger.log('debug', 'tearing down game', gameid);
      del.uri = zmachine + 'games/' + gameid;
      rp(del); // tear down the zmachine
      return reply;
    })
    .catch(function (err) {
      writelog('error', 'Something went wrong', err);
      reply = "Something went very wrong. It's not you, it's me."
    })
    .finally(function(response) {
      // Return whatever is stored in `reply`
      logger.log('silly', 'Replying', reply.replace(/\r?\n|\r/g, '/n'));
      return reply;
    });
}

var server = app.listen(port, function() {
  var host = server.address().address;
  var port = server.address().port;

  logger.log('info', 'listening', {host: host, port: port});
  })
  .on('error', function(err){
    console.log('on error handler');
    console.log(err);
});

process.on('uncaughtException', function(err) {
    console.log('process.on handler');
    console.log(err);
});