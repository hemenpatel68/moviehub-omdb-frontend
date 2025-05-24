// DOM Elements
const favoritesGrid = document.getElementById('favoritesGrid');
const noFavoritesMessage = document.getElementById('noFavoritesMessage');
const movieModal = new bootstrap.Modal(document.getElementById('movieModal'));
const movieTitleElement = document.getElementById('movieTitle');
const movieDetailsElement = document.getElementById('movieDetails');
const removeButton = document.getElementById('removeButton');

// API Configuration
const API_KEY = 'fa3d3c4c'; // Free OMDb API key
const BASE_URL = 'https://www.omdbapi.com/';

// Current movie being viewed in detail
let currentMovie = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Load favorites
  loadFavorites();
  
  // Setup event listeners
  removeButton.addEventListener('click', removeFromFavorites);
  
  // Listen for localStorage changes (from other tabs)
  window.addEventListener('storage', loadFavorites);
});

// Load favorites from localStorage
function loadFavorites() {
  const favorites = getFavorites();
  
  if (favorites.length === 0) {
    // Show no favorites message
    noFavoritesMessage.classList.remove('d-none');
    favoritesGrid.classList.add('d-none');
  } else {
    // Hide no favorites message
    noFavoritesMessage.classList.add('d-none');
    favoritesGrid.classList.remove('d-none');
    
    // Display favorites
    displayFavorites(favorites);
  }
}

// Display favorite movies
function displayFavorites(movies) {
  // Clear previous results
  favoritesGrid.innerHTML = '';
  
  // Create movie cards
  movies.forEach(movie => {
    const movieCard = createMovieCard(movie);
    favoritesGrid.appendChild(movieCard);
  });
}

// Create a movie card element
function createMovieCard(movie) {
  const col = document.createElement('div');
  col.className = 'col';
  
  const posterUrl = movie.Poster !== 'N/A' 
    ? movie.Poster 
    : 'https://via.placeholder.com/300x450?text=No+Poster+Available';
  
  col.innerHTML = `
    <div class="card h-100 shadow-sm movie-card" data-imdb-id="${movie.imdbID}">
      <div class="card-img-container">
        <img src="${posterUrl}" class="card-img-top" alt="${movie.Title} poster">
        <i class="fas fa-heart favorite-icon active" 
           data-imdb-id="${movie.imdbID}" 
           onclick="event.stopPropagation(); removeMovieCard(this)"></i>
      </div>
      <div class="card-body">
        <h5 class="card-title text-truncate">${movie.Title}</h5>
        <p class="card-text text-muted mb-4">${movie.Year}</p>
        <button class="btn btn-primary mt-auto">
          <i class="fas fa-info-circle me-2"></i>
          View Details
        </button>
      </div>
    </div>
  `;
  
  // Add click event to open modal
  col.querySelector('.movie-card').addEventListener('click', () => {
    getMovieDetails(movie.imdbID);
  });
  
  return col;
}

// Remove movie card when clicking the heart icon
function removeMovieCard(element) {
  const imdbID = element.dataset.imdbId;
  removeFavorite(imdbID);
  
  // Remove card with animation
  const card = element.closest('.col');
  card.style.transition = 'all 0.3s ease';
  card.style.transform = 'scale(0.8)';
  card.style.opacity = '0';
  
  setTimeout(() => {
    card.remove();
    
    // Check if there are any favorites left
    if (favoritesGrid.children.length === 0) {
      noFavoritesMessage.classList.remove('d-none');
      favoritesGrid.classList.add('d-none');
    }
  }, 300);
}

// Get detailed movie information
async function getMovieDetails(imdbID) {
  try {
    const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const movie = await response.json();
    
    if (movie.Response === 'False') {
      throw new Error(movie.Error || 'Movie details not found');
    }
    
    // Set current movie
    currentMovie = movie;
    
    // Display movie details in modal
    displayMovieDetails(movie);
    
    // Show modal
    movieModal.show();
    
  } catch (error) {
    console.error('Error fetching movie details:', error);
    alert('Failed to load movie details. Please try again.');
  }
}

// Display movie details in modal
function displayMovieDetails(movie) {
  // Set modal title
  movieTitleElement.textContent = movie.Title;
  
  // Format movie ratings
  const imdbRating = movie.imdbRating !== 'N/A' ? movie.imdbRating : '?';
  const imdbVotes = movie.imdbVotes !== 'N/A' ? movie.imdbVotes : '0';
  
  // Create star rating display
  const fullStars = Math.floor(parseFloat(imdbRating));
  const hasHalfStar = parseFloat(imdbRating) - fullStars >= 0.5;
  
  let starsHTML = '';
  for (let i = 0; i < 10; i++) {
    if (i < fullStars) {
      starsHTML += '<i class="fas fa-star"></i>';
    } else if (i === fullStars && hasHalfStar) {
      starsHTML += '<i class="fas fa-star-half-alt"></i>';
    } else {
      starsHTML += '<i class="far fa-star"></i>';
    }
  }
  
  // Format genres as badges
  const genres = movie.Genre.split(', ').map(genre => 
    `<span class="genre-badge">${genre}</span>`
  ).join('');
  
  // Poster URL
  const posterUrl = movie.Poster !== 'N/A' 
    ? movie.Poster 
    : 'https://via.placeholder.com/300x450?text=No+Poster+Available';
  
  // Set modal content
  movieDetailsElement.innerHTML = `
    <div class="row g-4">
      <div class="col-md-4">
        <img src="${posterUrl}" alt="${movie.Title} poster" class="movie-poster shadow">
        <div class="mt-3">
          <div class="movie-meta-item">
            <i class="fas fa-star text-warning"></i>
            <span>
              <strong>${imdbRating}</strong><span class="text-muted"> / 10</span>
              <span class="text-muted">(${imdbVotes} votes)</span>
            </span>
          </div>
          <div class="movie-meta-item">
            <i class="fas fa-calendar-alt"></i>
            <span>${movie.Released !== 'N/A' ? movie.Released : 'Unknown'}</span>
          </div>
          <div class="movie-meta-item">
            <i class="fas fa-clock"></i>
            <span>${movie.Runtime !== 'N/A' ? movie.Runtime : 'Unknown'}</span>
          </div>
          <div class="movie-meta-item">
            <i class="fas fa-certificate"></i>
            <span>${movie.Rated !== 'N/A' ? movie.Rated : 'Not Rated'}</span>
          </div>
        </div>
      </div>
      <div class="col-md-8">
        <p class="lead">${movie.Plot !== 'N/A' ? movie.Plot : 'No plot available.'}</p>
        
        <div class="mb-3">
          <div class="movie-meta-item">
            <i class="fas fa-tags"></i>
            <div>${genres || '<span class="text-muted">No genres listed</span>'}</div>
          </div>
        </div>
        
        <div class="mb-3">
          <div class="movie-meta-item">
            <i class="fas fa-film"></i>
            <div>
              <strong>Director:</strong> 
              ${movie.Director !== 'N/A' ? movie.Director : 'Unknown'}
            </div>
          </div>
        </div>
        
        <div class="mb-3">
          <div class="movie-meta-item">
            <i class="fas fa-users"></i>
            <div>
              <strong>Actors:</strong> 
              ${movie.Actors !== 'N/A' ? movie.Actors : 'Unknown'}
            </div>
          </div>
        </div>
        
        ${movie.Awards !== 'N/A' ? `
          <div class="awards-section">
            <div class="movie-meta-item">
              <i class="fas fa-award"></i>
              <div>
                <strong>Awards:</strong> ${movie.Awards}
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Remove from favorites via modal button
function removeFromFavorites() {
  if (!currentMovie) return;
  
  removeFavorite(currentMovie.imdbID);
  
  // Close modal
  movieModal.hide();
  
  // Remove card with animation
  const card = document.querySelector(`.movie-card[data-imdb-id="${currentMovie.imdbID}"]`).closest('.col');
  
  if (card) {
    card.style.transition = 'all 0.3s ease';
    card.style.transform = 'scale(0.8)';
    card.style.opacity = '0';
    
    setTimeout(() => {
      card.remove();
      
      // Check if there are any favorites left
      if (favoritesGrid.children.length === 0) {
        noFavoritesMessage.classList.remove('d-none');
        favoritesGrid.classList.add('d-none');
      }
    }, 300);
  }
}

// Favorites management functions
function getFavorites() {
  const favorites = localStorage.getItem('moviehub_favorites');
  return favorites ? JSON.parse(favorites) : [];
}

function removeFavorite(imdbID) {
  const favorites = getFavorites();
  const updatedFavorites = favorites.filter(movie => movie.imdbID !== imdbID);
  localStorage.setItem('moviehub_favorites', JSON.stringify(updatedFavorites));
  
  // Dispatch storage event for cross-page communication
  window.dispatchEvent(new Event('storage'));
}