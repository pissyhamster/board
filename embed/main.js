// Configuration for the GitHub repo and branch
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/pissyhamster/board";
const BRANCH = "main"; // Change this to switch branches

/**
 * Fetch JSON data from a specified path with cache busting.
 * @param {string} relativePath - The path relative to the repository root.
 * @returns {Promise<Object>} - A promise that resolves to the JSON data.
 */
function fetchJSON(relativePath) {
  const url = `${GITHUB_RAW_BASE}/${BRANCH}/${relativePath}?t=${Date.now()}`; // Add cache busting
  return fetch(url)
    .then(response => {
      if (!response.ok) throw new Error(`Failed to fetch ${relativePath}: ${response.statusText}`);
      return response.json();
    })
    .catch(error => {
      console.error(`Error fetching JSON from ${url}:`, error);
      throw error;
    });
}

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

// Function to load matches for a selected season
function loadMatches(seasonID) {
  const container = document.getElementById('match-cards-container');
  container.innerHTML = ''; // Clear previous matches

  fetchJSON("seasons/manifest.json")
    .then(seasons => {
      // Find the selected season from the manifest
      const season = seasons.find(s => s.ID === seasonID);
      if (!season) throw new Error(`Season with ID "${seasonID}" not found`);

      if (season.Matches && season.Matches.length > 0) {
        // Fetch and display each match
        season.Matches.forEach(matchID => {
          fetchJSON(`seasons/${seasonID}/${matchID}.json`).then(match => {
            const card = document.createElement('div');
            card.className = 'match-card';
            card.innerHTML = `
              <h3>${match.Date} - ${match.Format.toUpperCase()}</h3>
              <p>${match.Details.Description}</p>
              <div class="contender">Winner: ${
                match.Rounds[0].Results.yang ? match.Contenders.yang[0] : match.Contenders.yin[0]
              }</div>
            `;
            container.appendChild(card);
          });
        });
      } else {
        container.innerHTML = '<p>No matches found for this season.</p>';
      }
      showScene('matches'); // Switch to the matches scene
    })
    .catch(error => console.error('Error loading matches:', error));
}

// Add click event for season buttons
function loadSeasons() {
  const container = document.getElementById('season-buttons-container');

  fetchJSON("seasons/manifest.json")
    .then(data => {
      data.forEach(season => {
        if (season.Type === "Season") {
          const button = document.createElement("div");
          button.className = "season-button";
          button.innerHTML = `
            <div>${season.Name}</div>
            <div class="game-name">${season.Game}</div>
          `;
          button.onclick = () => loadMatches(season.ID); // Load matches when clicked
          container.appendChild(button);
        }
      });
    })
    .catch(error => console.error("Error loading seasons:", error));
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  showScene("seasons"); // Default to seasons
  loadSeasons(); // Load season buttons
});
