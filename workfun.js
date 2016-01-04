
/**************/
/* Blueprints */
/**************/

var levelPlans = [
[
	"                                           ",
	"                                           ",
	"                                           ",
	"                                           ",
	"                                           ",
	"                                           ",
	"                                           ",
	"                                           ",
	"                  xx                       ",
	"                                           ",
	"                                           ",
	"                                           ",
	"  x                                     x  ",
	"  x                               xx    x  ",
	"  x          xx                         x  ",
	"  x  L                                  x  ",
	"  x     xx                   T          x  ",
	"  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  ",
	"                                           ",
	{
		name: "Earth", 
		G: 9.81,
		messages: [
			"This thing all things devours:\n\
			Birds, beasts, trees, flowers;\n\
			Gnaws iron, bites steel;\n\
			Grinds hard stones to meal;\n\
			Slays king, ruins town,\n\
			And beats high mountain down.",
		],
		soundTrack: assignSound('assets/forest-night.wav', 1),
	}
]
];

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
	x: function(obj1) {
			obj1.velocity.x *= -1;
			obj1.power -= 1;
		},
	y: function(obj1) { 
			obj1.velocity.y *= -1;
			obj1.power -= 1;
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
	this.power = 3;
	this.hit = false;
}

// Takes the activeGrid as its parameter
Launcher.prototype.fire = function(level, controlObj) {
	if (level.status == "paused") return null;
	if (this.ammo > 0) {
		console.log(controlObj);
		var origin = this.pos.plus(new Vector(this.size.x / 2.5, this.size.y / 5));
		var newRound = new Projectile(origin);
		// var newRound = new Projectile(this.pos.plus(new Vector(.4, .2)));
		console.log(this);
		var velocity = impulse(this.launchAngle, this.initialForce, 
				this.timeApplied, newRound.mass);
		// velocity.x = Number(velocity.x.toFixed(4));
		newRound.velocity = velocity;
		newRound.ghostChange(newRound);
		level.effects.launchEffect.play();
		level.activeGrid.push(newRound);
		this.ammo--;
		controlObj.ammoCount.textContent = this.ammo;
	} else {
			controlObj.messageText.textContent = "We're out of ammo, sir."
			controlObj.messageBoard.className = "messenger";
			level.timeouts.impact1 = window.setTimeout(function() {
			controlObj.messageBoard.className = "messenger-hidden";
		}, 1000);
			// This is where we'd ask user to buy ammo ;)
	}
};	

Launcher.prototype.type = "launcher";
Launcher.prototype.act = function(deltaT, level, controlObj) {
	if(this.power > 0 && this.hit) {
		level.effects.damageEffect.play();
		controlObj.messageText.textContent = "You've hit us, Sir!"
		controlObj.messageBoard.className = "messenger";
		controlObj.launchPicDiv.className = "launch-pic-div hit-normal";
		level.timeouts.explosionL = window.setTimeout(function() {
			controlObj.launchPicDiv.className = "launch-pic-div";
		}, 1000);	
		this.hit = false; 
		level.timeouts.impact1 = window.setTimeout(function() {
			controlObj.messageBoard.className = "messenger-hidden";
		}, 1000);	
	}

	if(this.power <= 0 && this.hit) {
		level.effects.destroyEffect.play();
		// window.clearTimeout(level.timeouts.impact1);
		controlObj.launchPicDiv.className = "launch-pic-div hit-final";
		controlObj.launchPicDiv.innerHTML = "";
		level.activeGrid.splice(0, 1);
		level.timeouts.explosionL = window.setTimeout(function() {
			controlObj.launchPicDiv.className = "launch-pic-div";
		}, 3200);	
		// level.status = "pauseLoss";
		level.status = "loss";
		this.hit = false;
	}
};

Launcher.prototype.interact = {
	x: function(obj1, obj2) {
			if(!obj1.ghost) 
			obj1.velocity.x *= -1;
			obj1.power -= 1;
			obj2.power -= 1;
			obj2.hit = true;
		},
	y: function(obj1, obj2) {
			if(!obj1.ghost) 
			obj1.velocity.y *= -1;
			obj1.power -= 1;
			obj2.power -=1;
			obj2.hit = true;
		},
};

function Projectile(pos) {
	this.mass = 9.81; // in kilograms	
	this.pos = pos
	this.power = 3
	this.size = new Vector(0.5,0.5);
	this.t0 = new Date().getTime();
	this.velocity = new Vector(0,0);
	this.ghost = true;
	this.bounceEffect = assignSound('assets/bounce.wav', 1);
}

Projectile.prototype.type = "projectile";

Projectile.prototype.move = move;

Projectile.prototype.ghostChange = function(obj) {
		window.setTimeout(function() {
			obj.ghost = false;
		}, 200);
};

Projectile.prototype.act = function(deltaT, level) {
	var newStats = this.move(deltaT);
	var newYVelocity = newStats["newYVelocity"];
	var testPos = newStats["newPos"];
	var testLength = level.staticGrid[0].length;
	var testHeight = level.staticGrid.length;
	var initialPower = this.power;

	// Destroy projectiles that are out of power
	if (this.power <=0 ) {
		Remove(level.activeGrid, this);
		level.effects.poofEffect.play();
	}

	// Wrap around behavior
	if(0 <= testPos.x && testPos.x <= testLength && 
		testPos.y <= testHeight) { this.newPos = testPos; }

	if(this.velocity.x < 0 && testPos.x < 0) { this.newPos.x = testLength; }
	if(this.velocity.x > 0 && testPos.x > testLength) { this.newPos.x = 0; }
	if(this.velocity.y > 0 && testPos.y > testHeight - 1) { this.newPos.y = 0; }

	// Test for obstacles
	if(this.newPos.y > 0) {
	var obstacle = level.sObstacleAt(this) || level.aObstacleAt(this);
	}
	// console.log(this.ghost);
	// console.log("before " + this.power);
	// console.log(this.size);
	if (obstacle && !this.ghost) {
		
		level.interactWith(this, obstacle);
		this.bounceEffect.play();
		this.size = this.size.scale(Math.max(this.power / initialPower, 0));
		this.bounceEffect.volume *= Math.max(this.power / initialPower, 0);
		// console.log("after " + this.power);
		// console.log(this.size);
		// console.log(level.activeGrid.indexOf(this) + " O - " + 
		// 	this.velocity.x + ", " + this.velocity.y);
		// console.log(level.activeGrid.indexOf(this) + " O - " + 
		// 	this.pos.x + ", " + this.pos.y);
	}
	else {
		this.pos = this.newPos;
		this.velocity.y = newYVelocity;
		// console.log(level.activeGrid.indexOf(this) + " N - " + 
		// 	this.velocity.x + ", " + this.velocity.y);
		// console.log(level.activeGrid.indexOf(this) + " N - " + 
		// 	this.pos.x + ", " + this.pos.y);
		// var crushable = level.crushableAt(this);
		// if (crushable) 
		// 	level.interactWith(this, crushable);
	}
};

Projectile.prototype.interact = {
	x: function(obj1) {
		  console.log("xBlock")
			if(!obj1.ghost) {
				obj1.velocity.x *= -1;
				obj1.power -= 1;
			}
		},
	y: function(obj1) {
			console.log("yBlock")
			if(!obj1.ghost) { 
				obj1.velocity.y *= -1;
				obj1.power -= 1;
			}
		},
};

function Target (pos) {
	this.pos = pos;
	this.power = 2;
	this.size = new Vector(1, 1);
	this.hit = false;
}

Target.prototype.type = "target";

Target.prototype.act = function(deltaT, level, controlObj) {
	if(this.power > 0 && this.hit) {
		level.effects.damageEffect.play();
		controlObj.targetPicDiv.className = "target-pic-div hit-normal";
		level.timeouts.explosion = window.setTimeout(function() {
			controlObj.targetPicDiv.className = "target-pic-div";
		}, 1000);	
		controlObj.messageText.textContent = "Direct hit!"
		controlObj.messageBoard.className = "messenger";
		this.hit = false; 
		level.timeouts.impact1 = window.setTimeout(function() {
			controlObj.messageBoard.className = "messenger-hidden";
		}, 1000);	
	}

	if(this.power <= 0 && this.hit) {
		level.effects.destroyEffect.play();
		window.clearTimeout(level.timeouts.impact1);
		controlObj.targetPicDiv.className = "target-pic-div hit-final";
		level.timeouts.explosion = window.setTimeout(function() {
			controlObj.targetPicDiv.className = "target-pic-div";
		}, 3200);	
		level.status = "win"
		level.activeGrid.splice(1, 1);
		console.log(level.activeGrid);
		// Set finishDelay to a positive number if needed.
		level.finishDelay = 3;
		this.hit = false;
	}
};

Target.prototype.interact = {
	x: function (obj1, obj2) {
		console.log("x");
		console.log(obj2);
		obj1.velocity.x *= -0.5;
		obj2.power -= 1;
		obj1.power -= 1;
		obj2.hit = true;
	},
	y: function (obj1, obj2) {
		console.log("y " + obj2);
		obj1.velocity.y *= -0.5;
		obj2.power -= 1;
		obj1.power -= 1;
		obj2.hit = true;
	}
};

/*
function HardWall() {}
function SoftWall() {}
*/

/*************************************/
/* Initialize and Monitor Game State */
/*************************************/

var scale = 30;
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
	this.finishDelay = null;
	this.status = "new";

}

// Define sound library for Level.
Level.prototype.effects = {
	damageEffect: assignSound('assets/small-explosion.wav', 1),
	destroyEffect: assignSound('assets/big-explosion.wav', 1),
	launchEffect: assignSound('assets/simple-launch.wav', 1),
	poofEffect: assignSound('assets/poof.wav', 1)
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
	// xStart = actor.newPos.x;
	// yStart = actor.newPos.y;
	// xEnd = actor.newPos.x + actor.size.x;
	// yEnd = actor.newPos.y + actor.size.y;

	// Check for active obstacles.
	for (var i = 0, j = this.activeGrid.length; i < j; i++) {
		aObstacle.obj = this.activeGrid[i];
		var obstacle = aObstacle.obj;
		var testPos;
		if(obstacle.newPos) {
			testPos = obstacle.newPos;
		} else testPos = obstacle.pos;
		// removed && !obstacle.crushable from condition list below
		if (obstacle != actor &&
				xEnd > testPos.x &&
				xStart < testPos.x + obstacle.size.x &&
				yEnd > testPos.y &&
				yStart < testPos.y + obstacle.size.y) {

			yTest(testPos.x, testPos.y, aObstacle, actor);
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

	if (obj2.xBlock) obj2.obj.interact.x(obj1, obj2.obj);
	if (obj2.yBlock) obj2.obj.interact.y(obj1, obj2.obj);
};

Level.prototype.pauseToggler = function (level, frameFunc, messageBoard) {
	if (level.status == null) {
		level.status = "paused";
		levelData.soundTrack.pause();
	} else if (level.status == "paused") {
			if(messageBoard) messageBoard.className = "messenger-hidden";
			level.status = null;
			levelData.soundTrack.play();
			runAnimation(frameFunc);
	} else if (level.status == "win") {
			level.finalSequence();
	} else if (level.status == "loss") {
			level.finalSequence();
	}
};

// 	if (level.status == "paused" &&
// 			level.activeGrid[1].power <= 0) {
// 		level.status = "pauseWin";
// 		messageBoard.className = "messenger-hidden";
// 		runAnimation(frameFunc);
// 	} else if (level.status == "paused") {
// 		if(messageBoard) messageBoard.className = "messenger-hidden";
// 		level.status = null;
// 		levelData.soundTrack.play();
// 		runAnimation(frameFunc);
// 	} else if (level.status == null) {
// 			level.status = "paused";
// 			levelData.soundTrack.pause();
// 	} else if (level.status == "pauseWin") {
// 			if (levelData.messages.length) level.status = "pauseWin";
// 				else level.status = "won";
// 			messageBoard.className = "messenger-hidden";
// 			level.finalSequence();
// 	} else if (level.status == "pauseLoss") {
// 			level.status = "lost";
// 			messageBoard.className = "messenger-hidden";
// 			level.finalSequence();
// 	}
// };

Level.prototype.timeouts = {};

Level.prototype.isFinished = function() {
	// console.log(this.status);
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
	if (this.activeLayer) { this.wrap.removeChild(this.activeLayer); }
	this.activeLayer = this.wrap.appendChild(this.drawActors());
	this.wrap.className = "game " + (this.level.status || "");
	// this.scrollPlayerIntoView();
};

DOMDisplay.prototype.clear = function() {
  this.wrap.parentNode.removeChild(this.wrap);
  window.location.reload(false);
};

/*************/
/* Utilities */
/*************/

// Sound utilities
function assignSound (url, vol) { 
		var track = new Audio(url);
		track.volume = vol;
		return track;
	}

// Remove an array element
function Remove (array, element) {
	array.splice(array.indexOf(element), 1);
}

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



/****************/
/* Basic Motion */
/****************/

// Calculate Launch Velocity Using Simple Impulse Equations
// launchAngle in radians, launchForce in newtons, timeApplied
// in seconds, projMass in kg
// make sure that the sign is correct on Y-axis
function impulse(launchAngle, launchForce, timeApplied, projMass) {
	console.log(launchForce);
	var xVelocity = launchForce * Math.cos(launchAngle) * 							
										timeApplied / projMass;         									
	var yVelocity = (-1 * launchForce * Math.sin(launchAngle) + G) *  		
										timeApplied / projMass;  
	var velocity = new Vector(xVelocity, yVelocity);
	return velocity;
}

// Position under constant acceleration. Thanks, Isaac.
function move(deltaT) {
	var newX = this.pos.x + this.velocity.x * deltaT;
	// newX = Number(newX.toFixed(4));
	var newY = this.pos.y + this.velocity.y * deltaT + 
						 1/2 * G * deltaT * deltaT;
	// newY = Number(newY.toFixed(4));
	var newPos = new Vector(newX, newY);
	var newYVelocity = this.velocity.y + G * deltaT;
	// newYVelocity = Number(newYVelocity.toFixed(4));
	return { "newPos": newPos, "newYVelocity": newYVelocity };
};

/****************/
/* Run the Game */
/****************/

// Initialize Interface and Graphics
function launchControl (level, frameFunc) {

	// Grab elements
	var launcher = level.activeGrid[0];
	var ammoCount = document.getElementById("ammo-count");
	var activeDiv = document.getElementsByClassName("active");
	var controlObj = Object.create(null);
	var fireButton = document.getElementById("fire-button");
	var initialAngle = launcher.launchAngle / (2 * Math.PI) * 360;
	var launchAngle = document.getElementById("launch-angle");
	var launchControls = document.getElementById("control-div");
	var launchDiv = document.getElementsByClassName("launcher");
	var launchPower = document.getElementById("launch-power");
	var messageBoard = document.getElementById("message-board");
	var messages = levelData.messages;
	var pauseButton = document.getElementById("pause-button");
	var targetDiv = document.getElementsByClassName("target");
	
	launchControls.className = "controls";
	console.log(ammoCount);
	console.log(messageBoard);

	// Insert Launcher graphics
	var launchStyles = {
		top: launchDiv[0].style.top, 
		left: launchDiv[0].style.left,
		width: launchDiv[0].style.width,
		height: launchDiv[0].style.height,
	};

	var launchPicDiv = 
		activeDiv[0].parentNode.appendChild(elMaker("div", "launch-pic-div"));
	launchPicDiv.style.top = String(parseInt(launchStyles.top) + 
		parseInt(launchStyles.height) / 2 - 37.5) + "px";
	launchPicDiv.style.left = String(parseInt(launchStyles.left) + 
		parseInt(launchStyles.width) / 2 - 37.5) + "px";
	launchPicDiv.style.transform = "rotate(" + (-1) * initialAngle 
		+ "deg)";

	var launchPic = launchPicDiv.appendChild(elMaker("object", "launch-pic"));
	launchPic.type = "image/svg+xml";
	launchPic.data = "assets/launcher.svg";
	console.log(launchPicDiv)
	console.log(launchPic.style);

	// Insert Target graphics
	var targetStyles = {
		top: targetDiv[0].style.top,
		left: targetDiv[0].style.left,
		width: targetDiv[0].style.width,
		height: targetDiv[0].style.height,
	}

	var targetPicDiv = 
		activeDiv[0].parentNode.appendChild(elMaker("div", "target-pic-div"));
	targetPicDiv.style.top = String(parseInt(targetStyles.top) -
		100 + parseInt(targetStyles.height)) + "px";
	console.log("top - " + parseInt(targetStyles.top) + 
		"\nheight - " + parseInt(targetStyles.height));
	targetPicDiv.style.left = String(parseInt(targetStyles.left) +
		parseInt(targetStyles.width) / 2 - 50) + "px";


	// Register event listeners
	launchAngle.addEventListener("input", function() {
		launcher.launchAngle = launchAngle.value / 
			360 * (2 * Math.PI);;
		launchPicDiv.style.transform = "rotate(" + (-1) * launchAngle.value + 
			"deg)";
		}, false);
	launchPower.addEventListener("input", function() {
		launcher.forceMultiple = launchPower.value;
		launcher.initialForce = launcher.forceMultiple * 9.81;
	}, false);
	fireButton.addEventListener("click", function() {
		console.log(launcher);
		launcher.fire(level, controlObj);
		}, false);
	pauseButton.addEventListener("click", function () {
		var messageNum = levelData.messages.length;
		level.pauseToggler(level, frameFunc);
	}, false);

	// Initialize message board
	if (level.status == "new") {
		level.status = "paused";
		messageBoard.innerHTML = "<p id=\"message-text\">Welcome to " + 
			levelData.name + ", Commander. " + "Destroy the Cosmic Dampener to \
			reveal the hidden clues left here " + "by the Ancients. Collect these \
			clues to unlock the Galaxy's most guarded secret.</p>" + 
			"<button type=\"button\" id=\"start-button\" class=\"btn btn-default" +
			" btn-lg\">Continue</button>";
	}

	// Grab new elements 
	var startButton = document.getElementById("start-button");
	var messageText = document.getElementById("message-text");

	// Register messageBoard event listeners
	startButton.addEventListener("click", function () {
		level.pauseToggler(level, frameFunc, messageBoard);
	}, false);

	// Add properties to control object for passing to other functions
	controlObj.launchControls = launchControls;
	controlObj.ammoCount = ammoCount; 
	controlObj.messageBoard = messageBoard;
	controlObj.messageText = messageText;
	controlObj.startButton = startButton;
	controlObj.messages = messages;
	controlObj.targetPicDiv = targetPicDiv;
	controlObj.launchPicDiv = launchPicDiv;

	return controlObj;
}

// Message Handlers
// function messageBoy(level, controller) {
// 	if (level.status == "pauseWin") {
// 		var lastMessage = levelData.messages.pop();
// 		controller.messageText.innerText = lastMessage;
// 		controller.messageBoard.className = "messenger-final";
// 	}

// 	if (level.status == "pauseLoss") {
// 		var randomIndex = Math.floor(Math.random() * trashTalk.length);
// 		var epicSlam = trashTalk[randomIndex];
// 		console.log(epicSlam);
// 		trashTalk.splice(randomIndex, 1);
// 		controller.messageText.innerText = epicSlam;
// 		controller.messageBoard.className = "messenger-final";
// 	}
// }

// Run the game
function runGame(plans, Display) {
	function startLevel(n) {
		runLevel(new Level(plans[n]), Display, function(level, controller, display) {
			level.finalSequence = function() {
				if (level.status == "win" && congrats.length) {
					var lastMessage = congrats.shift();
					controller.messageText.innerText = lastMessage;
					controller.messageBoard.className = "messenger";
				} else if (level.status == "win" && n < plans.length - 1) {
						display.clear();
						startLevel(n + 1);
				} else if (level.status == "win") {
					display.clear();
					// insert game winning sequence here
					console.log ("You win!");
				}

				if (level.status == "loss" && trashTalk.length == initialTrashLength) {
					var randomIndex = Math.floor(Math.random() * trashTalk.length);
					var epicSlam = trashTalk.splice(randomIndex, 1)[0];
					console.log(epicSlam);
					controller.messageText.innerText = "You've destroyed us, Sir!\n\n" + 
						epicSlam;
					controller.messageBoard.className = "messenger";
				} else if (level.status == "loss") {
					// add player lives to the game and test for remaining life here
					display.clear();
					startLevel(n);
				}
				// if(level.status == "pauseWin" || level.status == "pauseLoss") {
				// 	messageBoy(level, controller);
				// } else if (level.status == "lost") {
				// 	startLevel(n);
				// } else if (level.status == "won" && n < plans.length - 1) {
				// 	startLevel(n + 1); 
				// } else if (level.status == "won") {
				// 	// game winning sequence;
				// 	console.log("You win!");
				// }
			}
			level.finalSequence();
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
	// Initialize music
	var soundTrack = levelData.soundTrack;
	soundTrack.loop = true;
	soundTrack.play();
	// Initialize controller
	var controller = launchControl(level, frameFunc);
	function frameFunc (step) {
		// Don't animate if paused
		if (level.status == "paused") {
			return false;
		}
		// Initiate final sequence of the level
		if (level.isFinished()) {
			// display.clear();
			controller.launchControls.className = "controls-hidden";
			if (andThen)
				andThen(level, controller, display);
			return false;
		}
		// Draw the next frame
		level.animate(step, controller);
		display.drawFrame(step);

	}
	runAnimation(frameFunc);
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

var congrats = [
	"You\'ve done it, Commander!",
	"Write down your answer to the following riddle and save it for later."
]

levelData.messages.forEach(function (element) {
	congrats.push(element);
});

var trashTalk = [
	"Perhaps your calculations were a tad off, Commander.",
	"Might I suggest using the targeting computer next time?",
	"I shall be happy to serve as a character witness\n\
	at your court martial, Commander.",
	"The Galaxy's secrets have escaped us once again!",
	"Noooooooooooooooooooooo!"
]

var initialTrashLength = trashTalk.length;

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