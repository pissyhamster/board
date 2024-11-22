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

  // Replace all placeholders in the description
  return description.replace(/{(.*?)}/g, (match, id) => replacements[id] || match);
}


function showScene(sceneID) {
  const scenes = document.querySelectorAll('.scene');
  const nav = document.querySelector('header'); // Reference the nav bar

  scenes.forEach(scene => {
    const heading = scene.querySelector('h2'); // Get the heading for this scene

    if (scene.id === sceneID) {
      // Fade in the target scene
      scene.classList.add('active');

      if (heading) {
        heading.style.opacity = '0'; // Reset opacity
        heading.style.transform = 'translateY(-10px)'; // Reset position
        setTimeout(() => {
          heading.style.opacity = '1'; // Fade in
          heading.style.transform = 'translateY(0)'; // Return to original position
        }, 10); // Small delay to ensure the transition triggers
      }

      // Show the nav bar only for Analysis
      if (sceneID === 'analysis') {
        nav.classList.add('visible');
        nav.classList.remove('hidden');
      }
    } else {
      // Fade out all other scenes
      scene.classList.remove('active');

      if (heading) {
        heading.style.opacity = '0'; // Fade out
        heading.style.transform = 'translateY(-10px)'; // Slide upward
      }

      // Hide the nav bar for non-Analysis scenes
      if (sceneID === 'matches') {
        nav.classList.add('hidden');
        nav.classList.remove('visible');
      }
    }
  });
}




function expandCard(card) {
  const cards = document.querySelectorAll('.match-card');
  const nav = document.querySelector('header'); // Reference to the nav bar

  // Fade out all cards except the selected one
  cards.forEach(c => {
    if (c !== card) {
      c.style.transition = 'opacity 0.5s ease';
      c.style.opacity = '0'; // Fade out other cards
    }
  });

  // Expand the selected card
  card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
  card.style.transform = 'scale(1.2)'; // Expand the clicked card
  card.style.zIndex = '10';
  card.style.opacity = '0'; // Fade out the clicked card

  // Fade out the nav bar
  nav.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  nav.style.opacity = '0';
  nav.style.transform = 'translateY(-100%)'; // Slide up

  // Delay to show the analysis mode
  setTimeout(() => {
    showScene('analysis');

    // Slide the nav bar back down and fade it in
    nav.style.opacity = '1';
    nav.style.transform = 'translateY(0)'; // Reset position
  }, 500);
}

function formatStats(stats) {
  return {
    kills: stats?.kills ?? '-',
    deaths: stats?.deaths ?? '-',
    score: stats?.score ?? '-',
  };
}

  
async function loadAnalysis(seasonID, matchID) {
  const container = document.getElementById('analysis-container');
  container.innerHTML = ''; // Clear previous content

  try {
    const match = await fetchJSON(`seasons/${seasonID}/${matchID}.json`);
    const yinName = await getContenderDetails(match.Contenders.yin[0]);
    const yangName = await getContenderDetails(match.Contenders.yang[0]);

    // Determine the final result
    let finalResultText;
    if (!match.Result) {
      finalResultText = "Game not yet played";
    } else {
      const finalResult = match.Result === "yin" ? yinName : yangName;
      finalResultText = `${finalResult} WON`;
    }

    // Create the analysis card
    const analysisCard = document.createElement('div');
    analysisCard.className = 'analysis-card hidden'; // Start hidden for fade-in
    analysisCard.innerHTML = `
      <h1>${yinName} VS ${yangName}</h1>
      <h2>${match.Details.Style}</h2>
      <h3>${match.Date}</h3>
      <div class="final-result">
        <strong>Series Result:</strong> ${finalResultText}
      </div>
      <h2>ROUNDS</h2>
    `;

    // Add round details
    match.Rounds.forEach((round, index) => {
      const yinStats = formatStats(round.Scores[match.Contenders.yin[0]]);
      const yangStats = formatStats(round.Scores[match.Contenders.yang[0]]);
    
      const roundResult = round.Results.yin === null && round.Results.yang === null
        ? "No result yet"
        : round.Results.yin
        ? yinName
        : yangName;
    
      const roundDetails = document.createElement('div');
      roundDetails.className = 'round-details';
      roundDetails.innerHTML = `
        <h3>Round ${index + 1}: ${round.Type} on ${round.Map}</h3>
        <div class="stats">
          <div class="stats-left">
            <h4>${yinName}</h4>
            <p>K D S</p>
            <p>${yinStats.kills} ${yinStats.deaths} ${yinStats.score}</p>
          </div>
          <div class="stats-right">
            <h4>${yangName}</h4>
            <p>K D S</p>
            <p>${yangStats.kills} ${yangStats.deaths} ${yangStats.score}</p>
          </div>
        </div>
        <div class="round-result">
          <strong>Round Winner:</strong> ${roundResult}
        </div>
      `;
      analysisCard.appendChild(roundDetails);
    });

    // Add description
    const descriptionText = match.Details.Description
      ? await replaceContenderPlaceholders(match.Details.Description, match.Contenders)
      : "No description provided.";
    const descriptionDiv = document.createElement('div');
    descriptionDiv.className = 'description';
    descriptionDiv.innerHTML = `<p>${descriptionText}</p>`;
    analysisCard.appendChild(descriptionDiv);

    // Append the card to the container in a hidden state
    container.appendChild(analysisCard);

    // Force reflow and trigger fade-in
    setTimeout(() => {
      analysisCard.offsetHeight; // Trigger reflow
      analysisCard.classList.remove('hidden'); // Apply the visible styles
    }, 500); // Delay matches the fade-out of other cards
  } catch (error) {
    console.error(`Error loading match analysis:`, error);
    container.innerHTML = '<p>Error loading analysis data.</p>';
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
      const matches = [...season.Matches].reverse(); // Reverse the order of matches
      for (const matchID of matches) {
        const match = await fetchJSON(`seasons/${seasonID}/${matchID}.json`);
        const yinName = await getContenderDetails(match.Contenders.yin[0]);
        const yangName = await getContenderDetails(match.Contenders.yang[0]);

        let winnerText = "";
        if (match.Result) {
          const winnerSide = match.Result === "yin" ? match.Contenders.yin : match.Contenders.yang;
          const winnerNames = await Promise.all(winnerSide.map(getContenderDetails));
          winnerText = `${winnerNames.join(", ")} WON`;
        }

        const card = document.createElement('div');
        card.className = 'match-card';

        // Generate scores for all rounds
        const yinRoundScores = match.Rounds.map(round => {
          const stats = formatStats(round.Scores[match.Contenders.yin[0]]);
          return `${stats.kills} ${stats.deaths} ${stats.score}`;
        }).join("<br>");

        const yangRoundScores = match.Rounds.map(round => {
          const stats = formatStats(round.Scores[match.Contenders.yang[0]]);
          return `${stats.kills} ${stats.deaths} ${stats.score}`;
        }).join("<br>");

        card.innerHTML = `
          <h3>${match.Details.Style}</h3>
          <div class="subheading">${match.Date}</div>
          ${winnerText ? `<div class="winner">${winnerText}</div>` : ""}
          <div class="details">
            <div class="left">
              <h4>${yinName}</h4>
              <p>K D S</p>
              <p>${yinRoundScores}</p>
            </div>
            <div class="middle">VS</div>
            <div class="right">
              <h4>${yangName}</h4>
              <p>K D S</p>
              <p>${yangRoundScores}</p>
            </div>
          </div>
        `;

        // Add description with placeholder replacements
        if (match.Details.Description) {
          const description = document.createElement('div');
          description.className = 'description';
          description.innerHTML = await replaceContenderPlaceholders(match.Details.Description, match.Contenders);
          card.appendChild(description);
        }

        // Set up click event for analysis
        card.onclick = () => {
          expandCard(card);
          loadAnalysis(seasonID, matchID); // Load detailed analysis
        };

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

async function loadContenders() {
  const contendersSection = document.getElementById('contenders');
  const container = document.createElement('div');
  container.id = 'contender-cards-container';
  contendersSection.appendChild(container);

  const uniqueContenders = new Set();
  const seasonStats = {}; // Store stats per contender per season

  try {
    const seasons = await fetchJSON("seasons/manifest.json");

    // Find all unique contenders and gather stats
    for (const season of seasons) {
      seasonStats[season.ID] = {}; // Initialize stats for the season

      if (season.Matches) {
        for (const matchID of season.Matches) {
          const match = await fetchJSON(`seasons/${season.ID}/${matchID}.json`);

          // Process contenders and their stats
          for (const side of ["yin", "yang"]) {
            for (const contenderID of match.Contenders[side]) {
              if (!seasonStats[season.ID][contenderID]) {
                seasonStats[season.ID][contenderID] = {
                  series: 0,
                  games: 0,
                  wins: 0,
                  losses: 0,
                  kills: 0,
                  deaths: 0,
                };
              }

              // Increment series played
              seasonStats[season.ID][contenderID].series++;

              // Accumulate round stats
              for (const round of match.Rounds) {
                const scores = round.Scores[contenderID] || { kills: 0, deaths: 0 };
                seasonStats[season.ID][contenderID].games++;
                seasonStats[season.ID][contenderID].kills += scores.kills;
                seasonStats[season.ID][contenderID].deaths += scores.deaths;

                // Only count wins/losses for rounds with results
                if (round.Results && (round.Results.yin !== null || round.Results.yang !== null)) {
                  if (round.Results[side]) {
                    seasonStats[season.ID][contenderID].wins++;
                  } else {
                    seasonStats[season.ID][contenderID].losses++;
                  }
                }
              }
            }
          }
        }
      }
    }

    // Generate contender cards
    for (const seasonID of Object.keys(seasonStats)) {
      for (const contenderID of Object.keys(seasonStats[seasonID])) {
        uniqueContenders.add(contenderID);
      }
    }

    for (const contenderID of uniqueContenders) {
      const contender = await fetchJSON(`contenders/${contenderID}.json`);

      const card = document.createElement('div');
      card.className = 'contender-card';

      // Generate stats table
      let statsTable = `
        <table>
          <thead>
            <tr>
              <th>Season</th>
              <th>Series</th>
              <th>Games</th>
              <th>Wins</th>
              <th>Losses</th>
              <th>W/L</th>
              <th>Kills</th>
              <th>Deaths</th>
              <th>KDR</th>
            </tr>
          </thead>
          <tbody>
      `;

      for (const seasonID of Object.keys(seasonStats)) {
        if (seasonStats[seasonID][contenderID]) {
          const stats = seasonStats[seasonID][contenderID];
          const wlRatio = (stats.wins / (stats.losses || 1)).toFixed(2);
          const kdr = (stats.kills / (stats.deaths || 1)).toFixed(2);
          const seasonName = seasons.find(s => s.ID === seasonID).Name;

          statsTable += `
            <tr>
              <td>${seasonName}</td>
              <td>${stats.series}</td>
              <td>${stats.games}</td>
              <td>${stats.wins}</td>
              <td>${stats.losses}</td>
              <td>${wlRatio}</td>
              <td>${stats.kills}</td>
              <td>${stats.deaths}</td>
              <td>${kdr}</td>
            </tr>
          `;
        }
      }

      statsTable += `
          </tbody>
        </table>
      `;

      card.innerHTML = `
        <h3>${contender.Name} "${contender.Nickname}"</h3>
        <p>${contender.Description}</p>
        ${statsTable}
      `;

      container.appendChild(card);
    }
  } catch (error) {
    console.error("Error loading contenders:", error);
    container.innerHTML = '<p>Error loading contenders.</p>';
  }
}


// Initialize
document.addEventListener("DOMContentLoaded", () => {
  showScene("seasons"); // Default to seasons
  loadSeasons(); // Load season buttons
  loadContenders(); // Load contender cards
});
