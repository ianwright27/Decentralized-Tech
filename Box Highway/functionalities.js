function base58ToNumber(base58) {
  // remove all non-numeric characters
  return parseInt(base58.replace(/[^\d]/g, ""), 10);
}

function setSeed(seed) {
  randomSeed(seed);
}

var params = new URLSearchParams(window.location.search);
var seed;

if (params.has("seed")) {
  // If the "seed" parameter exists, get its value
  seed = params.get("seed");
} else {
  // If the "seed" parameter doesn't exist, generate the god damn seed value
  seed = generateRandomSeed();
  console.log("[+] Generated new seed: ");
  console.log(seed);
}

// generate a random seed
function generateRandomSeed() {
  var characters = "0123456789abcdefghijklmnopqrstuvwxyz";
  var randomSeed = "";
  for (var i = 0; i < 44; i++) {
    var randomIndex = Math.floor(Math.random() * characters.length);
    randomSeed += characters.charAt(randomIndex);
  }
  return randomSeed;
}

// Convert the seed to a number
var seedNumber = base58ToNumber(seed);

// Seed the random number generator with the seedNumber
var seededRandom = new Math.seedrandom(seedNumber);

// Now we use seededRandom() instead of Math.random() to generate random numbers
// console.log('Random number:', seededRandom());
// we use seededRandom() forever now!
// ----------------------------------------------------------------------------------------

// useful classes

class RandomClass {
  constructor() {
    this.randomFn = Math.random;
    // seed
    this.randomFn = seededRandom;
    this.floorFn = Math.floor;
  }

  // #1
  random() {
    return this.randomFn();
  }

  // overriding #1
  random(value) {
    return this.randomFn() * value;
  }

  range(min, max) {
    return min + this.randomFn() * (max - min);
  }

  list(list) {
    return list[this.floorFn(this.randomFn() * list.length)];
  }

  weightedRandom(prob) {
    let i,
      sum = 0,
      r = this.randomFn();
    for (i in prob) {
      sum += prob[i];
      if (r <= sum) return i;
    }
  }
}
