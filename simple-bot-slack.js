/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* require('dotenv').load(); */

var Botkit = require('botkit');
var express = require('express');
var middleware = require('botkit-middleware-watson')({
  iam_apikey: process.env.ASSISTANT_IAM_APIKEY,
  workspace_id: process.env.WORKSPACE_ID,
  url: process.env.ASSISTANT_URL || 'https://gateway.watsonplatform.net/assistant/api',
  version: '2018-09-20'
});

console.log("Running with DEBUG_MODE set to " + process.env.DEBUG_MODE)

if (process.env.DEBUG_MODE == "true") {
  console.log("SLACK_TOKEN = " + process.env.SLACK_TOKEN);
  console.log("SLACK_SIGNING_SECRET =  " + process.env.SLACK_SIGNING_SECRET);
  console.log("ASSISTANT_IAM_APIKEY = " + process.env.ASSISTANT_IAM_APIKEY);
  console.log("ASSISTANT_URL = " + process.env.ASSISTANT_URL);
  console.log("WORKSPACE_ID = " + process.env.WORKSPACE_ID);
}
// Configure your bot.
var slackController = Botkit.slackbot({ clientSigningSecret: process.env.SLACK_SIGNING_SECRET });
var slackBot = slackController.spawn({
  token: process.env.SLACK_TOKEN
});
slackController.hears(['.*'], ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
  slackController.log('Slack message received');
  middleware.interpret(bot, message, function() {
    if (message.watsonError) {
      console.log(message.watsonError);
      bot.reply(message, message.watsonError.description || message.watsonError.error);
    } else if (message.watsonData && 'output' in message.watsonData) {
      bot.reply(message, message.watsonData.output.text.join('\n'));
    } else {
      console.log('Error: received message in unknown format. (Is your connection with Watson Assistant up and running?)');
      bot.reply(message, 'I\'m sorry, but for technical reasons I can\'t respond to your message');
    }
  });
});

slackBot.startRTM();

// Create an Express app
var app = express();
var port = process.env.PORT || 5000;
app.set('port', port);
app.listen(port, function() {
  console.log('Client server listening on port ' + port);
});
