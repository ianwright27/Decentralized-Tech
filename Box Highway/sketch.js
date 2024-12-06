var ar = { w: 9, h: 16 }; // aspect ratio
var _w = 800;
var _h = (_w * ar.h) / ar.w;
var background_color = "rgb(120,120,212)";
background_color = "#f994068c";
background_color = "#f99406";

// characters
var size_factor = { w: 2, h: 3 };
var playerActor = {
  x: _w * 0.5,
  y: _h * 0.8,
  w: 50 * size_factor.w,
  h: 50 * size_factor.h,
  bgcolor: "rgb(232,230,226)",
  gravity: 0,
};
var enemyActor = {
  x: _w * 0.5,
  y: _h * 0.1,
  w: 50 * size_factor.w,
  h: 50 * size_factor.h,
  bgcolor: "rgb(0,253,255)",
  gravity: 1,
  nearMissed: false,
};
var npcOne = {
  x: _w * 0.5,
  y: _h * 0.1,
  w: 10 * size_factor.w,
  h: 60 * size_factor.h,
  bgcolor: "rgb(255,221,0)",
  gravity: 15,
};
var npcs = [];
var enemies = [];
var max_enemies = 3;
var max_npcs = 3;

// movement
var gravity = 1;
var min_gravity = 15;
var max_gravity = 25;
var playerActorMoveDistance = 5; // 5 - standard
var playerSpeed = 1;

// ui
var score = 0;
var scorePopups = [];
var nearMissPoints = 20;
var nearMisses = 0;

function setup() {
  createCanvas(_w, _h);
  noStroke();
  // initial settings
  playerActor.x = (_w - playerActor.w) / 2;
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
      // bgcolor: "rgb(255,221,0)",
      bgcolor: "rgb(59,59,58)",
      gravity: npcOne.gravity * playerSpeed,
    });
  }
}

function draw() {
  background(background_color);

  // 1) display npcs
  npcs.forEach((npc) => drawNPC(npc));

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
}

function playGame() {
  // increase player speed
  // if (keyIsDown(65)) playerSpeed += 0.12; // a/A key

  // move the npcs
  npcs.forEach((npc) => {
    npc.y += npc.gravity * playerSpeed;

    if (npc.y > _h) {
      npc.x = npcOne.x;
      npc.y = -(npc.h * 2); // start from top again
    }
  });

  // move enemy
  enemies.forEach((enemy) => {
    /* debug characters */
    // drawDebug(enemy);
    // drawDebug(playerActor);

    // control playerActor
    if (keyIsDown(37)) playerActor.x -= playerActorMoveDistance; // left
    if (keyIsDown(39)) playerActor.x += playerActorMoveDistance; // right

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
      // turn both actors red
      background_color = "#fff";
      playerActor.bgcolor = "red";
      enemy.bgcolor = "red";
      // game over
      gameOver();
    }

    // if enemies pass (reset enemies here)
    if (enemy.y > _h) {
      let points = Math.floor(enemy.gravity / 10);
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
}

function generateEnemy() {
  let newEnemy;
  let collisionDetected;

  do {
    // Generate a random position for the new enemy
    newEnemy = {
      x: random(0, _w),
      y: 0 - random(0, _h * 0.4),
      w: 50 * size_factor.w,
      h: 50 * size_factor.h,
      bgcolor: "#066CF9",
      gravity: int(random(min_gravity, max_gravity)) * playerSpeed,
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
    enemy.x = random(0, _w);
    enemy.y = 0 - random(0, _h * 0.4); // Resetting above the screen to fall again
    enemy.bgcolor = "#066CF9";
    enemy.gravity = int(random(min_gravity, max_gravity)) * playerSpeed;
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

function displayScorePopups() {
  for (let i = scorePopups.length - 1; i >= 0; i--) {
    let popup = scorePopups[i];
    let c = popup.color; // array of r,g,b values

    // Gradually reduce text size based on remaining alpha
    let currentSize = map(popup.alpha, 0, 255, 10, 33); // Map alpha to text size

    // fill(c[0], c[1], c[2], popup.alpha); // Fade out effect
    stroke(`rgba(0, 0, 0, ${popup.alpha / 255})`);
    fill(`rgba(${c[0]}, ${c[1]}, ${c[2]}, ${popup.alpha / 255})`);
    textSize(currentSize); // Dynamically set text size
    textAlign(CENTER);
    text(popup.points, popup.x, popup.y);

    // Update position and fade out
    popup.y -= 5; // Float upwards
    popup.alpha -= 1.5; // Gradually disappear

    if (popup.alpha <= 0) {
      scorePopups.splice(i, 1); // Remove when fully faded
    }
  }
}

function displayHUD() {
  textAlign(CENTER);
  fill(255);

  // global score
  textSize(42);
  text(`Score: ${score}`, 120, 80); // Top right for score

  // near misses
  textSize(32);
  text(`x${nearMisses}`, _w - 60, 80); // Top right for near misses
}

function drawPlayer(playerActor) {
  var p = playerActor;
  stroke("#000");
  strokeWeight(5);
  fill(p.bgcolor);
  rect(p.x, p.y, p.w, p.h);
}

function drawEnemyActor(enemyActor) {
  var e = enemyActor;
  stroke("#000");
  strokeWeight(5);
  fill(e.bgcolor);
  rect(e.x, e.y, e.w, e.h);
}

function drawNPC(npc) {
  var n = npc;
  stroke("#000");
  strokeWeight(5);
  fill(n.bgcolor);
  rect(n.x, n.y, n.w, n.h);
}

function gameOver() {
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
