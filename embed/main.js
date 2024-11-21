// main.js

// Function to display a greeting message
function sayHello() {
  alert("Hello from your GitHub website!");
}

// Add an event listener to buttons (if needed)
document.addEventListener("DOMContentLoaded", () => {
  const button = document.querySelector("button");
  if (button) {
    button.addEventListener("click", sayHello);
  }
});
