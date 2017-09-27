# zbot - To the south is a readme

Play Zork or other Interactive Fiction games over SMS with Tropo or in Cisco Spark
rooms. Released under the MIT License. See LICENSE for details.

This bot can play any zcode encoded interactive fiction games, including the
popular Zork.

## Spark Room

*You're in a [Cisco Spark](https://ciscospark.com) Room. There's a bot here that
plays text adventure games. The game that's installed right now is Zork I.*

Add the bot to your own rooms by adding textadventure@sparkbot.io to your Spark
room.

You can also start a direct conversation with the bot by sending a Spark message
to textadventure@sparkbot.io.

## SMS Conversation

*You're in an SMS client. There's a phone number here.*

If you're in the US or Canada, you can send a text message to +1-844-373-9675 to
play Zork over SMS, powered by [Tropo](https://www.tropo.com). Outside the US,
try +1-541-936-9675, but this has a lower capacity and may not work as well during
busy times.

In either case, your carrier's normal text or data rates apply.

## Configuring your own

First, [create a bot on Cisco Spark](https://developer.ciscospark.com/bots.html) and note
the bot's Access Token.

### Starting the app, the easy way

*There are two Containers here.*

The zbot has a Dockerfile and uses docker-compose to config and deploy docker
containers with all of the required components. If you're not using Docker, find
*Starting the app, the hard way* later on in this document for details on how to
start the application and components.

The zbot-api container relies on two Docker Volumes for storing saved games and
the zcode that makes up each game. Create a Volume called `zsaves` and a Volume
called zcode:

```
docker volume create --name zsaves
docker volume create --name zcode
```

Copy a zcode file (see *Where are the games?*) into the `zcode` volume.

Copy `docker-compose.yml.example` to `docker-compose.yml`. Change the access token
in `CISCOSPARK_ACCESS_TOKEN=YOUR-BOT-ACCESS-TOKEN` to your own access token. By
default, zbot tries to start a zcode file called *zork.z5*. If you've installed
a different game, change `DEFAULT_GAME=Zork` to your game file, without the .z5
file extension.

Then run

```
docker-compose up -d
```

You'll have the bot's web services running on port 3000.

### Setting up Spark

Using your bot's access token, [Create a Spark Webhook](https://developer.ciscospark.com/endpoint-webhooks-post.html)
with the `name` "zbot messages", a `resource` of "messages", and an `event` of "created."
Set the `targetUrl` to *http://your-docker-container:3000/spark*

Create another Spark Webhook with your bot's access token. Call this one "zbot membership"
and set the `resource` to "memberships", and the `event` to "created." Set the
`targetUrl` to *http://your-docker-container:3000/sparkroom*

Spark is now set up and you can add your bot to a room by it's email address. Or
start a direct conversation with the bot.

### Setting up SMS

Create a new [Tropo](https://www.tropo.com) application. Set the application type
to *WebAPI* and the application URL to *http://your-docker-container:3000/tropo*

Choose an SMS-enabled phone number for the Tropo application. Save your application.

Send a text message to your number. You might need to wait a minute or two for the
number to become completely provisioned in Tropo.

### Starting the app, the hard way

To set up your own bot, you'll need [zmachine-api](https://github.com/akalsey/zmachine-api/tree/deploy).
That link points to a forked version of the [original](https://github.com/opendns/zmachine-api/)
that has a few more features.

Run zmachine-api as a node app. Then start zbot using an environment variable called
APIHOST to tell zbot what URL the API is located at:

```
APIHOST=http://zmachine-api.example.com:8000/ node index.js
```

Other application configuration can also be done through environment variables as
well. If you want to host a Cisco Spark bot, you'll need to set CISCOSPARK_ACCESS_TOKEN
to your bot's access token. If you want to run a different zcode game (other than
Zork), you can specify the zcode filename, without extension, in DEFAULT_GAME.
And to choose which port the bot listens on, set PORT.

To install a game, put it in the "games" directory of the z-machine API application.

## Where are the games?

*There's a zcode file on the table.*

The bot can play any [Z-Machine game](https://en.wikipedia.org/wiki/Z-machine),
but because most are copyrighted (even ones that are free to download and play),
the bot doesn't come with any games. You'll need to download some yourself and copy
them to the zcode Volume (if using Docker) or the "games" directory of the z-machine
API application (if not using Docker).

You can find games to install in a number of places online. Try [IFDB](http://ifdb.tads.org/)
or [Interactive Fiction Archive](http://www.ifarchive.org/) to get started.

Infocom has also made [Zork 1-3 available for free](http://www.infocom-if.org/downloads/downloads.html)
online. When you download and uzip these games (don't download the Mac version,
it's just a compiled Mac Classic application), you'll find a directory called
`DATA` and inside that directory is the zcode file, with a *.DAT* file extension.

Rename whatever zcode files you download to have a .z5 extension, since that's
the extension expected by the z-machine API. For example, in the textadventure Spark
bot, Zork runs from a zcode file called "zork.z5".

## Acknowledgements

The z-machine interpreter that the game relies on is the excellent
[Dumb Frotz](https://github.com/DavidGriffith/frotz). Frotz does all the heavy
lifting for the bot.

The bot relies on a REST API frontend to frotz called
[zmachine-api](https://github.com/opendns/zmachine-api/). The version used by zbot
is modified to add a couple of new APIs and improve logging. The modified version
can be found in the ["deploy" branch of my forked Github repo](https://github.com/akalsey/zmachine-api/). Pull requests have been sent, so
hopefully this modified branch can go away eventually.  