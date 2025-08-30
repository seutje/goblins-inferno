# **Technical Development Plan for Goblin's Inferno**

This document provides specific instructions for AI agents regarding the technical implementation of "Goblin's Inferno". All agents must adhere to these guidelines to ensure a cohesive and functional project.

## **Code Structure**

The entire game logic must reside within a single HTML file. The JavaScript code should be structured with a focus on modularity, despite being in one file.

* **Classes & Objects:** Use JavaScript ES6 classes to represent game entities such as Player, Enemy, and Projectile. This will help organize the code and encapsulate behavior.  
* **Game Loop:** The core game logic should be managed by a single, continuous game loop function (e.g., gameLoop() or animate()) that handles all updates and rendering. The loop should be triggered by window.requestAnimationFrame().  
* **State Management:** Maintain a single, central object to manage the game's state. This gameState object should hold all critical variables, including player data, an array of enemies, projectiles, the current debt, and other game-specific variables.  
* **Functions:** Separate distinct functionalities into well-named functions (e.g., updatePlayer(), spawnEnemies(), checkCollisions()) to improve readability and maintainability.

## **File Structure**

The project must consist of a single file for the game and a separate, simple script for serving it. This single-file structure is a core requirement.

* index.html: This single HTML file will contain all the game's code. This includes:  
  * The basic HTML structure (\<html\>, \<head\>, \<body\>).  
  * All CSS styles within a \<style\> tag.  
  * All JavaScript game logic within a \<script\> tag.  
  * The \<canvas\> element where the game will be rendered.  
* **Server:** A simple npm-based HTTP server will be used to serve the index.html file.

## **Automated Testing Methodology**

Given the single-file constraint, a black-box functional testing approach is required. The Test Goblin agent should use a headless browser environment to simulate player actions and verify outcomes.

* **Simulation:** The tests must simulate keyboard inputs (WASD) and mouse movements/clicks to control the player.  
* **State Verification:** Tests should programmatically inspect the gameState object at various points in the game loop to verify that core mechanics are working correctly. For example:  
  * Check that the player's position changes after a key press.  
  * Verify that an enemy's health decreases after a collision with a fireball.  
  * Assert that the debt counter updates after collecting gold.  
* **Performance Monitoring:** The testing suite must include checks for performance metrics, such as frame rate and CPU usage, to ensure that new features do not negatively impact game performance.

## **Game Serving**

To run the game, use a simple HTTP server from the npm ecosystem. The **Code Goblin** agent should use the http-server package for this purpose.

* **Installation:** First, install the project's dependencies:  
  npm install

* **Execution:** After installation, run the following command to serve the index.html file at http://localhost:8000:  
  npm start  
