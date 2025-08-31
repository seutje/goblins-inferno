# **Goblin's Inferno: AI-Assisted Development Plan**

This document outlines a phased approach for the development of "Goblin's Inferno" using a team of specialized AI agents. Checkboxes are provided for each agent to mark off completed tasks.

## **Phase 1: Pre-Production & Planning**

**Objective:** Finalize the core design, establish the artistic and technical foundation, and assign initial roles to AI agents.

* [x] **1.1 Finalize Game Design Document:**  
  * [x] Review the "CONCEPT.md" for clarity and feasibility.  
  * [x] The **Game Designer AI** will add specific metrics for enemy health, player damage, and item drop rates.  
  * [x] The **Narrative AI** will expand on the backstory of the Loan Shark and the Inferno.  
* [x] **1.2 Define Art & Sound Style:**  
  * [x] The **Art Director AI** will generate concept art for the goblins, enemies, and environment.  
  * [x] The **Sound Designer AI** will create a mood board of sound effects and music styles (e.g., mischievous, intense, chaotic).  
  * [x] The **UI/UX Designer AI** will mock up the in-game HUD, menu screens, and the debt counter.  
* [x] **1.3 Plan AI Agent Roles:**  
  * [x] Define specific, fine-tuned roles for each AI agent (e.g., **Code Goblin** for programming, **Asset Goblin** for art and sound, **Test Goblin** for QA).

## **Phase 2: Core Gameplay Development**

**Objective:** Build the fundamental mechanics of the game.

* [x] **2.1 Implement Player Controls & Movement:**  
  * [x] The **Code Goblin** will write the code for player movement and collision detection.  
  * [x] The **Code Goblin** will implement the automatic firing system for the player's primary weapon.  
  * [x] The **Test Goblin** will perform initial QA on movement and firing mechanics.  
* [ ] **2.2 Implement Basic Weapon System:**  
  * [x] The **Code Goblin** will create the base class for projectiles (fireballs) with properties for damage, speed, and size.
  * [x] The **Code Goblin** will implement the logic for the Inferno Blast, Flame Stream, and Volatile Orb starting weapons.
  * [ ] The **Asset Goblin** will create the visual particle effects and sprites for the fireballs.  
* [ ] **2.3 Implement Enemy Spawning & AI:**
  * [x] The **Code Goblin** will implement an enemy spawner that incrementally increases enemy count and difficulty over time.
  * [x] The **Code Goblin** will create the AI scripts for Debt-Skeletons, Loaner-Imps, and Bailiff-Ogres.
  * [ ] The **Asset Goblin** will create the animated sprites for all standard enemies.
* [x] **2.4 Implement Level Up & Upgrade System:**  
  * [x] The **Code Goblin** will implement a system to track collected gems and handle player level-ups.  
  * [x] The **UI/UX Designer AI** will create the UI for the three random upgrade choices.  
  * [x] The **Game Designer AI** will write the logic for the randomized upgrade selection pool.

## **Phase 3: Features & Content Implementation**

**Objective:** Add the unique, themed elements and content to the core game.

* [x] **3.1 Implement The Debt System & Loan Shark:**  
  * [x] The **Code Goblin** will create the state management for the player's debt.  
  * [x] The **UI/UX Designer AI** will design and implement the debt counter and the Loan Shark's UI screen.  
  * [x] The **Code Goblin** will write the logic for taking out loans and the automatic debt repayment system.  
* [ ] **3.2 Implement Character Selection & Unique Abilities:**  
  * [x] The **UI/UX Designer AI** will create the character selection screen.  
  * [x] The **Code Goblin** will implement the logic for the special traits of Gnorp, Ignis, and Fizzle.  
  * [x] The **Code Goblin** added Ignis's fire trail via a hazards system (lingering fire patches that damage enemies over time).  
  * [ ] The **Asset Goblin** will create the character sprites and animations.  
* [x] **3.3 Design & Implement Boss Fights:**  
  * [x] The **Game Designer AI** scripted initial attack patterns and phases: Champion slams spawn fire zones; Dragon rains fire volleys; Debt Collector absorbs then reflects.  
  * [x] The **Code Goblin** implemented boss classes, spawn thresholds, health bar HUD, and phase/attack scripts.  
  * [ ] The **Asset Goblin** will create the large, detailed sprites or models for each boss.  
* [x] **3.4 Create & Integrate Art Assets:**  
  * [ ] The **Asset Goblin** will generate all final 2D sprites, backgrounds, and environment art.  
  * [x] The **Code Goblin** integrated art hooks: projectile sprites, robust image fallbacks, and boss sprite wiring.  
* [x] **3.5 Create & Integrate Sound Assets:**  
  * [ ] The **Sound Designer AI** will generate all final SFX and music.  
  * [x] The **Code Goblin** implemented synthesized SFX (WebAudio) and wired triggers for firing, enemy death, boss spawn/defeat, upgrades, and loans.  

## **Phase 4: Testing, Balancing & Polish**

**Objective:** Refine the game for a polished and enjoyable player experience.

* [x] **4.1 Conduct Gameplay Testing:**  
  * [x] The **Test Goblin** added automated tests covering hazards, collisions, boss spawn, and core loop stability.  
  * [x] The **Test Goblin** captured initial feedback items for balancing.  
* [ ] **4.2 Balance Gameplay & Economy:**  
  * [ ] The **Game Designer AI** will use data from test runs to adjust enemy spawn rates, upgrade effectiveness, and loan parameters.  
  * [ ] The **Game Designer AI** will ensure the difficulty curve is smooth and engaging.  
* [ ] **4.3 Implement UI/UX Improvements:**  
  * [ ] The **UI/UX Designer AI** will refine all UI elements based on testing feedback.  
  * [ ] The **Code Goblin** will implement any necessary UI code changes.  
* [ ] **4.4 Final Polish & Bug Fixing:**  
  * [ ] The **Code Goblin** will fix all identified bugs and optimize game performance.  
  * [ ] The **Test Goblin** will perform a final pass to ensure the game is ready for release.
