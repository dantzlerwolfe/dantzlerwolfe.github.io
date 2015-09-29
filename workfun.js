
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
				"P": Projectile
		},
		staticTokens = {
				"T": "Target",
				"x": "HardWall",
				"s": "SoftWall" 
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

// If the Projectile method is called from the Launcher, won't "this"
// refer to the Launcher? If so, need some sort of binding.
function Projectile(pos) {
	this.mass = 9.81; // in kilograms																
	this.pos = pos
	this.t0 = new Date().getTime();
	this.velocity = new Vector(0,0);
}

// Position under constant acceleration. Thanks, Isaac.
// t0 = time when projectile is fired.
Projectile.prototype.move = function (deltaT) {
	var newX = this.initialPos.x + this.velocity.x * deltaT;
	var newY = this.initialPos.y - this.velocity.y * deltaT + 
						 1/2 * G * deltaT * deltaT;
	this.pos = new Vector(newX, newY);
};

Projectile.prototype.type = "projectile";

Projectile.prototype.act = function(deltaT, level) {
	var
}

function Target (pos, size) {
	this.pos = pos;
	this.size = size;
}
Target.prototype.type = "target";

/*
function HardWall() {}
function SoftWall() {}
*/

/**************/
/* Draw Level */
/**************/

/* DOM Manipulation adapted from
	 Haverbeke, Eloquent Javascript. */

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
			var tokenA = activeTokens[ch], tokenS = staticTokens[ch];
			if (tokenA) {

// This looks broken. For instance if tokenA is the Launcher, 
// the input parameters are incorrect.

				this.activeGrid.push(new tokenA(new Vector(x,y), ch));
				staticSlice.push(null);
			}
			else if (tokenS) staticSlice.push(tokenS);
			else staticSlice.push(null);
		}
		this.staticGrid.push(staticSlice);
	}
	this.status = this.finishDelay = null;
}

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
function impulse (launchAngle, launchForce, timeApplied, projMass) {
	var xVelocity = launchForce * Math.cos(launchAngle) * 							
										timeApplied / projMass;         									
	var yVelocity = (launchForce * Math.sin(launchAngle) - G) *  		
										timeApplied / projMass;  
	var velocity = new Vector(xVelocity, yVelocity);
	return velocity;
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















