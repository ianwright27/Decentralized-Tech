var _random = new RandomClass(); // use this random (no p5 random)

var ar = { w: 9, h: 16 }; // aspect ratio
var _w = 800;
var _h = (_w * ar.h) / ar.w;

var palette = _random.list(palettes); // select with the seeded random
// palette = palettes[0];

var background_color;
background_color = palette.background;

// characters
var size_factor = { w: 2, h: 3 };
var playerActor = {
  x: _w * 0.5,
  y: _h * 0.8,
  w: 50 * size_factor.w,
  h: 50 * size_factor.h,
  bgcolor: palette.opaquePlayerColor,
  gravity: 0,
};
var enemyActor = {
  x: _w * 0.5,
  y: _h * 0.1,
  w: 50 * size_factor.w,
  h: 50 * size_factor.h,
  bgcolor: palette.opaqueEnemyColor,
  gravity: 1,
  nearMissed: false,
};
var packageActor = {
  x: _w * 0.5,
  y: _h * 0.1,
  w: 20 * size_factor.w,
  h: 20 * size_factor.w,
  bgcolor: palette.packageColor,
  gravity: 1,
  isCollected: false,
};
var npcOne = {
  x: _w * 0.5,
  y: _h * 0.1,
  w: 10 * size_factor.w,
  h: 60 * size_factor.h,
  bgcolor: palette.npcColor,
  gravity: 15,
};
var npcs = [];
var enemies = [];
var max_enemies = 3;
var max_npcs = 3;
var enableStroke = false;

// movement
var gravity = 1;
var min_gravity = 15;
var max_gravity = 25;
var playerActorMoveDistance = 5; // 5 - standard
var playerSpeed = 1.1;
// playerSpeed = 1.1;

// ui
var score = 0;
// score = 2000;
var scorePopups = [];
var nearMissPoints = 20;
var nearMisses = 0;
var offScreenPenalties = 0;
var maxOffScreenPenalties = 100; // before game over
var reputationScore = 0;
var repScorePoints = 50; // by default
var reputationForScorePercentage;

// other
var debugMode = false;
var gameState = {
  preStart: true,
  running: false,
  over: false,
  paused: false,
};
var packageGenerated = false;
var packageGenerationProbability = 0.03; // 3 % // packageGenerationProbability = 0.8;
packageGenerationProbability = 0.2;
var packageGenerationRandom = 0.5; // initial
var packageGenerationInterval = setInterval(() => {
  packageGenerationRandom = _random.random();
  // console.log("package gen. random: ", packageGenerationRandom);
}, 1000 /* every 3 seconds */);
var attempts = 1;
var maxRestarts = 3; // until scores expire
// for enemy position generations (according to difficulty, to make it fair to all players)
var distanceFactor;
var demo = true; // free trial of the game
var buffer; // buffer canvas

// sound effects
let audioStarted = false;
let packageCollectionSound;
let crashSound;
let gameMusic;
let gameMusicOne;

function preload() {
  packageCollectionSound = loadSound("sounds/coin10.wav");
  crashSound = loadSound("sounds/click.wav");
  gameMusic = loadSound("music/hyperflight.wav");
}

function restartGame() {
  if (attempts > maxRestarts) {
    // forget the scores
    score = 0;
    reputationScore = 0;
    nearMisses = 0;
    offScreenPenalties = 0;
    gameState.preStart = true;
    attempts = 1;
  }

  // this line needs testing
  if (attempts < maxRestarts && offScreenPenalties === maxOffScreenPenalties) {
    offScreenPenalties = 0;
  }
  // scorePopups = [];
  npcs = [];
  enemies = [];

  // set the game states gameState
  gameState.preStart = false;
  gameState.running = true;
  gameState.over = false;
  gameState.paused = false;

  playerActor = {
    x: _w * 0.5,
    y: _h * 0.8,
    w: 50 * size_factor.w,
    h: 50 * size_factor.h,
    bgcolor: palette.opaquePlayerColor,
    gravity: 0,
  };
  packageGenerated = false;
  setup(); // Reinitialize game setup
  draw();
  loop();
  if (gameMusic && !gameMusic.isPlaying()) gameMusic.play();
}

function setup() {
  createCanvas(_w, _h);
  buffer = createGraphics(_w * 0.7, _h * 0.12);
  noStroke();
  // initial settings
  reputationForScorePercentage = map(
    packageGenerationProbability,
    0.03 /* from 3% */,
    0.8 /* to 80% */,
    0.9 /* from 90% */,
    0.05 /* to 5%*/
  );
  distanceFactor = _random.floorFn(map(playerSpeed, 1, 1.8, 1, 6));
  // maxRestarts = _random.floorFn(map(playerSpeed, 1, 2, 3, 8));
  playerActor.x = (_w - playerActor.w) / 2;
  // packageActor.x = (_w - playerActor.w) / 2;
  // create enemies
  for (var i = 0; i < max_enemies; ++i) {
    // Call the function to generate enemies without overlap
    generateEnemy();
  }
  // create NPCs
  npcOne.x = (_w - npcOne.w) / 2;
  for (var j = 0; j < max_npcs; ++j) {
    var _height = j * npcOne.h * 3.5;
    npcs.push({
      x: npcOne.x,
      y: _height,
      w: npcOne.w,
      h: 60 * size_factor.h,
      bgcolor: palette.npcColor,
      gravity: npcOne.gravity * playerSpeed,
    });
  }

  // play game music in a loop
  // if (gameMusic) gameMusic.loop();
}

function draw() {
  background(background_color);

  // debug
  // if (debugMode) enemies.forEach(drawDebug);

  // 1) display npcs
  npcs.forEach((npc) => drawNPC(npc));

  // 3) display packageActor
  if (packageGenerated) drawPackageActor(packageActor);

  // 2) display enemies
  enemies.forEach((enemy) => {
    drawEnemyActor(enemy);
  });

  // 3) display player
  drawPlayer(playerActor);

  // 4) Display all score popups
  displayScorePopups();

  // 5) draw HUD
  displayHUD();

  // game logic
  playGame();

  if (gameState.running === false || gameState.paused === true) {
    if (gameMusic) gameMusic.pause(); // pause music
  }

  // Show "Press SPACE to Start" message in the pre-start state
  if (gameState.preStart) {
    textAlign(CENTER, CENTER);
    textSize(72);
    fill(palette.hudTextColor);
    stroke("#000");
    strokeWeight(5);
    text("Press SPACE to Start", width / 2, height / 2);
    noStroke();
    return; // Exit draw loop until the game starts
  }
}

function playGame() {
  if (!gameState.running) {
    return; // Skip logic if paused or over
  }
  // handle packages
  // ------------------
  // generate packages
  // var r = random();
  if (
    !packageGenerated &&
    packageGenerationRandom < packageGenerationProbability
  ) {
    generatePackage();
  }
  // move the package
  if (packageGenerated) {
    // move the package
    packageActor.y += packageActor.gravity;

    // check collision
    if (collides(packageActor, playerActor) && !packageActor.isCollected) {
      applyVisualEffect(playerActor); // to the playerActor

      // play sound
      if (packageCollectionSound) packageCollectionSound.play();

      packageActor.y = _h + 100; // make it disappear

      reputationScore += repScorePoints;
      // do some math (offScreenPenalties & reputationScore)
      if (offScreenPenalties >= reputationScore) {
        offScreenPenalties -= reputationScore; // Offset penalties by reputation
        reputationScore = 0; // Fully consumed
      } else {
        reputationScore -= offScreenPenalties; // Partially consume reputation
        offScreenPenalties = 0; // Fully offset penalties
      }
      packageActor.isCollected = true;
    }

    if (packageActor.y > _h) {
      // reset to false so it can be generated again
      packageGenerated = false;
      // reset to false so it can be collected again
      packageActor.isCollected = false;
    }
  }
  // -------------------------------------------------

  // handle npcs
  // ------------------
  // move the npcs
  npcs.forEach((npc) => {
    npc.y += npc.gravity * playerSpeed;

    if (npc.y > _h) {
      npc.x = npcOne.x;
      npc.y = -(npc.h * 2); // start from top again
    }
  });
  // -------------------------------------------------

  // handle off-road behaviour
  // ------------------------------
  checkOffRoad();
  // -------------------------------------------------

  /* debug characters */
  // drawDebug(enemy); drawDebug(playerActor);

  // enemy movement &
  // player controls
  // -------------------------------------------------
  enemies.forEach((enemy) => {
    // control playerActor
    if (keyIsDown(37)) playerActor.x -= playerActorMoveDistance; // left
    if (keyIsDown(39)) playerActor.x += playerActorMoveDistance; // right

    // Handle enemy collisions
    for (let i = 0; i < enemies.length; i++) {
      for (let j = i + 1; j < enemies.length; j++) {
        handleCollision(enemies[i], enemies[j]);
      }
    }

    /* check collision */
    // near miss
    if (nearMiss(playerActor, enemy, playerActor.w + 20, enemy)) {
      // Award points for near miss
      nearMisses += 1;
      score += nearMissPoints; // Adjust points as necessary
      // Add new popup near playerActor
      scorePopups.push({
        x: playerActor.x + playerActor.w / 2,
        y: playerActor.y - 20,
        points: `+${nearMissPoints} Near Miss`,
        color: [255, 219, 13], // #ffdb0d
        alpha: 255, // Fades out over time
      });
      // showPoints(playerActor.x, playerActor.y, "+10 Near Miss");
      console.log("near miss");
    }

    // collision
    if (!collides(enemy, playerActor)) {
      enemy.y += enemy.gravity;
    } else {
      finalScoreCalculation();
      // play sound
      if (crashSound) crashSound.play();
      // turn both actors red
      // game over (it will update gameState respectively)
      gameOver();
    }

    // if enemies pass (reset enemies here)
    if (enemy.y > _h) {
      let points = _random.floorFn(enemy.gravity / 10);
      score += points;

      // Add new popup near playerActor
      scorePopups.push({
        x: playerActor.x + playerActor.w / 2,
        y: playerActor.y - 20,
        points: `+${points}`,
        color: [17, 240, 76], // #11f04c
        alpha: 255, // Fades out over time
      });

      // reset enemy
      resetEnemy(enemy);
    }
  });
  // -------------------------------------------------
}

function applyVisualEffect(actor, effectDuration = 500) {
  // Save original styles
  actor.originalBgColor = actor.bgcolor;
  actor.bgcolor = palette.packagePlayerColor; // Purple glow effect

  // Optional: Add other visual effects like size or animation
  actor.isGlowing = true;

  // Revert after the effect duration
  setTimeout(() => {
    actor.bgcolor = actor.originalBgColor;
    actor.isGlowing = false;
  }, effectDuration);
}

function toggleBool(bool) {
  return !bool;
}

function handleKeyEvents(key) {
  if (key === " ") {
    if (!gameState.running && !gameState.over && gameState.preStart) {
      // Start the game
      console.log("Game started");
      gameState.preStart = false; // now that it has started
      gameState.running = true;
      gameState.paused = false;
      gameState.over = false;
      if (gameMusic) gameMusic.loop();
    } else if (gameState.running) {
      // Pause the game
      console.log("Game paused");
      gameState.preStart = false;
      gameState.running = false;
      gameState.paused = true;
      // if (gameMusic) gameMusic.pause();
    } else if (gameState.paused) {
      // Resume the game
      console.log("Game resumed");
      gameState.preStart = false;
      gameState.running = true;
      gameState.paused = false;
      if (gameMusic) gameMusic.play();
    } else if (gameState.over) {
      attempts += 1;
      if (attempts > maxRestarts) {
        if (gameMusic) gameMusic.stop();
        console.log("[+] Max attempts reached, Refresh or Start New Game..");

        if (demo) {
          // trial
          attempts = maxRestarts + 1; // Reset attempts counter
          restartGame();
        }
      } else {
        // Restart the game
        console.log("Game restarted");
        restartGame();
      }
    }
  }
}

// Trigger key events only once per press
function keyPressed() {
  handleKeyEvents(key);
}

// Function to handle collision resolution between enemies
function handleCollision(enemyA, enemyB) {
  // If there is a collision
  if (isColliding(enemyA, enemyB)) {
    // Set enemy B to semi-transparent
    enemyB.isTransparent = true;
    enemyB.originalColor = enemyB.bgcolor; // Store the original color
    enemyB.bgcolor = palette.transparentEnemyColor; // Set semi-transparent color

    // Set a timeout to restore the color after 500ms (or any duration you prefer)
    setTimeout(() => {
      enemyB.bgcolor = enemyB.originalColor; // Restore original color
      enemyB.isTransparent = false; // Reset transparency state
    }, 10);
  }
}

function isColliding(enemy1, enemy2) {
  return (
    enemy1.x < enemy2.x + enemy2.w &&
    enemy1.x + enemy1.w > enemy2.x &&
    enemy1.y < enemy2.y + enemy2.h &&
    enemy1.y + enemy1.h > enemy2.y
  );
}

function updateScore(points) {
  score += points; // Update score globally
  if (score < 0) score = 0; // Prevent negative score
}

function isOffScreen(playerActor) {
  if (playerActor.x < 0 || playerActor.x > _w - playerActor.w) {
    return true;
  } else {
    return false;
  } // Return true if off-screen, false otherwise
}

function checkOffRoad() {
  const leftLimit = 0 - playerActor.w * 3;
  const rightLimit = _w + playerActor.w * 3;
  const penalty = 0.15; // 15% decrease in score

  if (playerActor.x < 0 || playerActor.x > _w - playerActor.w) {
    updateScore(-penalty);
    updatePenalties(penalty);
    // Flash orange background
    if (reputationScore > 0)
      background_color = palette.reputationOffScreenFlash;
    // Flash red background
    if (reputationScore == 0) background_color = palette.offScreenFlash;
  } else {
    background_color = palette.background; // Reset background color to original
  }
}

function updatePenalties(penalty) {
  // Add the penalty to offScreenPenalties
  offScreenPenalties += penalty;

  // Use reputationScore to offset penalties
  if (reputationScore > 0) {
    if (offScreenPenalties >= reputationScore) {
      offScreenPenalties -= reputationScore; // Offset penalties by reputation
      reputationScore = 0; // Fully consumed
    } else {
      reputationScore -= offScreenPenalties; // Partially consume reputation
      offScreenPenalties = 0; // Fully offset penalties
    }
  }

  // Check if penalties exceed maximum allowed
  if (offScreenPenalties > maxOffScreenPenalties + 1) {
    offScreenPenalties = maxOffScreenPenalties; // Clamp to max
    gameOver(); // Trigger game over if max reached
  }
}

function generateEnemy() {
  let newEnemy;
  let collisionDetected;

  do {
    // Generate a random position for the new enemy
    newEnemy = {
      x: _random.range(0 - enemyActor.w / 2, _w + enemyActor.w / 2), // Allow rogue spawns
      y: 0 - _random.range(0, _h * 0.4) * distanceFactor,
      w: 50 * size_factor.w,
      h: 50 * size_factor.h,
      bgcolor: palette.opaqueEnemyColor,
      gravity: int(_random.range(min_gravity, max_gravity)) * playerSpeed,
    };

    collisionDetected = false;

    // Check for collision with existing enemies
    for (let enemy of enemies) {
      if (collides(newEnemy, enemy)) {
        collisionDetected = true;
        break; // Exit the loop and regenerate the position
      }
    }
  } while (collisionDetected); // Keep regenerating until no collision is detected

  // Add the new enemy to the enemies array
  enemies.push(newEnemy);
}

function resetEnemy(enemy) {
  let collisionDetected;

  do {
    // Reset the enemy's position to a random spot at the top of the screen
    enemy.x = _random.range(0 - enemyActor.w / 2, _w + enemyActor.w / 2); // Allow rogue spawns
    enemy.y = 0 - _random.range(0, _h * 0.4) * distanceFactor; // Resetting above the screen to fall again
    enemy.bgcolor = palette.opaqueEnemyColor;
    enemy.gravity = int(_random.range(min_gravity, max_gravity)) * playerSpeed;
    enemy.nearMissed = false;

    // Check for collision with other enemies
    collisionDetected = false;
    for (let otherEnemy of enemies) {
      if (otherEnemy !== enemy && collides(enemy, otherEnemy)) {
        collisionDetected = true;
        break; // Exit the loop and regenerate position if collision is detected
      }
    }
  } while (collisionDetected); // Keep retrying until no collision is detected

  // You can add any additional reset logic here, such as resetting speeds, colors, etc.
}

function generatePackage() {
  do {
    // Reset the enemy's position to a random spot at the top of the screen
    packageActor.x = _random.range(packageActor.w, _w - packageActor.w); // Allow rogue spawns
    packageActor.y = 0 - _random.range(0, _h * 0.4); // Resetting above the screen to fall again
    packageActor.w = 20 * size_factor.w;
    packageActor.h = 20 * size_factor.w;
    packageActor.bgcolor = palette.packageColor;
    packageActor.gravity =
      int(_random.range(min_gravity, max_gravity)) * playerSpeed;

    // Check for collision with other enemies
    collisionDetected = false;
    for (let otherEnemy of enemies) {
      if (collides(packageActor, otherEnemy)) {
        collisionDetected = true;
        break; // Exit the loop and regenerate position if collision is detected
      }
    }
  } while (collisionDetected); // Keep retrying until no collision is detected

  packageGenerated = true;
  console.log("package generated");
}

function displayScorePopups() {
  for (let i = scorePopups.length - 1; i >= 0; i--) {
    let popup = scorePopups[i];
    let c = popup.color; // array of r,g,b values

    // Gradually reduce text size based on remaining alpha
    let currentSize = map(popup.alpha, 0, 255, 10, 43); // Map alpha to text size

    // fill(c[0], c[1], c[2], popup.alpha); // Fade out effect
    stroke(`rgba(0, 0, 0, ${popup.alpha / 255})`);
    fill(`rgba(${c[0]}, ${c[1]}, ${c[2]}, ${popup.alpha / 255})`);
    textSize(currentSize); // Dynamically set text size
    textAlign(CENTER);
    text(popup.points, popup.x, popup.y);
    noStroke();
    noFill();

    // Update position and fade out
    popup.y -= 5; // Float upwards
    popup.alpha -= 1.5; // Gradually disappear

    if (popup.alpha <= 0) {
      scorePopups.splice(i, 1); // Remove when fully faded
    }
  }
}

function displayHUD() {
  fill(palette.hudTextColor);
  stroke("#000");

  // global score
  textSize(42);
  textAlign(LEFT);
  text(`Score: ${_random.floorFn(score)}`, 30, 80); // Top right for score

  // reputation score
  textAlign(LEFT);
  textSize(32);
  text(`Reputation: ${_random.floorFn(reputationScore)}`, 30, 140); // Top right for score

  // attempts
  textAlign(LEFT);
  textSize(52);
  text(`${_random.floorFn(attempts)}/${maxRestarts}`, 30, 200); // Top right for score

  // near misses
  textAlign(CENTER);
  textSize(32);
  text(`x${_random.floorFn(nearMisses)}`, _w - 60, 80); // Top right for near misses

  // off-screen penalties
  textAlign(CENTER);
  textSize(32);
  if (offScreenPenalties == 0) {
    fill(palette.offScreenHudGood);
  } else {
    fill(palette.offScreenHudBad); // dark orange
  }
  text(
    `${offScreenPenalties > 0 ? "off-road " : ""}${_random.floorFn(
      offScreenPenalties
    )}`,
    _w - 120,
    120
  ); // Top right for offscreen penalties

  noStroke();
}

function drawPlayer(playerActor) {
  var p = playerActor;
  if (enableStroke) stroke("#000");
  strokeWeight(5);
  fill(p.bgcolor);
  rect(p.x, p.y, p.w, p.h);
}

function drawEnemyActor(enemyActor) {
  var e = enemyActor;
  if (enableStroke) stroke("#000");
  strokeWeight(5);
  fill(e.bgcolor);
  rect(e.x, e.y, e.w, e.h);
}

function drawPackageActor(packageActor) {
  var p = packageActor;
  if (enableStroke) stroke("#000");
  strokeWeight(5);
  fill(p.bgcolor);
  rect(p.x, p.y, p.w, p.h);
}

function drawNPC(npc) {
  var n = npc;
  if (enableStroke) stroke("#000");
  strokeWeight(5);
  fill(n.bgcolor);
  rect(n.x, n.y, n.w, n.h);
}

function finalScoreCalculation() {
  if (gameState.over) {
    var bonusPoints = nearMisses * 5;
    score += reputationForScorePercentage * reputationScore + bonusPoints;
  }
}

function gameOver() {
  // update the states
  gameState.running = !gameState.running;
  gameState.over = true;
  gameState.paused = false;

  // display buffer only when game is over
  if (
    (attempts === maxRestarts && offScreenPenalties >= maxOffScreenPenalties) ||
    attempts === maxRestarts
  ) {
    // game over

    // update of the global score
    if (
      offScreenPenalties === maxOffScreenPenalties ||
      (offScreenPenalties > 0 && isOffScreen(playerActor))
    ) {
      buffer.background(palette.bufferOffScreenFlash);
    } else {
      buffer.background(palette.bufferBackground);
    }
    buffer.fill(palette.hudTextColor);
    buffer.stroke("#000");
    buffer.strokeWeight(5);
    buffer.textSize(32);
    buffer.textAlign(LEFT);
    buffer.text(`Final Score `, 30, 80); // Top right for score
    buffer.textSize(42);
    buffer.textAlign(LEFT);
    buffer.text(`${_random.floorFn(score)}`, 30, 140); // Top right for score
    buffer.noStroke();
    image(buffer, 0, 0);
  }

  // game over text
  textSize(82);
  stroke("#000");
  fill(palette.gameOverText); // dark orange
  var textValue = "";
  textValue = attempts < maxRestarts ? "Try Again" : "Game Over";
  text(textValue, _w / 2, _h / 2); // Top right for offscreen penalties
  noStroke();
  noLoop();
}

// Debugging function to visualize centers and thresholds
function drawDebug(rect) {
  let centerX = rect.x + rect.w / 2;
  let centerY = rect.y + rect.h / 2;

  // Draw center point
  fill("red");
  stroke(0);
  strokeWeight(2);
  ellipse(centerX, centerY, 10, 10); // Small red dot at center
  noStroke();

  // Optional: Draw near-miss threshold (for player only)
  if (rect === playerActor) {
    noFill();
    stroke("blue");
    strokeWeight(2);
    ellipse(centerX, centerY, 50, 50); // Near-miss radius (50 threshold * 2)
    noStroke();
  }
}

function nearMiss(rect1, rect2, threshold, enemy) {
  let center1 = { x: rect1.x + rect1.w / 2, y: rect1.y + rect1.h / 2 };
  let center2 = { x: rect2.x + rect2.w / 2, y: rect2.y + rect2.h / 2 };

  let distance = dist(center1.x, center1.y, center2.x, center2.y);

  // Near miss occurs when distance is less than the threshold but no collision
  if (distance < threshold && !collides(rect1, rect2)) {
    if (!enemy.nearMissed) {
      // Only increment once
      enemy.nearMissed = true;
      return true;
    }
  }

  return false;
}

function collides(rect1, rect2) {
  // Check if the rectangles are colliding
  if (
    rect1.x + rect1.w > rect2.x &&
    rect1.x < rect2.x + rect2.w &&
    rect1.y + rect1.h > rect2.y &&
    rect1.y < rect2.y + rect2.h
  ) {
    return true;
  }
  return false;
}
