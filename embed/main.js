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

/**
 * Fetch and format contender data by ID.
 * @param {string} contenderID - The ID of the contender.
 * @returns {Promise<string>} - A promise that resolves to the formatted contender string.
 */
function getContenderDetails(contenderID) {
  return fetchJSON(`contenders/${contenderID}.json`)
    .then(data => {
      const name = data.Name || "Unknown";
      const nickname = data.Nickname ? `"${data.Nickname}"` : "";
      return `${name} ${nickname}`.trim();
    })
    .catch(error => {
      console.error(`Error fetching contender "${contenderID}":`, error);
      return `{Unknown Contender}`; // Fallback if fetching fails
    });
}


/**
 * Replace contender placeholders in a description with their formatted names.
 * @param {string} description - The description string with placeholders.
 * @param {Object} contenders - Object with keys for "yin" and "yang", containing their IDs.
 * @returns {Promise<string>} - A promise resolving to the description with replaced placeholders.
 */
async function replaceContenderPlaceholders(description, contenders) {
  const replacements = {};

  // Prepare replacements for both yin and yang contenders
  for (const side of Object.keys(contenders)) {
    for (const id of contenders[side]) {
      if (!replacements[id]) {
        replacements[id] = await getContenderDetails(id);
      }
    }
  }

  // Replace placeholders in the description
  return description.replace(/{(.*?)}/g, (match, id) => replacements[id] || match);
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

  async function loadMatches(seasonID) {
    const container = document.getElementById('match-cards-container');
    container.innerHTML = ''; // Clear previous matches
  
    try {
      const seasons = await fetchJSON("seasons/manifest.json");
      const season = seasons.find(s => s.ID === seasonID);
  
      if (!season) {
        container.innerHTML = `<p>Season not found.</p>`;
        console.error(`Season with ID "${seasonID}" not found`);
        return;
      }
  
      if (season.Matches && season.Matches.length > 0) {
        for (const matchID of season.Matches) {
          const match = await fetchJSON(`seasons/${seasonID}/${matchID}.json`);
          const yinName = await getContenderDetails(match.Contenders.yin[0]);
          const yangName = await getContenderDetails(match.Contenders.yang[0]);
  
          // Determine winner if Result is not null
          let winnerText = "";
          if (match.Result) {
            const winnerSide = match.Result === "yin" ? match.Contenders.yin : match.Contenders.yang;
            const winnerNames = await Promise.all(winnerSide.map(getContenderDetails));
            winnerText = `${winnerNames.join(", ")} WON`;
          }
  
          // Replace placeholders in the description
          const descriptionText = match.Details.Description
            ? await replaceContenderPlaceholders(match.Details.Description, match.Contenders)
            : "&nbsp;";
  
          const card = document.createElement('div');
          card.className = 'match-card';
          card.innerHTML = `
            <h3>${match.Details.Style}</h3>
            <div class="subheading">${match.Date}</div>
            ${winnerText ? `<div class="winner">${winnerText}</div>` : ""}
            <div class="details">
              <div>${yinName}</div>
              <div class="middle">VS</div>
              <div>${yangName}</div>
            </div>
          `;
  
          match.Rounds.forEach(round => {
            const yinStats = round.Scores[match.Contenders.yin[0]];
            const yangStats = round.Scores[match.Contenders.yang[0]];
            const roundDetails = document.createElement('div');
            roundDetails.className = 'round-details';
            roundDetails.innerHTML = `
              <div>${yinStats.kills || '-'} ${yinStats.deaths || '-'} ${yinStats.score || '-'}</div>
              <div class="middle">${round.Map}</div>
              <div>${yangStats.kills || '-'} ${yangStats.deaths || '-'} ${yangStats.score || '-'}</div>
            `;
            card.appendChild(roundDetails);
          });
  
          // Add description as the last element
          const description = document.createElement('div');
          description.className = 'description';
          description.innerHTML = descriptionText;
          card.appendChild(description);
  
          container.appendChild(card);
        }
      } else {
        container.innerHTML = '<p>No matches found for this season.</p>';
      }
  
      showScene('matches');
    } catch (error) {
      console.error('Error loading matches:', error);
      container.innerHTML = '<p>Error loading matches.</p>';
    }
  }

// Add click event for season buttons
function loadSeasons() {
  const container = document.getElementById('season-buttons-container');

  fetchJSON("seasons/manifest.json")
    .then(data => {
      console.log("Loaded seasons manifest:", data); // Log the manifest for seasons
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
    .catch(error => console.error("Error loading seasons manifest:", error));
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  showScene("seasons"); // Default to seasons
  loadSeasons(); // Load season buttons
});
