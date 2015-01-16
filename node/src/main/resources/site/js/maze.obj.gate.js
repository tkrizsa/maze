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
	
	this.sourceLeft = 2 * 48; 
	this.sourceTop = 9; 
	this.sourceHeight = 87; 
}


