# **Technical Development Plan for Goblin's Inferno**

This document provides specific instructions for AI agents regarding the technical implementation of "Goblin's Inferno". All agents must adhere to these guidelines to ensure a cohesive and functional project. Read `CONCEPT.md` to ensure adherence to the agree upon game logic.

## **Code Structure**

Game logic is split into modular ES6 files (`src/main.js`, `src/player.js`, `src/projectile.js`), and styling resides in `src/style.css`. Keep JavaScript modular using ES6 classes.

* **Classes & Objects:** Use JavaScript ES6 classes to represent game entities such as Player, Enemy, and Projectile.
* **Game Loop:** Manage game logic with a single continuous game loop triggered by `window.requestAnimationFrame()`.
* **State Management:** Maintain a single, central `gameState` object holding player data, enemy arrays, projectiles, the current debt, and other game-specific variables.
* **Functions:** Separate distinct functionalities into well-named functions (e.g., `updatePlayer()`, `spawnEnemies()`, `checkCollisions()`) to improve readability and maintainability.

## **File Structure**

The project consists of modular files in the `src` directory plus a simple script for serving them.

* `index.html`: Contains the basic HTML structure and the `<canvas>` element where the game will be rendered. It links to the external CSS and JavaScript files.
* `style.css`: Holds all CSS styles for the game.
* `main.js`: Entry point for the game's JavaScript; imports other modules.
* `player.js` and `projectile.js`: Provide modular game logic for the player and projectiles.
* **Server:** A simple npm-based HTTP server will be used to serve the `index.html` file.

## **Automated Testing Methodology**

Run the test suite with `npm test`, which executes unit tests using Jest. Tests should focus on game logic modules without requiring a browser environment.

* **State Verification:** Unit tests must inspect the `gameState` object and other module outputs to ensure mechanics work correctly. For example:
  * Check that the player's position changes after a key press.
  * Verify that an enemy's health decreases after a collision with a fireball.
  * Assert that the debt counter updates after collecting gold.
* **Performance Monitoring:** The testing suite should continue to include checks for performance metrics, such as frame rate and CPU usage, to ensure that new features do not negatively impact game performance.

## **Game Serving**

To run the game, use a simple HTTP server from the npm ecosystem. The **Code Goblin** agent should use the http-server package for this purpose.

* **Installation:** First, install the project's dependencies:
  npm install

* **Execution:** After installation, run the following command to serve the index.html file at http://localhost:8000:
  npm start
