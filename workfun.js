
/***************/
/* Level Plans */
/***************/

var levelPlans = [[
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
	{name: "Earth", G: 9.81}
]];

/* // Gravitational Constants
var gravities = {
	Earth: 9.81,
	Mars: 3.71,
	Jupiter: 24.8
};
*/

var progress = 1,
		currentLevel = levelPlans[progress - 1],
		levelData = window["currentLevel"].pop(),
		G = levelData["G"];


/***************/
/* Plan Legend */
/***************/

var activeTokens = {
				"L": Launcher,
				"P": Projectile,
				"T": Target,
		},
		// No two static tokens can have the same type
		staticTokens = {
				"x": new HardWall(), 
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
function HardWall() {}

HardWall.prototype.type = "HardWall";
HardWall.prototype.interact = {
	x: function(obj) {
			obj.velocity.x *= -1;
		},
	y: function(obj) { 
			obj.velocity.y *= -1;
		},
};
HardWall.prototype.size = new Vector(1,1);

function Launcher(pos) {
	this.pos = pos;
	this.size = new Vector(1,1);
	this.launchAngle = Math.PI/3; 																			
	this.forceMultiple = 5; 															
	this.timeApplied = 2;  																		
	this.ammo = 5;
	this.initialForce = this.forceMultiple * 9.81;											
}

// Takes the activeGrid as its parameter
Launcher.prototype.fire = function(level) {
	if (this.ammo > 0) {
		var newRound = new Projectile(this.pos.plus(new Vector(1,0)));
		var velocity = impulse(this.launchAngle, this.initialForce, 
				this.timeApplied, newRound.mass);
		newRound.velocity = velocity;
		level.activeGrid.push(newRound);
		newRound.ghostChange(level);
		console.log("fire");
		this.ammo--;
	} else {
		console.log("You're out of ammo, sir.");
		// also change status b/c game over (or buy ammo ha ha)
	}
};	

Launcher.prototype.type = "launcher";
Launcher.prototype.act = function(deltaT, level, controlObj) {
	console.log(this.launchAngle);
};

Launcher.prototype.interact = {
	x: function(obj) {
			if(!obj.ghost) 
			obj.velocity.x *= -1;
		},
	y: function(obj) {
			if(!obj.ghost) 
			obj.velocity.y *= -1;
		},
};

function Projectile(pos) {
	this.mass = 9.81; // in kilograms																
	this.pos = pos
	this.size = new Vector(0.5,0.5);
	this.t0 = new Date().getTime();
	this.velocity = new Vector(0,0);
	this.ghost = true;
}

Projectile.prototype.type = "projectile";

// Position under constant acceleration. Thanks, Isaac.
// t0 = time when projectile is fired.
Projectile.prototype.move = move;

var timeoutID;
Projectile.prototype.ghostChange = function(level) {
		timeoutID = window.setTimeout(function() {
			var activeLength = level.activeGrid.length;
			level.activeGrid[activeLength - 1].ghost = false;
		}, 500);
};

Projectile.prototype.act = function(deltaT, level) {
	var newStats = this.move(deltaT);
	var newYVelocity = newStats["newYVelocity"];
	this.newPos = newStats["newPos"];
	
	var obstacle = level.sObstacleAt(this) || level.aObstacleAt(this);
	if (obstacle)
		level.interactWith(this, obstacle);
	else {
		this.pos = this.newPos;
		this.velocity.y = newYVelocity;
		var crushable = level.crushableAt(this);
		if (crushable) 
			level.interactWith(this, crushable);
	}
};

function Target (pos) {
	this.pos = pos;
	this.power = 4;
	this.size = new Vector(1, 1);
}

Target.prototype.type = "target";
Target.prototype.act = function() {
	// Placeholder
};
Target.prototype.interact = {
	x: function (obj) {
		obj.velocity.x *= -0.5;
		this.power -= 2;
	},
	y: function (obj) {
		obj.velocity.y *= -0.5;
		this.power -= 2;
	}
};

/*
function HardWall() {}
function SoftWall() {}
*/

/*************************************/
/* Initialize and Monitor Game State */
/*************************************/

var scale = 20;
var maxStep = 0.05;
var xStart, xEnd, yStart, yEnd;

// Initialize Level 
function Level (plan) {
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
				type = sToken.type;
			staticSlice.push(type);
		}
		this.staticGrid.push(staticSlice);
	}
	this.status = this.finishDelay = null;
}

// Identify static obstacles that cause an interaction prior to impact.
Level.prototype.sObstacleAt = function (actor) {

	// Define scan area
	xStart = Math.floor(actor.newPos.x);
	yStart = Math.floor(actor.newPos.y);
	xEnd = Math.ceil(actor.newPos.x + actor.size.x);
	yEnd = Math.ceil(actor.newPos.y + actor.size.y);

	// initialize sObstacle
	var sObstacle = {
		obj: null,
		xBlock: null,
		yBlock: null
	};

	// Check for static obstacles.
	for (var y = yStart; y < yEnd; y++) {
		for (var x = xStart; x < xEnd; x++) {
			var sType = this.staticGrid[y][x];
			for (var i in staticTokens) {
				if (staticTokens[i].type === sType)
					sObstacle.obj = staticTokens[i];                                   
			}
			if (sObstacle.obj) {
				console.log(sObstacle.obj + " " + typeof(sObstacle.obj));
				yTest(x, y, sObstacle, actor);
				return sObstacle; 
			} 
		}
	}
};

// (x,y) is the position of the obstacle. obstacle and actor
// are objects representing those things.
function yTest(x, y, obstacle, actor) {
	// find leading corner and test which edge hits first
	var xLead, yLead, deltaX, yZero, yPrime;
	
	if (actor.velocity.x >= 0) { 
		xLead = actor.pos.x + actor.size.x; 
		deltaX = x - xLead;
		if (xLead >= x) { obstacle.yBlock = true; }
	} else { 
		xLead = actor.pos.x; 
		deltaX = (x + 1) - xLead;
		if (xLead <= x + 1) { obstacle.yBlock = true; }
	}
	
	if (actor.velocity.y >= 0) { 
		yLead = actor.pos.y + actor.size.y; 
		if (yLead >= y) { obstacle.xBlock = true; } 
	} else { 
		yLead = actor.pos.y; 
		if (yLead <= y + 1) { obstacle.xBlock = true; }
	}
	
	// Daaanger Zone! 
	if (!obstacle.xBlock && !obstacle.yBlock) {
		dZone(obstacle, actor.velocity, deltaX, yLead, y);
	
	}

}

// Calculate the y coordinate of actor's leading corner when
// x coordinate of actor's leading corner meets the obstacle.
function dZone(obstacle, velocity, deltaX, yZero, yObst) {
	var yPrime = yZero + (velocity.y / velocity.x) * deltaX +
							 G / (2 * Math.pow(velocity.y, 2)) * deltaX * deltaX;
	if(velocity.y >= 0 && yPrime >= yObst) { obstacle.xBlock = true; }
		else if (velocity.y >= 0 && yPrime < yObst) { obstacle.yBlock = true; }
	if(velocity.y < 0 && yPrime <= yObst + 1) { obstacle.xBlock = true; }
		else if (velocity.y < 0 && yPrime > yObst + 1) { obstacle.yBlock = true; }
}



// Identify actors that cause interaction prior to impact.
Level.prototype.aObstacleAt = function (actor) {
	// initialize aObstacle
	var aObstacle = {
		obj: null,
		xBlock: null,
		yBlock: null
	};

	xStart = Math.floor(actor.newPos.x);
	yStart = Math.floor(actor.newPos.y);
	xEnd = Math.ceil(actor.newPos.x + actor.size.x);
	yEnd = Math.ceil(actor.newPos.y + actor.size.y);
	// Check for active obstacles.
	for (var i = 0, j = this.activeGrid.length; i < j; i++) {
		aObstacle.obj = this.activeGrid[i];
		var obstacle = aObstacle.obj;
		if (obstacle != actor && !obstacle.crushable &&
				xEnd > obstacle.pos.x &&
				xStart < obstacle.pos.x + obstacle.size.x &&
				yEnd > obstacle.pos.y &&
				yStart < obstacle.pos.y + obstacle.size.y) {

			yTest(obstacle.pos.x, obstacle.pos.y, aObstacle, actor);
			return aObstacle;
		} 
	}
};

// Identify obstacles that cause an interaction after impact (i.e. crushables).
Level.prototype.crushableAt = function (actor) {

	var cObstacle = {
		obj: null,
		xBlock: null,
		yBlock: null
	};

	xStart = actor.pos.x;
	yStart = actor.pos.y;
	xEnd = actor.pos.x + actor.size.x;
	yEnd = actor.pos.y + actor.size.y;

	for (var i = 0, j = this.activeGrid.length; i < j; i++) {
		cObstacle.obj = this.activeGrid[i];
		var obstacle = cObstacle.obj;
		if (obstacle != actor && obstacle.crushable &&
				xEnd > obstacle.pos.x &&
				xStart < obstacle.pos.x + obstacle.size.x &&
				yEnd > obstacle.pos.y &&
				yStart < obstacle.pos.y + obstacle.size.y) {

			yTest(obstacle.pos.x, obstacle.pos.y, cObstacle, actor);
			return cObstacle;
		}
	}
};

Level.prototype.animate = function(step, controller) {
	if (this.status != null)
		this.finishDelay -= step;

	while (step > 0) {
		var thisStep = Math.min(step, maxStep);
		this.activeGrid.forEach(function(actor) {
			actor.act(thisStep, this, controller)
		}, this);
		step -= thisStep
	}
};

Level.prototype.interactWith = function(obj1, obj2) {
	// Test xBlock values
	// console.log("xBlock - " + obj2.xBlock + ", " + "yBlock - " + obj2.yBlock);
	// end test
	if (obj2.xBlock) obj2.obj.interact.x(obj1);
	if (obj2.yBlock) obj2.obj.interact.y(obj1);
};

Level.prototype.isFinished = function() {
  return this.status != null && this.finishDelay < 0;
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
// make sure that the sign is correct on Y-axis
function impulse(launchAngle, launchForce, timeApplied, projMass) {
	var xVelocity = launchForce * Math.cos(launchAngle) * 							
										timeApplied / projMass;         									
	var yVelocity = (-1 * launchForce * Math.sin(launchAngle) + G) *  		
										timeApplied / projMass;  
	var velocity = new Vector(xVelocity, yVelocity);
	return velocity;
}

// Position under constant acceleration. Thanks, Isaac.
// t0 = time when projectile is fired.
function move(deltaT) {
	var newX = this.pos.x + this.velocity.x * deltaT;
	var newY = this.pos.y + this.velocity.y * deltaT + 
						 1/2 * G * deltaT * deltaT;
	var newPos = new Vector(newX, newY);
	var newYVelocity = this.velocity.y + G * deltaT;
	return { "newPos": newPos, "newYVelocity": newYVelocity };
};


/****************/
/* Run the Game */
/****************/

function launchControl (level) {
	var controlObj = Object.create(null);
	var launchAngle = document.getElementById("launch-angle");
	var fireButton = document.getElementById("fire-button");
	var launcher = level.activeGrid[0];
	
	launchAngle.addEventListener("input", function() {
		launcher.launchAngle = launchAngle.value;
		}, false);
	fireButton.addEventListener("click", function() {
		launcher.fire(level);
		}, false);
}

// Move Actors

function runGame(plans, Display) {
	function startLevel(n) {
		runLevel(new Level(plans[n]), Display, function(status) {
			if (status == "lost")
				startLevel(n);
			else if (n < plans.length - 1)
        startLevel(n + 1);
      else
        console.log("You win!");
		});
	}
	document.addEventListener("DOMContentLoaded", function() {
		startLevel(0);
	}, false);
}

function runLevel(level, Display, andThen) {
	// Store game div
	var targetNode = document.getElementById("game-div");
	// Initialize display
	var display = new Display(targetNode, level);
	launchControl(level);
	var controller = Object.create(null);
	runAnimation(function(step) {
		// var controller = launchControl(inputAngle);
		level.animate(step, controller);
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

// Test Form Handler
// document.addEventListener("DOMContentLoaded", afterDOM, false);

// function afterDOM() {
// 	var testForm = document.getElementById("test-form");
// 	var testSubmit = document.getElementById("test-submit");
// 	var testInput = document.getElementById("test-input");
// 	window.inputAngle = document.getElementById("launch-angle");
	
// 	function publishInput() {
// 		console.log(testInput.value);
// 		event.preventDefault();
// 	}

// testForm.addEventListener('submit', publishInput, false);
// }

/*
// Temporary animation tester
var level = new Level(currentLevel);
var display = null;
var startTime = null;
var maxStep = 0.05;
var hotRound = null;
var tracker = [];
function testAnimation(timestamp) {
	if (!startTime) startTime = timestamp;
	// convert to seconds
	var deltaT = Math.min(timestamp - startTime, 100) / 1000;
	
	level.animate(deltaT);
	display.drawFrame();
	if (hotRound) {
		tracker.push(level.activeGrid[2].pos);
	}
	console.log("x - " + tracker[tracker.length - 1].x + 
		", y - " + tracker[tracker.length - 1].y);
	startTime = timestamp;
	requestAnimationFrame(testAnimation);
}
var startTest = function(func) {
	requestAnimationFrame(func);
	level.activeGrid[0].fire();
	hotRound = true;
};

document.addEventListener("DOMContentLoaded", function() {
	display = new DOMDisplay(document.body, level);
});
// End temporary animation tester
*/

// // OB Handler 1
// var boundaryLength = level.staticGrid[0].length;
// function OBH1(obj) {
// 	if (obj.newPos.x > boundaryLength ||
// 		obj.newPos.y < 0) {
// 		console.log("You're out of bounds.");
// 		return null;
// 	}
// }
// // End OB Handler 1

// // Step by step animation tester
// var fRate = 1 / 60 // seconds per frame

// function singleFrame() {
// 	level.activeGrid[0].fire();
// 	level.animate(fRate);
// 	display.drawFrame();
// 	tracker.push(level.activeGrid[2].pos);
// 	console.log(tracker[tracker.length - 1].x);
// 	console.log(tracker[tracker.length - 1].y);
// }
// // End step by step tester.


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