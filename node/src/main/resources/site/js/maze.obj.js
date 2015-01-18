// ======================================== OBJECTS =====================================

Maze.Obj = function() {};

Maze.Obj.isBlocking = function(obj) {
	return this.blocking;
}

Maze.Obj.is = function(a) {
	return (this.ancestors[a] ? true : false);
}

Maze.Obj.extend = function(obj) {
	obj.ancestors = {};
	
	Maze.EventOwner.extend(obj);

	obj.blocking = false;
	obj.mapPart = true;
	obj.drawPhase = 0;
	
	obj.isBlocking = Maze.Obj.isBlocking;
	obj.is = Maze.Obj.is;
}

// ======================================== UNIQ =====================================
Maze.Obj.Uniq = function() {};

Maze.Obj.Uniq.extend = function(obj, maze) {
	obj.ancestors.uniq = true;
	
	obj.placeTo = Maze.Obj.Uniq.placeTo;
	
	obj.maze = maze;
	obj.plain = null;
	obj.tileX = 0;
	obj.tileY = 0;
}

Maze.Obj.Uniq.placeTo = function(plain, tileX, tileY) {
	if (this.plain) {
		this.plain.removeObject(this);
	}
	this.plain = plain;
	this.tileX = tileX;
	this.tileY = tileY;
	this.plain.addObject(this);	
}


// ======================================== SELECTABLE =====================================
Maze.Obj.Selectable = function() {};

Maze.Obj.Selectable.extend = function(obj, maze) {
	obj.ancestors.selectable = true;
	obj.mouseHover = false;
	obj.mouseActive = false;
	
	obj.bind('drawIt', Maze.Obj.Selectable.selectableDrawIt);
}

Maze.Obj.Selectable.selectableDrawIt = function(cam, left, top) {
	if (this.mouseHover || this.mouseActive) {
		cam.ctx.beginPath();
		cam.ctx.arc(left + cam.TILE_WIDTH / 2, top + cam.TILE_HEIGHT / 2, cam.TILE_WIDTH / 2, 0, 2 * Math.PI, false)		
		if (this.mouseActive) {
			cam.ctx.fillStyle = 'rgba(255,80,80,0.85)';
			this.mouseActive = false;
		} else {
			cam.ctx.fillStyle = 'rgba(200,200,80,0.6)';
		}
		cam.ctx.fill();
	}
}

// ======================================== SOLID =====================================

Maze.Obj.Solid = function() {};

Maze.Obj.Solid.extend = function(obj, color) {
	obj.ancestors.solid = true;
	obj.solidColor = color;
	obj.strokeStyle = false;
	obj.lineWidth = 1;
	
	obj.bind('drawIt', Maze.Obj.Solid.solidDrawIt);
}

Maze.Obj.Solid.solidDrawIt = function(cam, left, top) {
	cam.ctx.beginPath();
	cam.ctx.rect(
		left, 
		top, 
		cam.TILE_WIDTH, 
		cam.TILE_HEIGHT
		);
	cam.ctx.fillStyle = this.solidColor;
	cam.ctx.fill();
	if (this.strokeStyle) {
		cam.ctx.strokeStyle = this.strokeStyle;
		cam.ctx.lineWidth = this.lineWidth;
		cam.ctx.stroke();
	}
}

// ======================================== IMAGED =====================================

Maze.Obj.Imaged = function() {};

Maze.Obj.Imaged.extend = function(obj, maze) {
	obj.ancestors.imaged = true;
	
	obj.imageid = 'basic1';
	obj.sourceLeft = 0;
	obj.sourceTop = 0;
	obj.sourceWidth = 48;
	obj.sourceHeight = 48;
	obj.selfZoom = 1;
	obj.align = 'bottomCenter';
	
	obj.imagedDrawIt = Maze.Obj.Imaged.ImagedDrawIt;
	
	obj.bind('drawIt', obj.imagedDrawIt);
}

Maze.Obj.Imaged.ImagedDrawIt = function(cam, left, top) {

	var ww = this.sourceWidth / 48 * this.selfZoom;
	var hh = ww / this.sourceWidth * this.sourceHeight;
	
	// cam.ctx.drawImage(cam.images[this.imageid], 
		// this.sourceLeft, 
		// this.sourceTop, 
		// this.sourceWidth, 
		// this.sourceHeight, 
		// left  - cam.TILE_WIDTH * ((ww-1) / 2), 
		// top - cam.TILE_HEIGHT * (hh-1), 
		// cam.TILE_WIDTH * ww, 
		// cam.TILE_HEIGHT * hh
	// );
	cam.ctx.drawImage(cam.images[this.imageid], 
		this.sourceLeft, 
		this.sourceTop, 
		this.sourceWidth, 
		this.sourceHeight, 
		left  - cam.TILE_WIDTH * ((ww-1) / 2), 
		top - cam.TILE_HEIGHT * (hh-1), 
		cam.TILE_WIDTH * ww, 
		cam.TILE_HEIGHT * hh
	);
}

// ======================================== TERRAIN =====================================
Maze.Obj.Terrain = function() {};
Maze.Obj.Terrain.extend = function(obj, imageid, x, y, i) {
	Maze.Obj.extend(obj);
	obj.ancestors.terrain = true;
	Maze.Obj.Imaged.extend(obj);
	
	
	/*obj.bind('serialize', function(data) {
		data.i = i;
	});*/
	
	
	obj.imageid = imageid;
	
	var sx = 2;
	var sy = 2;
	if (i == 1) {sx = 2; sy = 0;}
	if (i == 2) {sx = 4; sy = 2;}
	if (i == 3) {sx = 2; sy = 4;}
	if (i == 4) {sx = 0; sy = 2;}
	
	if (i == 20) {sx = 3; sy = 0;}
	if (i == 21) {sx = 4; sy = 3;}
	if (i == 22) {sx = 1; sy = 4;}
	if (i == 23) {sx = 0; sy = 1;}
	
	if (i == 10) {sx = 1; sy = 1;}
	if (i == 11) {sx = 3; sy = 1;}
	if (i == 12) {sx = 3; sy = 3;}
	if (i == 13) {sx = 1; sy = 3;}
	
	
	obj.sourceLeft = (x + sx) * 48; 
	obj.sourceTop  = (y + sy) * 48; 
}

Maze.Obj.Terrain.createAll = function(terrainClass) {
	arr = new Array();
	arr[0] 	= new terrainClass(0);
	arr[1] 	= new terrainClass(1);
	arr[2] 	= new terrainClass(2);
	arr[3] 	= new terrainClass(3);
	arr[4] 	= new terrainClass(4);
	arr[10] 	= new terrainClass(10);
	arr[11] 	= new terrainClass(11);
	arr[12] 	= new terrainClass(12);
	arr[13] 	= new terrainClass(13);
	arr[20] 	= new terrainClass(20);
	arr[21] 	= new terrainClass(21);
	arr[22] 	= new terrainClass(22);
	arr[23] 	= new terrainClass(23);
	return arr;
}

// ===================================== STONEFLOOR ======================================
Maze.Obj.Nothing = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Solid.extend(this, '#111111');
	this.ancestors.Floor = true;
	this.className = 'Nothing';
};

Maze.Obj.GrassFloor = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Solid.extend(this, '#777656');
	this.ancestors.Floor = true;
	this.className = 'GrassFloor';
};

Maze.Obj.TileFloor1 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.sourceLeft = 0 * 48; 
	this.sourceTop = 2 * 48; 
	this.ancestors.Floor = true;
	this.className = 'TileFloor1';
};

Maze.Obj.TileFloor2 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.sourceLeft = 1 * 48; 
	this.sourceTop = 2 * 48; 
	this.ancestors.Floor = true;
	this.className = 'TileFloor2';
};

Maze.Obj.TileFloor3 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.sourceLeft = 2 * 48; 
	this.sourceTop = 2 * 48; 
	this.ancestors.Floor = true;
	this.className = 'TileFloor3';
};


Maze.Obj.SandFloor = function(i) {
	Maze.Obj.Terrain.extend(this, 'terrains1', 0, 0, i);
	this.ancestors.Floor = true;
	this.ancestors.SandFloor = true;
	this.className = 'SandFloor';
};

Maze.Obj.WaterFloor = function(i) {
	Maze.Obj.Terrain.extend(this, 'terrains1', 5, 0, i);
	this.ancestors.Floor = true;
	this.ancestors.WaterFloor = true;
	this.blocking = true;
	this.className = 'WaterFloor';
};

Maze.Obj.WaterFloor2 = function(i) {
	Maze.Obj.Terrain.extend(this, 'terrains1', 5, 10, i);
	this.ancestors.Floor = true;
	this.ancestors.WaterFloor2 = true;
	this.blocking = true;
	this.className = 'WaterFloor2';
};

Maze.Obj.RockFloor = function(i) {
	Maze.Obj.Terrain.extend(this, 'terrains1', 0, 5, i);
	this.ancestors.Floor = true;
	this.ancestors.RockFloor = true;
	this.className = 'RockFloor';
};

Maze.Obj.RockFloor2 = function(i) {
	Maze.Obj.Terrain.extend(this, 'terrains1', 5, 5, i);
	this.ancestors.Floor = true;
	this.ancestors.RockFloor2 = true;
	this.className = 'RockFloor2';
};

Maze.Obj.SnowFloor = function(i) {
	Maze.Obj.Terrain.extend(this, 'terrains1', 0, 10, i);
	this.ancestors.Floor = true;
	this.ancestors.SnowFloor = true;
	this.className = 'SnowFloor';
};

// ===================================== PLAYBACKFLOOR ======================================
Maze.Obj.PlaybackFloor = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Solid.extend(this, '#444477');
	this.ancestors.Floor = true;
	this.className = 'PlaybackFloor';
};

Maze.Obj.PlaybackFloor2 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Solid.extend(this, '#666677');
	this.ancestors.Floor = true;
	this.className = 'PlaybackFloor2';
};




// ===================================== BRICKWALL ======================================
Maze.Obj.BrickWall1 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);

	this.blocking = true;
	this.drawPhase = 1;
	
	this.sourceLeft = 0 * 48; 
	this.sourceTop = 9; 
	this.sourceHeight = 87; 
	this.className = 'BrickWall1';
};

Maze.Obj.BrickWall2 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);

	this.blocking = true;
	this.drawPhase = 1;
	
	this.sourceLeft = 1 * 48; 
	this.sourceTop = 9; 
	this.sourceHeight = 87; 
	this.className = 'BrickWall2';
};

Maze.Obj.BrickWall3 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);

	this.blocking = true;
	this.drawPhase = 1;
	
	this.sourceLeft = 2 * 48; 
	this.sourceTop = 9; 
	this.sourceHeight = 87; 
	this.className = 'BrickWall3';
};

// ===================================== TREE1 ======================================
Maze.Obj.Tree1 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.className = 'Tree1';

	this.blocking = true;
	this.drawPhase = 1;
	
	this.imageid = 'treex2';
	this.sourceLeft = 19;
	this.sourceTop = 8;
	this.sourceWidth = 117;
	this.sourceHeight = 139;
	this.selfZoom = 1.5;
};

Maze.Obj.Tree2 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.className = 'Tree2';

	this.blocking = true;
	this.drawPhase = 1;
	
	this.imageid = 'treex2';
	this.sourceLeft = 149;
	this.sourceTop = 13;
	this.sourceWidth = 101;
	this.sourceHeight = 133;
	this.selfZoom = 1.5;

};

Maze.Obj.Tree3 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.className = 'Tree3';

	this.blocking = true;
	this.drawPhase = 1;
	
	this.imageid = 'treex2';
	this.sourceLeft = 269;
	this.sourceTop = 16;
	this.sourceWidth = 92;
	this.sourceHeight = 128;
	this.selfZoom = 1.5;
};

Maze.Obj.TreePine1 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.className = 'TreePine1';

	this.blocking = true;
	this.drawPhase = 1;
	
	this.imageid = 'treex2';
	this.sourceLeft = 387;
	this.sourceTop = 18;
	this.sourceWidth = 82;
	this.sourceHeight = 132;
	this.selfZoom = 1.5;
};

Maze.Obj.TreePine2 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.className = 'TreePine2';

	this.blocking = true;
	this.drawPhase = 1;
	
	this.imageid = 'treex2';
	this.sourceLeft = 484;
	this.sourceTop = 53;
	this.sourceWidth = 62;
	this.sourceHeight = 91;
	this.selfZoom = 1.5;
};

Maze.Obj.TreeBold1 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.className = 'TreeBold1';

	this.blocking = true;
	this.drawPhase = 1;
	
	this.imageid = 'treex2';
	this.sourceLeft = 30;
	this.sourceTop = 156;
	this.sourceWidth = 89;
	this.sourceHeight = 115;
	this.selfZoom = 1.5;
};

Maze.Obj.TreeBold2 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.className = 'TreeBold2';

	this.blocking = true;
	this.drawPhase = 1;
	
	this.imageid = 'treex2';
	this.sourceLeft = 159;
	this.sourceTop = 155;
	this.sourceWidth = 81;
	this.sourceHeight = 121;
	this.selfZoom = 1.5;
};

Maze.Obj.TreeBold3 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.className = 'TreeBold3';

	this.blocking = true;
	this.drawPhase = 1;
	
	this.imageid = 'treex2';
	this.sourceLeft = 277;
	this.sourceTop = 163;
	this.sourceWidth = 68;
	this.sourceHeight = 113;
	this.selfZoom = 1.5;
};

Maze.Obj.TreePalm1 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.className = 'TreePalm1';

	this.blocking = true;
	this.drawPhase = 1;
	
	this.imageid = 'treex2';
	this.sourceLeft = 369;
	this.sourceTop = 156;
	this.sourceWidth = 151;
	this.sourceHeight = 144;
	this.selfZoom = 1.5;
};

Maze.Obj.TreePalm2 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.className = 'TreePalm2';

	this.blocking = true;
	this.drawPhase = 1;
	
	this.imageid = 'treex2';
	this.sourceLeft = 548;
	this.sourceTop = 158;
	this.sourceWidth = 98;
	this.sourceHeight = 139;
	this.selfZoom = 1.5;
};

Maze.Obj.TreePalm3 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.className = 'TreePalm3';

	this.blocking = true;
	this.drawPhase = 1;
	
	this.imageid = 'treex2';
	this.sourceLeft = 31;
	this.sourceTop = 296;
	this.sourceWidth = 98;
	this.sourceHeight = 139;
	this.selfZoom = 1.5;
};

Maze.Obj.TreePalm4 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.className = 'TreePalm4';

	this.blocking = true;
	this.drawPhase = 1;
	
	this.imageid = 'treex2';
	this.sourceLeft = 158;
	this.sourceTop = 300;
	this.sourceWidth = 159;
	this.sourceHeight = 135;
	this.selfZoom = 1.5;
};


Maze.Obj.Bush1 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.className = 'Bush1';

	this.blocking = true;
	this.drawPhase = 1;
	
	this.imageid = 'treex2';
	this.sourceLeft = 357;
	this.sourceTop = 362;
	this.sourceWidth = 53;
	this.sourceHeight = 41;
	this.selfZoom = 2;
};

Maze.Obj.Bush2 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.className = 'Bush2';

	this.blocking = true;
	this.drawPhase = 1;
	
	this.imageid = 'treex2';
	this.sourceLeft = 421;
	this.sourceTop = 359;
	this.sourceWidth = 69;
	this.sourceHeight = 44;
	this.selfZoom = 2;
};

Maze.Obj.Rock1 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.className = 'Rock1';

	this.blocking = true;
	this.drawPhase = 1;
	
	this.imageid = 'rock';
	this.sourceLeft = 13;
	this.sourceTop = 11;
	this.sourceWidth = 154;
	this.sourceHeight = 148;
	this.selfZoom = 0.8;
};

Maze.Obj.Rock2 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.className = 'Rock2';

	this.blocking = true;
	this.drawPhase = 1;
	
	this.imageid = 'rock';
	this.sourceLeft = 175;
	this.sourceTop = 10;
	this.sourceWidth = 165;
	this.sourceHeight = 157;
	this.selfZoom = 0.8;
};

Maze.Obj.Rock3 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.className = 'Rock3';

	this.blocking = true;
	this.drawPhase = 1;
	
	this.imageid = 'rock';
	this.sourceLeft = 21;
	this.sourceTop = 176;
	this.sourceWidth = 32;
	this.sourceHeight = 34;
	this.selfZoom = 0.8;
};

// ===================================== FIGHT PLACE ======================================
Maze.Obj.FightPlace = function(fight) {
	Maze.Obj.extend(this);
	Maze.Obj.Solid.extend(this, 'rgba(160,10,10,0.2)');
	Maze.Obj.Uniq.extend(this);
	this.fight = fight;
	this.className = 'FightPlace';
	this.mapPart = false;
	this.ancestors.FightPlace = true;


	this.bind('drawIt', function(cam, left, top) {
		var xLeft 		= this.plain.hasClass('FightPlace', this.tileX - 1, this.tileY);
		var xRight 		= this.plain.hasClass('FightPlace', this.tileX + 1, this.tileY);
		var xTop 		= this.plain.hasClass('FightPlace', this.tileX, this.tileY - 1);
		var xBottom		= this.plain.hasClass('FightPlace', this.tileX, this.tileY + 1);
		
		var line1 = function(cam) {
			cam.ctx.lineWidth = 1.0;
			cam.ctx.strokeStyle = 'rgba(160,10,10,0.6)';
		}
		var line2 = function(cam) {
			cam.ctx.lineWidth = 3.0;
			cam.ctx.strokeStyle = 'rgba(160,10,10,1)';
		}
		
		//left
		cam.ctx.beginPath();
		cam.ctx.moveTo(left, top);
		cam.ctx.lineTo(left, top + cam.TILE_HEIGHT);
		if (xLeft) {
			line1(cam);
		} else {
			line2(cam);
		}
		cam.ctx.stroke();
		
		//top
		cam.ctx.beginPath();
		cam.ctx.moveTo(left, top);
		cam.ctx.lineTo(left + cam.TILE_WIDTH, top);
		if (xTop) {
			line1(cam);
		} else {
			line2(cam);
		}
		cam.ctx.stroke();
		
		//right
		if (!xRight) {
			cam.ctx.beginPath();
			cam.ctx.moveTo(left + cam.TILE_WIDTH, top);
			cam.ctx.lineTo(left + cam.TILE_WIDTH, top + cam.TILE_HEIGHT);
			line2(cam);
			cam.ctx.stroke();
		}
		
		//bottom
		if (!xBottom) {
			cam.ctx.beginPath();
			cam.ctx.moveTo(left , top + cam.TILE_HEIGHT);
			cam.ctx.lineTo(left + cam.TILE_WIDTH, top + cam.TILE_HEIGHT);
			line2(cam);
			cam.ctx.stroke();
		}
		
	});
}

// ===================================== BLOOD ======================================
Maze.Obj.BloodBig = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.className = 'BloodBig';
	this.mapPart = false;

	this.blocking 		= false;
	this.drawPhase 		= 0;
	
	this.imageid 		= 'effects1';
	this.sourceLeft 	= 7;
	this.sourceTop 		= 8;
	this.sourceWidth 	= 58;
	this.sourceHeight 	= 67;
	this.selfZoom 		= 1;
	this.align 			= 'center';
};

Maze.Obj.Blood1 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.className = 'Blood1';
	this.mapPart = false;

	this.blocking 		= false;
	this.drawPhase 		= 0;
	
	this.imageid 		= 'effects1';
	this.sourceLeft 	= 89;
	this.sourceTop 		= 15;
	this.sourceWidth 	= 29;
	this.sourceHeight 	= 30;
	this.selfZoom 		= 1;
	this.align 			= 'center';
};

Maze.Obj.Blood2 = function() {
	Maze.Obj.extend(this);
	Maze.Obj.Imaged.extend(this);
	this.className = 'Blood2';
	this.mapPart = false;

	this.blocking 		= false;
	this.drawPhase 		= 0;
	
	this.imageid 		= 'effects1';
	this.sourceLeft 	= 63;
	this.sourceTop 		= 88;
	this.sourceWidth 	= 29;
	this.sourceHeight 	= 30;
	this.selfZoom 		= 1;
	this.align 			= 'center';
};




