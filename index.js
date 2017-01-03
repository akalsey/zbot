var express = require('express');
var bodyParser = require('body-parser');
var rp = require('request-promise');
var request = require('request');
var troposdk = require('tropo-webapi');
var util = require('util')
var Promise = require("bluebird");
var ciscospark = require("ciscospark");
var logger = require('winston');

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
          splittext(reply, 140, function(result) {
            result.forEach(function(chunk) {
              tropo.say(chunk);
              tropo.wait(500);
            });
            var tropoML = troposdk.TropoJSON(tropo);
            logger.log('debug', 'Sending TropoML', tropoML);
            res.send(tropoML);
          });
        })
        .catch(function (err) {
          logger.log('error', 'Tropo action failed', err);
        });
    } else {
      logger.log('debug', 'Rejecting voice call');
      tropo.reject();
      var tropoML = troposdk.TropoJSON(tropo);
      logger.log('silly', 'Sending TropoML', tropoML);
      res.send(tropoML);
    }
});

// Split text into *lenght* sized chunks, attempting to split on
// sentence boundaries if possible.
function splittext(text, length, callback) {
  var tokenizer = require('sbd');
  var sentences = tokenizer.sentences(text);
  var result = [];
  var stringcount = 0;
  var tmpstring = '';
  while(sentence = sentences.shift()) {
    var s = tmpstring + sentence + ' ';
    if (sentence.length >= length) {
      // the sentence has no newlines and exceeds our length, so split it up in the middle
      var parts = sentence.match(new RegExp('.{1,'+length+'}', "g")) || [];
      result = result.concat(parts);
    } else if (stringcount + s.length <= length) {
      // adding this sentence won't cause us to exceed length
      stringcount += s.length;
      tmpstring = s;
    } else {
      // adding sentence would cause excessive length, push to result and reset
      result.push(tmpstring);
      stringcount = 0;
      tmpstring = '';
    }
  }
  // If last iteration left us with leftover content, add to the result
  if (tmpstring.length) {
    result.push(tmpstring);
  }
  logger.log('debug', 'reply chunked into ' + length + ' characters', result);

  callback(result);
  return result;
}

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
        res.send(reply);
        return sparkmessage(reply, session);
      })
      .catch(function (err) {
        logger.log('error', 'Spark action failed', err);
      });
});

// A Cisco Spark membership webhook listener. When the bot is added to a room,
// it will start a game.
// Create a Membership webhook as your bot with a URL of <your-server>/sparkroom
// an event of 'created' and a filter of personEmail = adventure@sparkbot.io
// Set the env variable CISCOSPARK_ACCESS_TOKEN to your bot's access token
app.post('/sparkroom', function(req, res) {
  logger.log('debug', 'Spark wehook', req.body);

    var session = req.body.data.roomId;
    var sha1 = require('sha1');

    var introduction = "Oh, hello there!\n\nI'm a bot for playing text adventure games. Thanks for adding me to this room. I'm going to start a game of **" + defaultgame + "** now. Anyone can play. Just remember to @mention me when giving commands, so I know you're talking to me.";

    return sparkmessage(introduction, session)
    .then(reply => {
      return performAction('look', sha1(session))
    })
    .then(reply => {
      res.send(reply);
      return sparkmessage(reply, session);
    })
    .catch(function (err) {
      logger.log('error', 'sparkroom error', err);
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
  return ciscospark.messages.create(message);
}

function performAction(action, session) {
  action = action.trim();
  logger.log('silly', 'action requested', action);

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
      // Game spawned, sttore the response in case it's a new game
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
        save.uri = zmachine + 'games/' + gameid + '/save';
        del.uri = zmachine + 'games/' + gameid;
        // Send the player's command to zmachine, store the game's response
        return rp(act)
          .then(response => {
            reply = response.data;
            logger.log('debug', 'saving game', gameid);
            return rp(save); // save the game
          })
          .then(response =>  {
            logger.log('debug', 'tearing down game', gameid);
            rp(del); // tear down the zmachine
            return reply;
          })
          .catch(function (err) {
            logger.log('error', 'Something went wrong', err);
            reply = "Something went very wrong. It's not you, it's me.";
          });
      } else {
        // game isn't saved, so it's a new game, we're done
        logger.log('debug', 'New game', response.body);
        return response;
      }
    })
    .catch(function (err) {
      logger.log('error', 'Something went wrong', err);
      reply = "Something went very wrong. It's not you, it's me."
    })
    .finally(function(response) {
      // Return whatever is stored in `reply`
      logger.log('debug', 'Replying', reply);
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