// Updated main.js

function showScene(sceneId) {
    // Hide all scenes
    const scenes = document.querySelectorAll('.scene');
    scenes.forEach(scene => scene.classList.remove('active'));
  
    // Show the selected scene
    const activeScene = document.getElementById(sceneId);
    if (activeScene) {
      activeScene.classList.add('active');
    }
  }

// Fetch and populate seasons from the manifest
function loadSeasons() {
  const container = document.getElementById('season-buttons-container');
  const manifestPath = 'https://raw.githubusercontent.com/pissyhamster/board/main/seasons/manifest.json'; // Correct GitHub raw path

  fetch(manifestPath)
    .then(response => {
      if (!response.ok) throw new Error(`Failed to load manifest: ${response.statusText}`);
      return response.json();
    })
    .then(data => {
      // Iterate through the manifest and create buttons
      data.forEach(season => {
        if (season.Type === 'Season') {
          const button = document.createElement('div');
          button.className = 'season-button';
          button.innerHTML = `
            <div>${season.Name}</div> <!-- Use Name instead of ID -->
            <div class="game-name">${season.Game}</div>
          `;
          // Add the button to the container
          container.appendChild(button);
        }
      });
    })
    .catch(error => console.error('Error loading seasons:', error));
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  showScene('seasons'); // Default to seasons
  loadSeasons(); // Load season buttons
});
