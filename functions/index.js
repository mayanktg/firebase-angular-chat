/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 * ...
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

// Sends a notifications to all users when a new message is posted.
exports.sendServerChatMessage = functions.database.ref('/messages/{messageId}').onCreate((event) => {
  const snapshot = event.data;
  const data = snapshot.val();
  console.log('TEXT>>>>', data);
  if (data.type === 'client') {
    return admin.database().ref('messages').push({
      name: 'Server',
      type: 'server',
      photoUrl: '/assets/images/firebase-logo.png',
      text: 'response from server'
    });
  }
  return null;
});
