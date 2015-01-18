Maze.Obj.Gate = function(maze, targetPlainId, targetX, targetY) {
	Maze.Obj.extend(this);
	this.ancestors.gate = true;
	this.className = 'Gate';
	this.mapPart = false;
	
	this.blocking = false;
	this.drawPhase = 1;
	
	Maze.Obj.Uniq.extend(this, maze);
	Maze.Obj.Selectable.extend(this);
	Maze.Obj.Imaged.extend(this);
	
	this.targetPlainId = targetPlainId;
	this.targetX = targetX;
	this.targetY = targetY;
	
	
	this.imageid = 'rock';
	this.sourceLeft = 347;
	this.sourceTop = 8;
	this.sourceWidth = 152;
	this.sourceHeight = 152;
	this.selfZoom = 0.8;
}

Maze.Obj.Gate.prototype.setMapData = function(data) {
	this.targetPlainId 	= data.plainId;
	this.targetX 		= data.x;
	this.targetY		= data.y;
}

