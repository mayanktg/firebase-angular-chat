/**
 * Copyright 2017 Google Inc. All Rights Reserved.
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
import { Component, Inject } from '@angular/core';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import * as firebase from 'firebase';
import {Http, Response} from '@angular/http';
import { Observable } from "rxjs/Rx"
// import { StackService } from './stackService';

const LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';
const PROFILE_PLACEHOLDER_IMAGE_URL = '/assets/images/profile_placeholder.png';
const NO_RECOMMENDATION_TEXT = 'Sorry, no recommendations found';
const MOVIE_API_URL = 'https://jsonmock.hackerrank.com/api/movies/search/?Title=';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  currentUser: firebase.User;
  messages: FirebaseListObservable<any>;
  profilePicStyles: {};
  topics = '';
  value = '';
  stackObj = {
    inputCount: 0,
    operationsCount: 0,
    stack: [],
    topStackElems: []
  };

  constructor(public db: AngularFireDatabase, public http: Http) {
    this.messages = this.db.list('/messages');

    this.http = http;

    const messagesRef = firebase.database().ref().child("messages");
    const startKey = messagesRef.push().key;
    messagesRef.orderByKey().startAt(startKey)
    .on('child_added', (snapshot) => {
      const data = snapshot.val();
      setTimeout(() => {
        const objDiv = document.getElementById('messages');
        objDiv.scrollTop = objDiv.scrollHeight + 2000;
      }, 300)
      
      if (data.type === 'client') {
        this.sendServerChatMessage(data.text);
      }
    });
  }

  sendServerChatMessage = (clientText) => {
    console.log(clientText);
    return this.getTextMessage(clientText)
      .then(function(text) {
        console.log(text);
        if (!text) {
          return null;
        }
        return firebase.database().ref('messages').push({
          name: 'Server',
          type: 'server',
          photoUrl: 'http://www.newdesignfile.com/postpic/2012/11/minecraft-factions-server-icons_177429.png',
          text: text
        });
      })
      .catch(function(text) {
        console.log(text);
        return null;
      });
  }

  getTextMessage = (clientText) => {
    let serverText = `Hello! I'm your server speaking, I know nothing!`;
    console.log('getTextMessage', clientText);
    const numericText = parseInt(clientText, 10);
    
    const isStack = (!isNaN(numericText) ||
                     clientText.indexOf('push') > -1 ||
                     clientText.indexOf('pop') > -1 ||
                     clientText.indexOf('inc') > -1);
    console.log(isStack);
    return new Promise((resolve, reject) => {
      if (clientText.indexOf('@movies') > -1) {
        return this.getMoviesRecommendation(clientText)
          .then(function(text) {
            console.log('MOVIE_RECOMMENTAITON_TEXT', text);
            if (text && typeof text === 'string' && text.length > -1) {
              serverText = text;
            } else {
              serverText = 'Sorry no recomendations found';
            }
            return resolve(serverText);
          })
          .catch((err) => {
            console.log('MOVIE_RECOMMENTAITON_ERROR', err);
            serverText = 'Sorry no recoomendations found';
            return resolve(serverText);
          });
      } else if (isStack) {
        return resolve(this.handleStackOperations(clientText));
      } else {
        return resolve(serverText);
      }
    });
  };

  fetchData = (url) => {
    return new Promise((resolve, reject) => {
      this.http.get(url)
      .subscribe(
        result => {
          const data = result.json();
          return resolve(data);
        },
        err => {
          console.log(err);
          return resolve(null);
        }
      );
    });
  }

  getMoviesRecommendation = (text) => {
    console.log('getMoviesRecommendation', text);
    return new Promise((resolve, reject) => { 
      console.log('getRecommendation', text);
      if (!text && !text.indexOf('@movies')) {
        return resolve(NO_RECOMMENDATION_TEXT);
      }

      const searchText = text.split('@movies ')[1];
      if (!searchText) {
        return resolve(NO_RECOMMENDATION_TEXT);
      }

      let pageNumber = 1;
      let pages = 0;
      let movies = [];
      let titles = [];
      const firstPageUrl = `${MOVIE_API_URL}${searchText}&page=${pageNumber}`;
      console.log('URL>>>', firstPageUrl);
      this.fetchData(firstPageUrl)
      .then((responseObj) => {
        movies = responseObj['data'];
        pages = responseObj['total_pages'];
        movies.forEach((movie) => {
          titles.push(movie.Title);
        });
        console.log(titles);
        for (let index = 2; index <= pages; index++) {
          const url = `${MOVIE_API_URL}${searchText}&page=${index}`;
          this.fetchData(firstPageUrl)
          .then((data) => {
            const newData = data['data'];
            if (data && newData && newData.length) {
              newData.forEach((movie) => {
                titles.push(movie.Title);
              });
            }
            if (index === pages) {
              return null;
            }
          })
        }
      })
      .then(() => {
        if (titles && titles.length > 0) {
          return resolve(titles.sort().join(', '));
        }
        return resolve(NO_RECOMMENDATION_TEXT);
      })
      .catch((err) => {
        return resolve(NO_RECOMMENDATION_TEXT);
      });
    });
  };

  handleStackOperations = (clientText) => {
    return new Promise((resolve, reject) => {
      if (!isNaN(parseInt(clientText, 10))) {
        this.stackObj['inputCount'] = parseInt(clientText, 10);
        this.stackObj['operationsCount'] = 0;
        this.stackObj['topStackElems'] = [];
        this.stackObj['stack'] = [];
      } else if (clientText.indexOf('push ') > -1) {
        const number = parseInt(clientText.split('push ')[1], 10);
        console.log('PUSH>', number);
        this.stackObj['stack'].push(number);
        this.stackObj['topStackElems'].push(number);
        this.stackObj['operationsCount'] += 1;
      } else if (clientText.indexOf('pop') > -1) {
        this.stackObj['stack'].splice(-1, 1);
        const len = this.stackObj['stack'].length;
        if (len === 0) {
          this.stackObj['topStackElems'].push('EMPTY');
        } else {
          this.stackObj['topStackElems'].push(this.stackObj['stack'][len - 1]);
        }
        this.stackObj['operationsCount'] += 1;
      } else if (clientText.indexOf('inc') > -1) {
        const numElems =  parseInt(clientText.split(' ')[1]);
        const incVal =  parseInt(clientText.split(' ')[2]);
        console.log(numElems, incVal);
        for (let index = 0; index < numElems; index++) {
          this.stackObj['stack'][index] += incVal;
        }
        this.stackObj['operationsCount'] += 1;
      }

      // this.stackObj['inputs'].push(clientText);
      if (this.stackObj['operationsCount'] > 0 &&
          this.stackObj['operationsCount'] === this.stackObj['inputCount']) {
        console.log(this.stackObj['topStackElems'].join(', '));
        return resolve('OUTPUT IS: ' + this.stackObj['topStackElems'].join(', '));
      }

      return resolve(null);
    });
  }

  // TODO: Refactor into text message form component
  update(value: string) {
    this.value = value;
  }

  // TODO: Refactor into text message form component
  saveMessage(event: any, el: HTMLInputElement) {
    event.preventDefault();

    if (this.value) {
      // Add a new message entry to the Firebase Database.
      const messages = this.db.list('/messages');
      messages.push({
        name: 'user',
        type: 'client',
        text: this.value,
        photoUrl: PROFILE_PLACEHOLDER_IMAGE_URL
      }).then(() => {
        // Clear message text field and SEND button state.
        el.value = '';
      }).catch((err) => {
        console.error(err);
      });
    }
  }
  clearChat = () => {
    console.log('clearing chat');
    this.db.list('/messages').remove();
  }
}
