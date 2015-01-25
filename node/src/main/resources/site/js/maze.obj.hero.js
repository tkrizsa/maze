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
	
	
	this.command = false;
	this.commandObj = null;
	this.commandTileX = 0;
	this.commandTileY = 0;
	
	this.bind('arrived', Maze.Obj.Hero.prototype.arrived);
	this.bind('drawIt', Maze.Obj.Hero.prototype.heroDrawIt);
	
	this.playerName = "?";
}

Maze.Obj.Hero.prototype.setData = function(jdata) {
	this.playerName = jdata.playerName;
	this.loaded = true;
}

Maze.Obj.Hero.prototype.heroDrawIt = function(cam, left, top) {
	var fos = Math.max(Math.ceil(cam.TILE_HEIGHT / 4),11);
	cam.ctx.font = "bold " + fos + "px Arial";
	cam.ctx.fillStyle = 'rgba(25,25,25,1.0)';
	cam.ctx.lineWidth = 1 + fos / 10;
	cam.ctx.strokeStyle = 'rgba(250,250,200,1.0)';	
	cam.ctx.strokeText( this.playerName, left, top - cam.TILE_HEIGHT);
	cam.ctx.fillText( this.playerName, left, top - cam.TILE_HEIGHT);


}

Maze.Obj.Hero.prototype.click = function(mouse) {
	//this.cancel();
	this.maze.pop.heroCancel();
	
	switch (this.command) {
		case false : 
			this.aimNear = false;
			if (mouse.kind == 'selectable') {
				this.commandObj = mouse.obj;
				this.walkToObj(mouse.obj);
			} else {
				this.walkTo(mouse.tileX, mouse.tileY);
			}
		break;
		case "build_farm" : 
		case "dig" : 
			this.aimNear = true;
			this.commandTileX = mouse.tileX;
			this.commandTileY = mouse.tileY;
			this.walkTo(mouse.tileX, mouse.tileY);
		break;
	}
}

Maze.Obj.Hero.prototype.cancel = function() {
	this.commandObj = null;
	this.command = false;
	this.maze.pop.heroCancel();
}

Maze.Obj.Hero.prototype.arrived = function() {
	if (this != this.maze.hero) 
		return;

	switch (this.command) {
		case false :
			if (this.commandObj && this.commandObj.is("gate")) {
				if (this.commandObj.targetPlainId == this.plain.plainId) {
					alert("Gate to same plain??");
					return;
				}
				this.maze.playerRecord.plainId = this.commandObj.targetPlainId;
				this.maze.playerRecord.sectionX = Math.floor(this.commandObj.targetX / 16);
				this.maze.playerRecord.sectionY = Math.floor(this.commandObj.targetY / 16);
				this.maze.playerRecord.sectionKey = this.maze.playerRecord.plainId + '#' + this.maze.playerRecord.sectionX + "#" + this.maze.playerRecord.sectionY;
				this.maze.playerRecord.x = this.commandObj.targetX;
				this.maze.playerRecord.y = this.commandObj.targetY;
			
				this.maze.heroPlaced = false;
				this.plain = null;
				this.cancel();
				
			}
		break;
		case "dig" :
			if (this.plain.isBlocking(this, this.commandTileX, this.commandTileY)) {
				alert("cannot dig here!");
			} else {
				var msg = {
					cmd : 'dig',
					x : this.commandTileX,
					y :	this.commandTileY,
					plainId : this.plain.plainId
				}
				this.maze.currPlayerServer.sock.send(JSON.stringify(msg));				
			}
			this.cancel();

		break;
		case "build_farm" : 
			//var farm = new Maze.Obj.Farm(this.maze);
			//farm.placeTo(this.plain, this.commandTileX, this.commandTileY-1);
			
			var msg = {
				cmd 		: 'build',
				playerId	: this.playerId,
				tileX 		: this.commandTileX,
				tileY		: this.commandTileY,
				plainId 	: this.plain.plainId,
				className 	: 'Farm'
			}
			var buildSection = this.plain.getSection(this.commandTileX, this.commandTileY);
			buildSection.server.send(msg, function() {
			
			});
			//buildSection.server.sock.send(JSON.stringify(msg));
			
			
			
			this.cancel();
			
			
		break;
	}

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

