# **Goblin's Inferno: A Game Design Document**

## **1\. Game Concept & Core Loop**

"Goblin's Inferno" is a browser-based rogue-lite bullet heaven where players take on the role of debt-ridden goblins, fighting through hordes of monsters to earn coins and pay off their crushing loans. Each run, the player chooses a goblin character and enters the 'Inferno,' a series of increasingly difficult stages. The core gameplay is an endless survival mode where the player automatically attacks, focusing on movement and dodging enemy projectiles.

The core loop of the game is as follows:

1. **Start:** The player begins with a fixed amount of debt and their chosen goblin's starting weapon.  
2. **The Loan Shark:** Before entering a stage, the player can visit the 'Loan Shark.' Here, they can take out loans of varying sizes and interest rates. Each loan provides a significant power-up or a large sum of gold, but increases the player's total debt.  
3. **The Inferno:** The player enters the stage and survives for as long as possible, collecting gold coins and gems dropped by defeated enemies. These items automatically attract to the player as they level up.  
4. **Level Up:** Collecting gems grants experience, and at each level up, the player is presented with a choice of three random upgrades for their weapons, abilities, or stats.  
5. **Boss Encounter:** Every few minutes, a powerful boss spawns, offering a large reward upon defeat.  
6. **End of Run:** A run ends when the player's health reaches zero. The player loses all collected gold and must return to the hub.  
7. **Hub & Repayment:** Back at the hub, the player uses any remaining gold to pay off their debt. Their total debt carries over to the next run, serving as the primary meta-progression goal. The game is "beaten" when the debt is fully paid off.

## **2\. The Debt System**

The Debt System is the central pillar of "Goblin's Inferno" and provides the main risk-reward loop.

* **Initial Debt:** All players begin with a starting debt of 10,000 gold.  
* **The Loan Shark:** A grotesque loan shark NPC in the hub offers various loans.  
* **Loan Types:**  
  * **Simple Loan (10% Interest):** Grants a small amount of gold. Low risk, low reward.  
  * **Gear Loan (25% Interest):** Grants a powerful offensive or defensive item for the duration of the run. This could be an extra projectile, a defensive shield, or a temporary speed boost.  
  * **Cursed Loan (50% Interest):** Grants a significant but temporary power boost or a unique, game-changing ability that comes with a debuff. Example: a massive, screen-clearing explosion that also temporarily reduces movement speed.  
* **Debt Repayment:** All gold earned during a run is automatically applied to the debt at the end of the run. This gold is then lost.  
* **The Debt Counter:** A prominent UI element that constantly displays the current total debt. As players take out loans, the counter visibly increases.

## **3\. Characters & Abilities**

All characters in "Goblin's Inferno" are fire-themed, but each offers a different playstyle and approach to the bullet heaven genre.

* **1\. Gnorp the Pyromaniac:**  
  * **Theme:** Reckless, high-damage output.  
  * **Starting Weapon:** **Inferno Blast** \- Throws a single, large, slow-moving fireball that explodes on impact, dealing area-of-effect damage.  
  * **Attributes:**  
    * **Health:** High  
    * **Speed:** Low  
    * **Damage:** High  
    * **Special Trait:** Deals extra damage to enemies close to him.  
* **2\. Ignis the Arsonist:**  
  * **Theme:** Mobility and spreading fire.  
  * **Starting Weapon:** **Flame Stream** \- Shoots a continuous stream of small, rapid fireballs in a narrow cone.  
  * **Attributes:**  
    * **Health:** Low  
    * **Speed:** High  
    * **Damage:** Low  
    * **Special Trait:** Leaves a trail of fire on the ground that deals damage over time to enemies who pass through it.  
* **3\. Fizzle the Alchemist:**  
  * **Theme:** Strategic, explosive projectiles.  
  * **Starting Weapon:** **Volatile Orb** \- Launches a single, bouncing projectile that detonates after a short delay, splitting into smaller fireballs.  
  * **Attributes:**  
    * **Health:** Medium  
    * **Speed:** Medium  
    * **Damage:** Medium  
    * **Special Trait:** Picking up a gem also adds a random potion effect (e.g., temporary speed, extra damage, or a small heal).

## **4\. Weapons & Upgrades**

The upgrade system is at the heart of the bullet heaven experience. Players will build their unique "fireball build" each run.

* **Primary Weapons:** The starting weapons of each character, which can be upgraded in the following ways:  
  * **Inferno Blast:** Increase projectile size, reduce cooldown, add more projectiles, or increase explosion radius.  
  * **Flame Stream:** Increase projectile speed, widen the cone, increase fire trail duration, or add a chance to pierce enemies.  
  * **Volatile Orb:** Increase number of bounces, reduce detonation time, increase number of smaller fireballs on split, or increase explosion damage.  
* **Secondary Weapons:** Weapons that can be unlocked and upgraded during a run. These are generally less powerful than the primary weapons but provide utility or additional damage sources.  
  * **Meteor Shower:** Summons meteors that rain down randomly on the battlefield.  
  * **Wall of Fire:** Creates temporary walls of fire to block off areas and damage enemies.  
  * **Spitfire Turret:** Summons a stationary turret that auto-fires at the nearest enemy.  
* **Passive Upgrades:** These affect the player's base stats and abilities.  
  * **Greedy Goblin:** Increases gold coin value.  
  * **Nimble Feet:** Increases movement speed.  
  * **Tough Hide:** Increases maximum health.  
  * **Arcane Affinity:** Reduces weapon cooldowns.

## **5\. Enemies & Bosses**

The enemies are themed around various mythical creatures that have succumbed to the debt-ridden underworld of goblins.

* **Standard Enemies:**  
  * **Debt-Skeletons:** Basic, slow-moving melee enemies.  
  * **Loaner-Imps:** Fast-moving enemies that fire a single, slow projectile.  
  * **Bailiff-Ogres:** Large, tanky enemies that charge at the player.  
* **Bosses:**  
  * **The Creditor's Champion (First Boss):** A giant armored knight who wields a massive, fiery club and creates small fire zones on the ground.  
  * **The Interest Dragon (Mid-game Boss):** A massive fire-breathing dragon that rains down a storm of fireballs and firebombs.  
  * **The Debt Collector (Final Boss):** A powerful, multi-stage boss that resembles a demonic loan shark. It will absorb fireballs and reflect them back at the player.

## **6\. Progression & Meta-Progression**

* **Run Progression:** Within a single run, the player progresses by collecting gems, leveling up, and acquiring more powerful upgrades.  
* **Meta-Progression:** The primary meta-progression is paying off the debt. Each run, the player's total debt carries over, creating a persistent goal. Additional meta-progression can include:  
  * Unlocking new characters by reaching debt milestones.  
  * Unlocking new loans from the Loan Shark.  
  * Permanent skill tree upgrades using a special currency, such as 'Inferno Gems,' earned from defeating bosses.

## **7\. Art & Sound Direction**

* **Art:** A stylized, cartoonish art style with a focus on vibrant colors and dynamic animations. Goblins are designed to be quirky and sympathetic. Fireball effects are exaggerated and visually impressive, with lots of explosions, screen shake, and particle effects.  
* **Sound:** A mischievous and intense soundtrack that shifts dynamically with the action. The sound of gold coins dropping and collecting is highly satisfying, and the sounds of fireballs and explosions are punchy and impactful. The Loan Shark NPC has a deep, slimy voice.