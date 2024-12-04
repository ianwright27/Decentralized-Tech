var ar = {w: 9, h: 16}; // aspect ratio 
var _w = 800; 
var _h = _w * ar.h/ar.w; 
var background_color = "rgb(120,120,212)";  
background_color = "#F99306"; 

// characters
var size_factor = {w: 2, h: 3}; 
var playerActor = {
  x: _w * 0.5,  
  y: _h * 0.8, 
  w: 50 * size_factor.w, 
  h: 50 * size_factor.h, 
  bgcolor: "rgb(232,230,226)", 
  gravity: 0
}
var enemyActor = {
  x: _w * 0.5,  
  y: _h * 0.1, 
  w: 50 * size_factor.w, 
  h: 50 * size_factor.h, 
  bgcolor: "rgb(0,253,255)", 
  gravity: 1
} 
var npcOne = {
  x: _w * 0.5,  
  y: _h * 0.1, 
  w: 10 * size_factor.w, 
  h: 60 * size_factor.h, 
  bgcolor: "rgb(255,221,0)", 
  gravity: 15
}
var npcs = []; 
var enemies = []; 
var max_enemies = 3; 
var max_npcs = 3; 

// movement
var gravity = 1; 
var min_gravity = 15; 
var max_gravity = 25; 
var playerActorMoveDistance = 5; 


function setup() {
  createCanvas(_w, _h);  
  noStroke(); 
  // initial settings 
  playerActor.x = (_w - playerActor.w) / 2;  
  // create enemies 
  for (var i = 0; i < max_enemies; ++i) {
    enemies.push({
      x: random(0, _w),  
      y: random(0, _h * 0.4),  
      w: 50 * size_factor.w, 
      h: 50 * size_factor.h, 
      // bgcolor: "rgb(0,253,255)", 
      bgcolor: "#066CF9", 
      gravity: int(random(min_gravity, max_gravity))
    }); 
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
      gravity: npcOne.gravity
    });
  }
  
}

function draw() {
  background(background_color); 

    
  // display npcs 
  npcs.forEach((npc) => {
    drawNPC(npc); 
  }); 
  
  
  // display enemies 
  enemies.forEach((enemy) => {
    drawEnemyActor(enemy); 
  }); 

  
  playGame(); 
  
  drawPlayer(playerActor); 
  
}

function playGame() {
  // move the npcs 
  npcs.forEach((npc) => {
    npc.y += npc.gravity; 
    
    if (npc.y > _h) {
      npc.x = npcOne.x; 
      npc.y = -(npc.h * 2); // start from top again  
    }
  }); 
  
  // move enemy  
  enemies.forEach((enemy) => {
    
    // control playerActor 
    if (keyIsDown(37)) playerActor.x -= playerActorMoveDistance; 
    if (keyIsDown(39)) playerActor.x +=  playerActorMoveDistance;
    
    // check collision
    if (!collides(enemy, playerActor)) {
      enemy.y += enemy.gravity; 
    } else {
      // turn both actors red  
      background_color = "#fff";
      playerActor.bgcolor = "red"; 
      enemy.bgcolor = "red"; 
      // pause the game and exit 
      noLoop(); 
    }
    
    // if enemies pass 
    if (enemy.y > _h) {
      enemy.x = random(_w); 
      enemy.y = -(enemy.h * 2); // start from top again  
      enemy.bgcolor = "#066CF9"; 
      /*
      enemy.bgcolor = color(
        random(200), 
        random(200), 
        random(200)
      );
      */
      enemy.gravity = int(random(min_gravity, max_gravity)); 
    }
  });
  
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

function collides(rect1, rect2) {
    // Check if the rectangles are colliding
    if (rect1.x + rect1.w > rect2.x &&
        rect1.x < rect2.x + rect2.w &&
        rect1.y + rect1.h > rect2.y &&
        rect1.y < rect2.y + rect2.h) {
        return true;
    }
    return false;
}
