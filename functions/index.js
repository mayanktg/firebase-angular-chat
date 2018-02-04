/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 * ...
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const movies = require('./movies_bot/movies_bot.js');

admin.initializeApp(functions.config().firebase);

function getTextMessage(clientText) {
  let serverText = `Hello! I'm your server speaking, I know nothing!`;
  console.log('getTextMessage', clientText);
  return new Promise(function(resolve, reject) {
    if (clientText.indexOf('@movies') > -1) {
      return movies.getRecommendation(clientText)
        .then(function(text) {
          console.log('MOVIE_RECOMMENTAITON_TEXT', text);
          if (text && text.length > -1) {
            serverText = text;
          } else {
            serverText = 'Sorry no recomendations found';
          }
          return resolve(serverText);
        })
        .catch(function(err) {
          console.log('MOVIE_RECOMMENTAITON_ERROR', err);
          serverText = 'Sorry no recoomendations found';
          return resolve(serverText);
        });
    } else {
      return resolve(serverText);
    }
  });
}

/* Sends a notifications to all users when a new message is posted.
exports.sendServerChatMessage = functions.database.ref('/messages/{messageId}').onCreate((event) => {
  const snapshot = event.data;
  const data = snapshot.val();
  const clientText = data.text || '';
  console.log('TEXT>>>>', data);

  if (data.type === 'client') {
    return getTextMessage(clientText)
      .then(function(text) {
        return admin.database().ref('messages').push({
          name: 'Server',
          type: 'server',
          photoUrl: 'http://www.newdesignfile.com/postpic/2012/11/minecraft-factions-server-icons_177429.png',
          text: text
        });
      })
      .catch(function(text) {
        return null
      });
  }
  return null;
});
*/
