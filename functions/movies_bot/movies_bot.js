const fetch = require('node-fetch');
const MoviesBot = {};

const NO_RECOMMENDATION_TEXT = 'Sorry, no recommendations found';
const MOVIE_API_URL = 'https://jsonmock.hackerrank.com/api/movies/search/?Title=';

function getMovieData(url) {
  return new Promise(function(resolve, reject) {
    return resolve([]);
  });
}

MoviesBot.getRecommendation = function (text) {
  return new Promise(function(resolve, reject) { 
    console.log('getRecommendation', text);
    if (!text && !text.indexOf('@movies')) {
      return resolve(NO_RECOMMENDATION_TEXT);
    }

    const searchText = text.split('@movies ')[1];
    if (!searchText) {
      return resolve(NO_RECOMMENDATION_TEXT);
    }

    let pageNumber = 1;
    const firstPageUrl = `${MOVIE_API_URL}${searchText}&page=${pageNumber}`;
    console.log('URL>>>', firstPageUrl);

    fetch(firstPageUrl)
      .then((res) => res.json())
      .then((responseObj) => {
        let movies = responseObj.data || [];
        let pages = responseObj.total_pages;
        let titles = [];
        movies.forEach((movie) => {
          titles.push(movie.Title);
        });

        const promises = [];
        for (let index = 2; index <= pages; index++) {
          const url = `${MOVIE_API_URL}${searchText}&page=${index}`;
          promises.push(fetch(url));
        }
        return Promise.all[promises]
      })
      .then((responseObjects) => {
        const newPromises = [];
        responseObjects.forEach((resp) => {
          newPromises.push(resp.json());
        })
        return Promise.all[newPromises];
      })
      .then((datas) => {
        datas.forEach((data, index) => {
          if (data && data.data && data.data.length) {
            data.data.forEach((movie) => {
              titles.push(movie.Title);
            });
          }
        });
        if (titles.length > 0) {
          return resolve(titles.split(0, 3).sort().join(' '));
        }
        return resolve(NO_RECOMMENDATION_TEXT);
      })
      .catch(function(err) {
        console.log('getRecommendation_err', err);
        return resolve('I GOT ERROR');
      });
  });
};

module.exports = MoviesBot;
