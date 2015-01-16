// ===================================== HERO ======================================
Maze.Obj.Hero = function(maze) {
	Maze.Obj.extend(this);
	this.ancestors.hero = true;
	this.className = 'Hero';
	this.mapPart = false;
	
	this.blocking = true;
	this.drawPhase = 1;
	
	Maze.Obj.Uniq.extend(this, maze);
	Maze.Obj.Selectable.extend(this);
	Maze.Obj.Walker.extend(this);
	Maze.Obj.Animated.extend(this);

	
	this.headColor = '#220202';
	this.bootColor = '#cccc99';	
	this.init();
	
	/*var c = 'rgba(140, 30, 30, 0.9)';
	var c = 'rgba(94, 24, 54, 0.9)';
	this.addRectangle(10, 11, 20, 19, c); // robe
	this.addRectangle(19, 20, 22, 21, c); // robe*/
	
	this.audio = {};
	//this.audio.footstep = new Audio("audio/footstep2.mp3"); 
	//this.audio.footstep.loop = true;
	this.audio.swordswing = new Audio("audio/sword_swipe.mp3"); 
	this.audio.scream = new Audio("audio/orc_scream.mp3"); 
	this.audio.wound = new Audio("audio/wound.mp3"); 
}


// ===================================== ORK ======================================
Maze.Obj.Ork = function(maze) {
	Maze.Obj.extend(this);
	this.className = 'Ork';
	this.mapPart = false;
	
	this.blocking = true;
	this.drawPhase = 1;

	Maze.Obj.Uniq.extend(this, maze);
	Maze.Obj.Selectable.extend(this);
	Maze.Obj.Walker.extend(this);
	Maze.Obj.Animated.extend(this);
	
	
	this.lineColor = '#202020';
	this.bootColor = '#202020';
	this.swordColor = 'brown';
	this.swordLength = 1.2;
	this.legLength = 0.4;
	this.headRad	 = 0.55;
	this.spineHeight	 = 0.8;
	this.armLength	 = 0.8;
	this.neckLength	 = 0.6;
	this.headColor = '#242f0b';
	
	this.speed = 0.4;
	
	this.init(); // animated.init
	
	this.audio = {};
	this.audio.scream = new Audio("audio/orc_scream.mp3"); 
	this.audio.swordswing = new Audio("audio/sword_swipe.mp3"); 
	this.audio.wound = new Audio("audio/wound.mp3"); 
	
	
	this.bind('stepIt', this.orkStepIt);
}

Maze.Obj.Ork.prototype.orkStepIt = function() {
	if (this.dead)
		return;
	
	if (this.walking || this.inFight)
		return;
		
	if (Math.random() * 100 < 4) {
		var x = this.tileX + Math.floor(Math.random() * 5) - 2;
		var y = this.tileY + Math.floor(Math.random() * 5) - 2;
		this.walkTo(x, y);
	} else if (Math.random() * 100 < 4) {
		//this.animAddAnimation('hit', this.animations.hitNormal, true);
	
	}
}

