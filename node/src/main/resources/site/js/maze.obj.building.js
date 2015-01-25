Maze.Obj.Building = {};
Maze.Obj.Building.extend = function(obj, maze, tileWidth, tileHeight) {
	Maze.Obj.extend(obj);
	Maze.Obj.Uniq.extend(obj, maze);
	Maze.Obj.Selectable.extend(obj);
	Maze.Obj.Imaged.extend(obj);	
	obj.ancestors.building = true;
	obj.ancestors.multitile = true;
	
	obj.tileWidth = tileWidth;
	obj.tileHeight = tileHeight;
	
	obj.mapPart = true;
	obj.blocking = true;
	obj.drawPhase = 1;
	
	obj.placeTo = Maze.Obj.Building.placeTo;
	obj.setData = Maze.Obj.Building.setData;
	
	obj.bind("drawIt", Maze.Obj.Building.buildingDrawIt);
	

}

Maze.Obj.Building.buildingDrawIt = function(cam, left, top) {
	this.hello = "leo";
}

Maze.Obj.Building.setData = function(jdata) {
	this.hello = "leo";
}

Maze.Obj.Building.placeTo = function(plain, tileX, tileY) {
	if (this.plain) {
		alert("removeobject missing!!");
	}
	
	this.plain = plain;
	this.tileX = tileX;
	this.tileY = tileY;
	
	var minx = Math.floor((this.tileWidth - 1) / 2);
	var miny = Math.floor((this.tileHeight - 1) / 2);
	for (var y = 0; y < this.tileHeight; y ++) {
		for (var x = 0; x < this.tileWidth; x ++) {
			this.plain.addObjectMulti(this, tileX - minx + x, tileY - this.tileHeight + y + 1);
	
		}
	}
}

/* ========================================== FARM ================================================= */

Maze.Obj.Farm = function(maze) {
	Maze.Obj.extend(this);
	this.ancestors.farm = true;
	this.className = 'Farm';
	Maze.Obj.Building.extend(this, maze, 5, 5);
	
	this.sourceLeft = 4 * 48; 
	this.sourceTop = 0; 
	this.sourceHeight = 3 * 48;
	this.sourceWidth = 2 * 48;
	this.selfZoom = 2.4;
	
	
}