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
  
  // Default scene is now "seasons"
  document.addEventListener('DOMContentLoaded', () => {
    showScene('seasons');
  });
  