"use strict";


const $showsList = $("#shows-list");
const $episodesList = $("#episodes-list");
const $showItem = $("#showItem");
const $episodesArea = $("#episodes-area");
const $searchForm = $("#search-form");
const defaultImageUrl = "https://static.tvmaze.com/images/no-img/no-img-portrait-text.png";
const BASE_URL = "https://api.tvmaze.com";

/** Given a search term, search for tv shows that match that query.
 *
 *  Returns (promise) array of show objects: [show, show, ...].
 *    Each show object should contain exactly: {id, name, summary, image}
 *    (if no image URL given by API, put in a default image URL)
 */

async function getShowsByTerm(term) {
  // ADD: Remove placeholder & make request to TVMaze search shows API.
  try {

    const response = await axios.get(`${BASE_URL}/search/shows?q=${term}`);
    if (response && response.data.length) {
      return response.data.map((movie) => {
        return {
          id: movie.show.id,
          name: movie.show.name,
          genres: movie.show.genres.map((genre) => " " + genre),
          rating: movie.show.rating.average ? movie.show.rating.average : 0,
          year: movie.show.premiered ? movie.show.premiered.split("-")[0] : 0,
          summary: movie.show.summary === null ? "Not available!" : movie.show.summary.length < 120 ? movie.show.summary : movie.show.summary.substring(0, 120) + " ...",
          image: movie.show.image ? movie.show.image.medium : defaultImageUrl,
        };
      });
    } else {
      $showsList.empty();
      let $divMessage = $(`<div class="text-danger"><h1 class="text-danger text-center">Not Found!</h1></div>`);
      $showsList.append($divMessage);
    }

  } catch (error) {
    $showsList.empty();
    let $divMessage = $(`<div class="text-danger"><h1 class="text-danger text-center">Error! ${error}</h1></div>`);
    $showsList.append($divMessage);
  }
}


/** Given list of shows, create markup for each and to DOM */

function populateShows(shows) {
  $showsList.empty();

  for (let show of shows) {

    const $show = $(
      ` <div class="col-md-5 col-lg-3 Show" data-show-id="${show.id}">
        <div class="card">
        <img src="${show.image}" class="card-img-top img-fluid" alt="${show.name}">
        <div class="card-body">
          <h5 class="card-title text-sm-start"><b>${show.name}</b></h5>
          <h6 class="card-title text-secondary text-sm-start"><b>${show.year}</b></h6>
          <h6 class="card-title text-secondary text-sm-start">${show.genres}</h6>
          <h6 class="card-title text-danger text-sm-start"><b>Rating : ${show.rating} &#10030;</b></h6>
          <p></p>
          <button class="btn btn-danger btn-sm get-episodes" data-bs-toggle="modal" data-bs-target="#staticBackdrop">Episodes</button>
        </div>
        </div>
      </div>`
    );

    $showsList.append($show);
  }
}


/** Handle search form submission: get shows from API and display.
 *    Hide episodes area (that only gets shown if they ask for episodes)
 */

async function searchForShowAndDisplay() {
  const term = $("#search-query").val();
  const shows = await getShowsByTerm(term);

  $episodesArea.hide();
  if (!shows) return;
  populateShows(shows);
}
document.addEventListener("DOMContentLoaded",async()=>{
  $("#search-query").val("");
  const shows = await getShowsByTerm("A");
  if (!shows) return;
  populateShows(shows);
});
$searchForm.on("submit", async function (evt) {
  evt.preventDefault();
  await searchForShowAndDisplay();
});

$showsList.on("click", ".get-episodes", async function (e) {

  // const show = document.querySelector(".Show");
  // const Id = show.dataset.showId;
  const Id = $(e.target).closest(".Show").data("show-id");
  const show = await axios.get(`${BASE_URL}/shows/${Id}`);

  let val = {
    name: show.data.name,
    summary: show.data.summary === null ? "Not available!" : show.data.summary,
    genres: show.data.genres.map((genre) => " " + genre),
    rating: show.data.rating.average ? show.data.rating.average : 0,
    year: show.data.premiered ? show.data.premiered.split("-")[0] : 0,
    image: show.data.image ? show.data.image.original : defaultImageUrl,
  };
  const episodes = await getEpisodesOfShow(Id);
  populateEpisodes(episodes, val);
});

/** Given a show ID, get from API and return (promise) array of episodes:
 *      { id, name, season, number }
 */
// summary: episode.summary === null ? "Not available!" :episode.summary.length < 120 ?episode.summary : episode.summary.substring(0, 120) + " ...",
async function getEpisodesOfShow(id) {
  try {
    const response = await axios.get(`${BASE_URL}/shows/${id}/episodes`);
    if (response && response.data.length) {
      return response.data.map((episode) => {
        return {
          id: episode.id,
          name: episode.name,
          season: episode.season,
          number: episode.number,
          summary: episode.summary === null ? "Not available!" : episode.summary,
          image: episode.image ? episode.image.medium : defaultImageUrl,
        };
      });
    } else {
      $episodesList.empty();
      let $divMessage = $(`<div class="text-danger"><h1 class="text-danger text-center">No episode!</h1></div>`);
      $episodesList.append($divMessage);
    }

  } catch (error) {
    $episodesList.empty();
    let $divMessage = $(`<div class="text-danger"><h1 class="text-danger text-center">Error! ${error}</h1></div>`);
    $episodesList.append($divMessage);
  }

}

/** Write a clear docstring for this function... */

function populateEpisodes(episodes, show) {
  $episodesList.empty();
  $showItem.empty();

  const $showr = $(
    `<div class="card mb-3 bg-danger" >
  <div class="row g-0 bg-white">
    <div class="col-md-4">
      <img src="${show.image}" class="img-fluid " alt="${show.name}">
    </div>
    <div class="col-md-8">
      <div class="card-body">
        <h2 class="card-title">${show.name}</h2>
        <h3 class="card-title text-secondary">${show.year}</h3>
        <h5 class="card-title text-secondary">${show.genres}</h5>
        <h5 class="card-title text-danger">Rating : ${show.rating} &#10030;</h5>
        <p class="card-text">${show.summary}</p>
      </div>
    </div>
  </div>
</div>`
  );

  $showItem.append($showr);
  for (let episode of episodes) {

    const $line = $(`
    <tr>
    <td>
    <img src="${episode.image}" height="40" alt="${episode.name}"><br/>
    S${episode.season}: Ep-${episode.number}
    </td>
    
    <td>${episode.name}</td>
    <td> <button class="btn btn-danger btn-sm">Play</button></td>
  </tr>
    `);

    $episodesList.append($line);
  }


}
