
/***************/
/* Level Plans */
/***************/

var Level1Plan = [
	"                        ",
	"                        ",
	"                        ",
	"                        ",
	"                        ",
	"  x                  x  ",
	"  x                  x  ",
	"  x                  x  ",
	"  x                  x  ",
	"  x   L xx       T   x  ",
	"  xxxxxxxxxxxxxxxxxxxx  ",
	"                        ",
	{name: "Earth"}
];

// Gravitational Constants
var gravities = {
	Earth: 9.81,
	Mars: 3.71,
	Jupiter: 24.8
};

var progress = 1,
		currentLevel = "Level" + progress.toString() + "Plan",
		levelData = window[currentLevel].pop(),
		G = gravities[levelData.name];
		// G = gravities["Earth"];


/***************/
/* Plan Legend */
/***************/

var activeTokens = {
				"L": Launcher,
				"P": Projectile,
				"T": Target,
				// "s": SoftWall
		},
		staticTokens = {
				"x": "HardWall", 
		};

// Used to locate only activeTokens 
// Would only find 1st instance of a static token
function findPos (array, string) {
	var x = 0, y = 0;
	for (i = 0; i < array.length; i++) {
		x = array[i].indexOf(string); 
		if (x >= 0) {
			y = i; 
			return new Vector(x,y);
		}
	}
}


/**********************/
/* Token Constructors */
/**********************/

// pos is a vector.
// This is the "standard" Launcher. To modify or add attributes,
// create a Launcher factory that directly changes the relevant
// properties (e.g. forceMultiple, size, ammo, etc.).
// Think about letting a single Launcher fire projectiles of 
// different masses.
function Launcher(pos) {
	this.pos = pos;
	this.size = new Vector(1,1);
	this.launchAngle = Math.PI/4; 																			
	this.forceMultiple = 5; 																
	this.timeApplied = 250;  																		
	this.ammo = 5;
	this.initialForce = this.forceMultiple * G;											
}

Launcher.prototype.fire = function() {
	var newRound = new Projectile(this.pos);
	var velocity = impulse(this.launchAngle, this.initialForce, 
			this.timeApplied, newRound.mass);
	newRound.velocity = velocity;
	level.activeGrid.push(newRound);
	this.ammo--;
	};	

Launcher.prototype.type = "launcher";

function Projectile(pos) {
	this.mass = 9.81; // in kilograms																
	this.pos = pos
	this.size = new Vector(0.5,0.5);
	this.t0 = new Date().getTime();
	this.velocity = new Vector(0,0);
}

// Position under constant acceleration. Thanks, Isaac.
// t0 = time when projectile is fired.
Projectile.prototype.move = function (deltaT) {
	var newX = this.pos.x + this.velocity.x * deltaT;
	var newY = this.pos.y + this.velocity.y * deltaT + 
						 1/2 * G * deltaT * deltaT;
	var newPos = new Vector(newX, newY);
	return newPos;
};

Projectile.prototype.type = "projectile";

Projectile.prototype.act = function(deltaT, level) {
	var newPos = this.move(deltaT);
	var obstacle = level.obstacleAt(this);
	if (obstacle)
		level.interactWith(this, obstacle);
	this.pos = newPos;
	var crushable = level.crushableAt(this.pos);
	if (crushable) 
		level.interactWith(this, crushable);
	console.log()
};

function Target (pos) {
	this.pos = pos;
	this.power = 4;
	this.size = new Vector(0.5, 0.5);
	this.interact = function (obj) {
		delete obj;
		this.power -= 2
	};
}

Target.prototype.type = "target";

/*
function HardWall() {}
function SoftWall() {}
*/

/*************************************/
/* Initialize and Monitor Game State */
/*************************************/

var scale = 20;

// Initialize Level 
function WorldBuilder (plan) {
	this.width = plan[0].length;
	this.height = plan.length;
	this.staticGrid = [];
	this.activeGrid = [];
	
	for (var y = 0; y < this.height; y++) {				
		var levelSlice = plan[y], staticSlice = [];
		for (var x = 0; x < this.width; x++) {
			var ch = levelSlice[x];
			var type = null;
			var aToken = activeTokens[ch], sToken = staticTokens[ch];
			if (aToken)
				this.activeGrid.push(new aToken(new Vector(x,y), ch));
			else if (sToken) 
				type = sToken;
			staticSlice.push(type);
		}
		this.staticGrid.push(staticSlice);
	}
	this.status = this.finishDelay = null;
}

// Identify obstacles that cause an interaction prior to impact.
WorldBuilder.prototype.obstacleAt = function (actor) {
	var xStart = Math.floor(actor.newPos.x);
	var xEnd = Math.ceil(actor.newPos.x + actor.size.x);
	var yStart = Math.floor(actor.newPos.y);
	var yEnd = Math.ceil(actor.newPos.y + actor.size.y);

// Check for static obstacles.
	for (var y = yStart; y < yEnd; y++) {
		for (var x = xStart; x < xEnd; x++) {
			var sObstacle = this.staticGrid[y][x]
			if (sObstacle) 
				return sObstacle; // returns null or string
		}
	}

// Check for active obstacles.
	for (var i = 0, j = this.activeGrid.length; i < j; i++) {
		var aObstacle = this.activeGrid[i];
		if (aObstacle != actor && !aObstacle.crushable &&
				xEnd > aObstacle.newPos.x &&
				xStart < aObstacle.newPos.x + aObstacle.size.x &&
				yEnd > aObstacle.newPos.y &&
				yStart < aObstacle.newPos.y + aObstacle.size.y)
			return aObstacle; 
	}
};

// Identify obstacles that cause an interaction after impact (i.e. crushables).
WorldBuilder.prototype.crushableAt = function (actor) {
	for (var i = 0, j = this.activeGrid.length; i < j; i++) {
		var aObstacle = this.activeGrid[i];
		if (aObstacle != actor && aObstacle.crushable &&
				xEnd > aObstacle.pos.x &&
				xStart < aObstacle.pos.x + aObstacle.size.x &&
				yEnd > aObstacle.pos.y &&
				yStart < aObstacle.pos.y + aObstacle.size.y)
			return aObstacle;
	}
};

// Move Actors
WorldBuilder.prototype.animate = function(step, keys) {
	if (this.status != null)
		this.finishDelay -= step;

	while (step > 0) {
		var thisStep = Math.min(step, maxStep);
		this.activeGrid.forEach(function(actor) {
			actor.act(thisStep, this, keys)
		}, this);
		step -= thisStep
	}
};

WorldBuilder.prototype.interactWith = function(obj1, obj2) {
	if (obj2 == "HardWall") {
		obj1.velocity = obj1.velocity.scale(-1);
	} else obj2.interact(obj1);
};

/******************/
/* Draw the Level */
/******************/

// DOM Element Helper
function elMaker(name, className) {
	var el = document.createElement(name);
	if (className) el.className = className;
	return el;
}

// DOM Display
// level is the worldBuilder object
function DOMDisplay(parent, level) {
	this.wrap = parent.appendChild(elMaker("div", "game"));
	this.level = level;

	this.wrap.appendChild(this.drawBackground());
	this.activeLayer = null;
	this.drawFrame();
}

DOMDisplay.prototype.drawBackground = function () {
	var table = elMaker("table", "background");
	table.style.width = this.level.width * scale + "px";

// this.level has a staticGrid property only if it's WorldBuilder.

	this.level.staticGrid.forEach(function(row) {
		var rowEl = table.appendChild(elMaker("tr"));
		rowEl.style.height = scale + "px";
		row.forEach(function(type) {
			rowEl.appendChild(elMaker("td", type))
		});
	});
	return table;
};

DOMDisplay.prototype.drawActors = function() {
  var wrap = elMaker("div", "active");
  this.level.activeGrid.forEach(function(token) {
    var rect = wrap.appendChild(elMaker("div", 
    	"token " + token.type));
    rect.style.width = token.size.x * scale + "px";
    rect.style.height = token.size.y * scale + "px";
    rect.style.left = token.pos.x * scale + "px";
    rect.style.top = token.pos.y * scale + "px";
  });
  return wrap;
};

DOMDisplay.prototype.drawFrame = function() {
	if (this.activeLayer) 
		this.wrap.removeChild(this.activeLayer);
	this.activeLayer = this.wrap.appendChild(this.drawActors());
	this.wrap.className = "game " + (this.level.status || "");
	// this.scrollPlayerIntoView();
};

DOMDisplay.prototype.clear = function() {
  this.wrap.parentNode.removeChild(this.wrap);
};

/********************/
/* Math and Physics */
/********************/

// Trusty vector object
function Vector(x, y) {
	this.x = x;
	this.y = y;
}

Vector.prototype.plus = function(vector) {
	return new Vector(this.x + vector.x, this.y + vector.y);
};

Vector.prototype.scale = function(scalar) {
	return new Vector(this.x * scalar, this.y * scalar);
};

// Calculate Launch Velocity Using Simple Impulse Equations
// launchAngle in radians, launchForce in newtons, timeApplied
// in seconds, projMass in kg
function impulse(launchAngle, launchForce, timeApplied, projMass) {
	var xVelocity = launchForce * Math.cos(launchAngle) * 							
										timeApplied / projMass;         									
	var yVelocity = (launchForce * Math.sin(launchAngle) - G) *  		
										timeApplied / projMass;  
	var velocity = new Vector(xVelocity, yVelocity);
	return velocity;
}


/****************/
/* Run the Game */
/****************/

function runGame(plans, Display) {
	function startLevel() {
		runLevel(new WorldBuilder(plans), Display, function(status) {
			if (status == "lost")
				startLevel();
			else
				console.log("You win?");
		});
	}
	startLevel();
}

function runLevel(level, Display, andThen) {
	var display = new Display(document.body, level);
	runAnimation(function(step) {
		level.animate(step, arrows);
		display.drawFrame(step);
		if (level.isFinished()) {
			display.clear();
			if (andThen)
				andThen(level.status);
			return false;
		}
	});
}

function runAnimation(frameFunc) {
	var lastTime = null;
	function frame(time) {
		var stop = false;
		if (lastTime != null) {
			var timeStep = Math.min(time - lastTime, 100) / 1000;
			stop = frameFunc(timeStep) === false;
		}
		lastTime = time;
		if (!stop) {
			requestAnimationFrame(frame);
		}
	}
	requestAnimationFrame(frame);
}



/**************/
/* Some Tests */
/**************/

/*
// Test launcher.
var launcher1 = new Launcher(10, 5, 5);
console.log (launcher1);
launcher1.fire();
var trackerLog = [];
var currentRound = launcher1.projectiles[launcher1.projectiles.length - 1];
var countdown = 20;
function trackerUpdate () {
	currentRound.tracker();
	trackerLog.push(currentRound.pos);
	if (trackerLog.length > 20) {
		clearInterval(trackerInterval);
		console.log(trackerLog);
	}
}
var trackerInterval = window.setInterval(trackerUpdate, 10);
*/