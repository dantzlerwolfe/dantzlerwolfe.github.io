
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
],
[
	"                                           ",
	"                                           ",
	"                                           ",
	"                                           ",
	"                                           ",
	"                                           ",
	"                                           ",
	"                                           ",
	"                  xxx                      ",
	"                    xx                     ",
	"        x            x                     ",
	"        x            x                     ",
	"  x     x                     L         x  ",
	"  x     x                     xxx       x  ",
	"  x     x    xx                         x  ",
	"  x     xxT                             x  ",
	"  x     xxx                             x  ",
	"  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  ",
	"                                           ",
	{
		name: "Mars", 
		G: 3.71,
		messages: [
			"What is greater than God,\n\
			more evil than the devil,\n\
			the poor have it,\n\
			the rich need it,\n\
			and if you eat it, you'll die?",
		],
		soundTrack: assignSound('assets/alien-alarm.wav', 1),
	}
],
[
	"                                           ",
	"                                           ",
	"                                           ",
	"         xx                                ",
	"         x                                 ",
	"         x                                 ",
	"         x                                 ",
	"         x                       xx        ",
	"                     L                     ",
	"                    xx                     ",
	"                    x                      ",
	"                    x                      ",
	"  x                      x                 ",
	"  x                      x                 ",
	"  x                x T   x              x  ",
	"  x                xxx   x              x  ",
	"  x                x     x              x  ",
	"  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  ",
	"                                           ",
	{
		name: "Jupiter", 
		G: 24.8,
		messages: [
			"Three Callistoan students were brought before the ancient\
			king. One of them had slaughtered the king's great sandworm.\
			The first said \"I'm innocent.\" The second said, \"I'm\
			innocent.\" The third said, \"The second student slaughtered your\
			sandworm, Your Majesty.\" If only one of the students was telling\
			the truth, which student slaughtered the sandworm of the ancient king?"
			,
		],
		soundTrack: assignSound('assets/scifi-menace.wav', 1),
	}
]
];

var progress = 1,
		currentLevel = levelPlans[progress - 1],
		levelData = window["currentLevel"].pop(),
		G = levelData["G"];

// Clear levelPlan variables in the local scope. 
// Could definitely use some refactoring . . .
function advanceLevel() {
	progress++;
	currentLevel = levelPlans[progress - 1],
	levelData = window["currentLevel"].pop(),
	G = levelData["G"];
}

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
		var origin = this.pos.plus(new Vector(this.size.x / 2.5, this.size.y / 5));
		var newRound = new Projectile(origin);
		// var newRound = new Projectile(this.pos.plus(new Vector(.4, .2)));
		// console.log(this);
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
			controlObj.messageBoard.className = "hidden";
		}, 1000);
			// This is where we'd ask user to buy ammo ;)
	}
};	

Launcher.prototype.type = "launcher";
Launcher.prototype.act = function(deltaT, level, controlObj) {
	if(this.power > 0 && this.hit) {
		level.effects.damageEffect.play();
		controlObj.launcherHealth.textContent = this.power;
		controlObj.messageText.textContent = "You've hit us, Sir!"
		controlObj.messageBoard.className = "messenger";
		controlObj.launchPicDiv.className = "launch-pic-div hit-normal";
		level.timeouts.explosionL = window.setTimeout(function() {
			controlObj.launchPicDiv.className = "launch-pic-div";
		}, 1000);	
		this.hit = false; 
		level.timeouts.impact1 = window.setTimeout(function() {
			controlObj.messageBoard.className = "hidden";
		}, 1000);	
	}

	if(this.power <= 0 && this.hit) {
		level.effects.destroyEffect.play();
		controlObj.launcherHealth.textContent = this.power;
		// window.clearTimeout(level.timeouts.impact1);
		controlObj.launchPicDiv.className = "launch-pic-div hit-final";
		controlObj.launchPicDiv.innerHTML = "";
		level.activeGrid.splice(0, 1);
		level.timeouts.explosionL = window.setTimeout(function() {
			controlObj.launchPicDiv.className = "launch-pic-div";
		}, 3200);	
		// level.status = "pauseLoss";
		level.status = "loss";
		controlObj.messageText.innerText = "You've destroyed us, Sir!";
		controlObj.messageBoard.className = "messenger";
		level.finishDelay = 1;
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

Projectile.prototype.act = function(deltaT, level, controlObj) {
	var newStats = this.move(deltaT);
	var newYVelocity = newStats["newYVelocity"];
	var testPos = newStats["newPos"];
	var testLength = level.staticGrid[0].length;
	var testHeight = level.staticGrid.length;
	var initialPower = this.power;

	// Destroy projectiles that are out of power
	// Game lost if last projectile disappears before target is dead
	if (this.power <= 0) {
		remove(level.activeGrid, this);
		level.effects.poofEffect.play();
		if (!findType(level.activeGrid, "projectile") && 
			findType(level.activeGrid, "target") && 
			level.activeGrid[0].ammo == 0) {
			controlObj.messageText.textContent = "We\'re out of ammo!" + 
				"  There\'s no hope for us now!"	
			controlObj.messageBoard.className = "messenger";
			level.finishDelay = 2;
			level.status = "loss";
		}
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

	if (obstacle && !this.ghost) {
		
		level.interactWith(this, obstacle);
		this.bounceEffect.play();
		this.size = this.size.scale(Math.max(this.power / initialPower, 0));
		this.bounceEffect.volume *= Math.max(this.power / initialPower, 0);
	}
	else {
		this.pos = this.newPos;
		this.velocity.y = newYVelocity;
	}
};

Projectile.prototype.interact = {
	x: function(obj1) {
			if(!obj1.ghost) {
				obj1.velocity.x *= -1;
				obj1.power -= 1;
			}
		},
	y: function(obj1) {
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
		controlObj.targetHealth.textContent = this.power;
		controlObj.targetPicDiv.className = "target-pic-div hit-normal";
		level.timeouts.explosion = window.setTimeout(function() {
			controlObj.targetPicDiv.className = "target-pic-div";
		}, 1000);	
		controlObj.messageText.textContent = "Direct hit!"
		controlObj.messageBoard.className = "messenger";
		this.hit = false; 
		level.timeouts.impact1 = window.setTimeout(function() {
			controlObj.messageBoard.className = "hidden";
		}, 1000);	
	}

	if(this.power <= 0 && this.hit) {
		level.effects.destroyEffect.play();
		controlObj.targetHealth.textContent = this.power;
		window.clearTimeout(level.timeouts.impact1);
		controlObj.targetPicDiv.className = "target-pic-div hit-final";
		level.timeouts.explosion = window.setTimeout(function() {
			controlObj.targetPicDiv.className = "target-pic-div";
		}, 3200);	
		level.status = "win"
		level.activeGrid.splice(1, 1);
		// Set finishDelay to a positive number if needed.
		level.finishDelay = 3;
		this.hit = false;
	}
};

Target.prototype.interact = {
	x: function (obj1, obj2) {
		obj1.velocity.x *= -0.5;
		obj2.power -= 1;
		obj1.power -= 1;
		obj2.hit = true;
	},
	y: function (obj1, obj2) {
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
	this.timeouts = {};
	// Define sound library for Level.
	this.effects = {
		damageEffect: assignSound('assets/small-explosion.wav', 1),
		destroyEffect: assignSound('assets/big-explosion.wav', 1),
		launchEffect: assignSound('assets/simple-launch.wav', 1),
		poofEffect: assignSound('assets/poof.wav', 1),
		tauntEffect: assignSound('assets/feeble-efforts.wav', 1)
	};
	// Initialize messages for Level.
	this.congrats = function () {
		var congrats = [
			"You\'ve done it, Commander!",
			"Write down your answer to the following riddle and save it for later."
		];
		levelData.messages.forEach(function (element) {
			congrats.push(element);
		});
		return congrats;
	}();
	this.trashTalk = [
		"Perhaps your calculations were a tad off, Commander.",
		"Might I suggest using the targeting computer next time?",
		"I shall be happy to serve as a character witness\n\
		at your court martial, Commander.",
		"The Galaxy's secrets have escaped us once again!",
		"Noooooooooooooooooooooo!"
	];
	this.wisdom = [
		"The equivalence of energy and matter is just the beginning . . .",
		"Han shot first.",
		"Deckard may or may not be a replicant. But ambiguity is definitely a\
		growth hack.",
		"Don't treat people like\
		<a href=\"http://www.ebaumsworld.com/video/watch/84152924/\">\
		THIS</a>",
		"We didn't understand Primer the first time we saw it either."
	]
	this.slamCount = 0;
	this.finalTheme = assignSound('assets/bassline-groove.wav', 1);
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
			if(messageBoard) messageBoard.className = "hidden";
			level.status = null;
			levelData.soundTrack.play();
			runAnimation(frameFunc);
	} else if (level.status == "win") {
			level.finalSequence();
	} else if (level.status == "loss") {
			level.finalSequence();
	}
};

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

// Find an array element
function findType (array, type) {
	var i;
	for (i = 0; i < array.length; i++) {
		if(array[i].type == type) {
			return true;
		}
	}
	return false;
}

// Remove array element
function remove (array, element) {
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

// Clone a node
function cloner(ID) {
	var el = document.getElementById(ID),
    elClone = el.cloneNode(true);
	el.parentNode.replaceChild(elClone, el);
}


/****************/
/* Basic Motion */
/****************/

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
	var launcherHealth = document.getElementById("launcher-health")
	var messageBoard = document.getElementById("message-board");
	var messages = levelData.messages;
	var pauseButton = document.getElementById("pause-button");
	var targetDiv = document.getElementsByClassName("target");
	var targetHealth = document.getElementById("target-health");
	
	launchControls.className = "controls";

	// Insert Launcher graphics
	var launchStyles = {
		top: launchDiv[0].style.top, 
		left: launchDiv[0].style.left,
		width: launchDiv[0].style.width,
		height: launchDiv[0].style.height,
	};

	var launchPicDiv = activeDiv[0].parentNode.appendChild(elMaker("div", "launch-pic-div"));
	launchPicDiv.style.top = String(parseInt(launchStyles.top) + 
		parseInt(launchStyles.height) / 2 - 37.5) + "px";
	launchPicDiv.style.left = String(parseInt(launchStyles.left) + 
		parseInt(launchStyles.width) / 2 - 37.5) + "px";
	launchPicDiv.style.transform = "rotate(" + (-1) * initialAngle 
		+ "deg)";

	var launchPic = launchPicDiv.appendChild(elMaker("object", "launch-pic"));
	launchPic.type = "image/svg+xml";
	launchPic.data = "assets/launcher.svg";

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
	controlObj.launchAngle = launchAngle;
	controlObj.launchPower = launchPower;
	controlObj.launcherHealth = launcherHealth;
	controlObj.targetHealth = targetHealth;

	return controlObj;
}

// Final form submission
function winScreen(controller, level) {
	controller.messageBoard.className = "hidden";
	var answerForm = document.getElementById("answers");
	var riddle1 = document.getElementById("riddle1");
	var riddle2 = document.getElementById("riddle2");
	var riddle3 = document.getElementById("riddle3");
	var riddleSub = document.getElementById("riddle-submit");
	var tryAgain = document.getElementById("try-again");
	answerForm.className = "form-horizontal container";
	riddle1.addEventListener("input", function() {
		if(!/\btime\b/i.test(riddle1.value)) {
			riddle1.className = "form-control wrong-answer"; 
		} else { riddle1.className = "form-control" }		
	});
	riddle2.addEventListener("input", function() {
		if(!/\bnothing\b/i.test(riddle2.value)) {
			riddle2.className = "form-control wrong-answer"; 
		} else { riddle2.className = "form-control" }
	});
	riddle3.addEventListener("input", function() {
		if(!/\b(first|1st|1)\b/i.test(riddle3.value)) {
			riddle3.className = "form-control wrong-answer"; 
		} else { riddle3.className = "form-control" }
	});
	riddleSub.addEventListener("click", function() {
		if(/\btime\b/i.test(riddle1.value) && 
			/\bnothing\b/i.test(riddle2.value) &&
			/\b(first|1st|1)\b/i.test(riddle3.value)) {
			answerForm.className = "hidden";
			level.finalTheme.play();
			level.finalTheme.loop = true;
			var randomIndex = Math.floor(Math.random() * level.wisdom.length);
			var epicWisdom = level.wisdom[randomIndex];
			controller.messageBoard.innerHTML = "<p>The Ancients have spoken:</p><br />" + 
				"<span class = \"callout\">" + epicWisdom + "</span><br />" + 
				"<br /><p><a href=\"http://dantzlerwolfe.github.io\">" + 
				"Play again</a> for even more wisdom.</p>";
			controller.messageBoard.className = "messenger";
		} else { tryAgain.className = "row" }
	});
}

// Run the game
function runGame(plans, Display) {
	function startLevel(n) {
		runLevel(new Level(plans[n]), Display, function(level, controller, display) {
			level.finalSequence = function() {
				function resetController(controller) {
					controller.ammoCount.innerText = "5";
					controller.launchPower.value = "";
					controller.launchAngle.value = "";
					controller.launcherHealth.innerText = "3";
					controller.targetHealth.innerText = "2";
					cloner("control-div");
				}
				if (level.status == "win" && level.congrats.length) {
					var lastMessage = level.congrats.shift();
					controller.messageText.innerText = lastMessage;
					controller.messageBoard.className = "messenger";
				} else if (level.status == "win" && n < plans.length - 1) {
						// clear the grid and get rid of the event listeners
						display.clear();
						resetController(controller);
						advanceLevel();
						startLevel(n + 1);
				} else if (level.status == "win") {
					display.clear();
					resetController(controller); 
					// insert game winning sequence here
					winScreen(controller, level);
					// controller.messageText.innerText = "You win!";
					// console.log ("You win!");
				}

				if (level.status == "loss" && level.slamCount == 0) {
					var randomIndex = Math.floor(Math.random() * level.trashTalk.length);
					var epicSlam = level.trashTalk[randomIndex];
					controller.messageText.innerText = epicSlam;
					controller.messageBoard.className = "messenger";
					level.slamCount += 1;
				} else if (level.status == "loss") {
					// add player lives to the game and test for remaining life here
					if (Math.round(Math.random())) level.effects.tauntEffect.play();
					level.slamCount = 0;
					display.clear();
					resetController(controller);
					startLevel(n);
				}
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
			soundTrack.pause();
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
