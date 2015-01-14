
/*
console.log('itt a w�rkerben!');
postMessage('mi folyik itt gy�ngy�s�n!');

var maze = null;

onmessage = function(event) {
	switch(event.data.cmd) {
		case 'start' : 
			if (maze == null) {
				maze = new Maze();
				maze.camera.setCanvas(null, 0, 0, event.data.width, event.data.height);
				maze.startWorker();
			}
		
		break;
	
	
	
	}

}
*/


Maze = function(domSelector) {

	this.playerId = 'user' + (Math.round(Math.random()*90000) + 10000);
	this.servers = {};

	// CREATE NOT UNIQUE OBJECT SINGLETONES
	this.BLOOD1 		= new Maze.Obj.Blood1();
	this.BLOOD2			= new Maze.Obj.Blood2();
	this.BLOOD_BIG 		= new Maze.Obj.BloodBig();
	
	this.GRASSFLOOR 		= new Maze.Obj.GrassFloor();
	this.TILEFLOOR1 		= new Maze.Obj.TileFloor1();
	this.TILEFLOOR2 		= new Maze.Obj.TileFloor2();
	this.TILEFLOOR3 		= new Maze.Obj.TileFloor3();
	
	this.SANDFLOOR 		= Maze.Obj.Terrain.createAll(Maze.Obj.SandFloor);
	this.WATERFLOOR 	= Maze.Obj.Terrain.createAll(Maze.Obj.WaterFloor);
	this.ROCKFLOOR 		= Maze.Obj.Terrain.createAll(Maze.Obj.RockFloor);
	
	this.BRICKWALL1		= new Maze.Obj.BrickWall1();
	this.BRICKWALL2		= new Maze.Obj.BrickWall2();
	this.BRICKWALL3		= new Maze.Obj.BrickWall3();
	
	this.TREE1			= new Maze.Obj.Tree1();
	this.TREE2			= new Maze.Obj.Tree2();

	this.NS = [
		{x :  0, y : +1},
		{x : +1, y : +1},
		{x : +1, y :  0},
		{x : +1, y : -1},
		{x :  0, y : -1},
		{x : -1, y : -1},
		{x : -1, y :  0},
		{x : -1, y : +1}
	];


	this.domSelector = domSelector;

	this.camera = new Maze.Camera(this);
	this.map = new Maze.Map(this);
	this.map.create();
	
	this.hero = new Maze.Obj.Hero(this);
	this.hero.jumpTo(this.map.levels[0], 5, 7);
	
	
	this.camera.level = this.map.levels[0];
	this.camera.follow = this.hero;
	
	this.timeLast = new Date().getTime();
	
	this.omega = 0.08; // d�l�ssz�g


	// audio
	this.audio = {};
	this.audio.fail = new Audio("audio/fail.mp3"); 
	this.audio.miss = new Audio("audio/miss.mp3"); 
	this.audio.bgMusic = new Audio("audio/BEAST1.wav"); 
	this.audio.bgMusic.loop = true;
	this.audio.bgMusic.volume = 0.4;
	
	this.soundsOn = true;
	this.musicOn = false;
	
	if (this.musicOn) 
		this.audio.bgMusic.play();
		
		
	// pops
	this.pop = new Maze.Pop.Main(this);
	//new Maze.Pop.PoseEditor(this, this.pop, this.hero, this.hero.animations.kick);	
	new Maze.Pop.DrawMenu(this, this.pop);	
	
	
	
	
	
	
	this.objs = new Array();
	this.objs.push(this.hero);

	/*
	// create orks
	var ork;
	for (var i = 0; i<5; i++) {
		ork = new Maze.Obj.Ork(this);
		ork.jumpTo(this.map.levels[0], 9 + i, 10+i*2);
		this.objs.push(ork);
	}
	
	/*
	var ork1;
	ork1 = new Maze.Obj.Ork(this);
	this.objs.push(ork1);
	ork1.jumpTo(this.map.levels[0], 7, 7);
	ork1.dir = 3;
	
	var ork2;
	ork2 = new Maze.Obj.Ork(this);
	this.objs.push(ork2);
	ork2.jumpTo(this.map.levels[0], 5, 8);
	ork2.dir = 5;
	*/
	
	/*this.timers = {};
	this.timerStat = {};
	this.timerCount = 0;*/
}

Maze.prototype.animTrigger = function(triggerID) {
	for (var i in this.objs) {
		var o = this.objs[i];
		if (o.is('animated'))
			o.animTriggered(triggerID);
	}
}

Maze.prototype.soundPlay = function(audio) {
	if (typeof audio  == 'undefined' || !this.soundsOn)
		return;
	audio.currentTime = 0;
	audio.play();
}

Maze.prototype.soundPlayLoop = function(audio) {
	if (typeof audio  == 'undefined' || !this.soundsOn)
		return;
	audio.play();
}

Maze.prototype.start = function() {
	var thisMaze = this;
	
	var canvas = document.getElementById(this.domSelector);
	var ctx = canvas.getContext("2d");
	
	this.camera.setCanvas(ctx, 0,0,$(canvas).width(), $(canvas).height());
	$(window).resize(function() {
		thisMaze.camera.setCanvas(ctx, 0,0,$(canvas).width(), $(canvas).height());
	
	});
	
	this.gameTimer = setInterval(function() {
		thisMaze.stepIt();
		thisMaze.camera.render(ctx);
	}, 50);


}


Maze.prototype.stepIt = function() {
	this.timeNow = new Date().getTime();
	
	for (var i in this.objs) {
		var o = this.objs[i];
		if (o.is('walker')) 
			o.triggerObj(o, 'stepIt');
	}

	this.map.stepIt();
	
	this.timeLast = this.timeNow;
}

Maze.prototype.mouseClick = function(mouse) {
	if (mouse.kind == 'pop') {
		mouse.obj.trigger('click');
		return;
	}
	
	if (mouse.kind == 'tile' || mouse.kind == 'selectable') {
		if (this.draw)  {
			this.drawPut(mouse);
			return;
		}



		if (this.hero.inFight || this.hero.dead)
			return;
	
		// if (mouse.obj.is('fighter')) {
			// this.hero.attack(mouse.obj);
			// mouse.obj.mouseActive = true;
			// return;
		// }
		this.hero.walkTo(mouse.tileX, mouse.tileY);
	}
	
}

// ======================================== CAMERA =====================================
Maze.Camera = function(maze) {
	this.maze = maze;
	this.level = null;
	
	this.images = {};
	
	this.SOURCE_TILE_WIDTH = 48;
	this.SOURCE_TILE_HEIGHT = 48;
	this.TILE_WIDTH = 48;
	this.TILE_HEIGHT = 48;
	
	
	this.centerTileX = 0;
	this.centerTileY = 0;
	this.centerOffsetX = 0;
	this.centerOffsetY = 0;
	
	this.mouseX = -1;
	this.mouseY = -1;
	this.mouseHover = {
		kind : false,
		obj  : null,
		tileX : 0,
		tileY : 0
	}
}

Maze.Camera.prototype.setCanvas = function(ctx, canvasLeft, canvasTop, canvasWidth, canvasHeight) {
	this.ctx 			= ctx;
	this.canvasLeft 	= canvasLeft;
	this.canvasTop 		= canvasTop;
	this.canvasWidth 	= canvasWidth;
	this.canvasHeight 	= canvasHeight;
	
	this.maze.pop.width  = canvasWidth;
	this.maze.pop.height = canvasHeight;
	

	this.images.treex1			= document.getElementById("treex1");
	this.images.treex2			= document.getElementById("treex2");
	this.images.basic1			= document.getElementById("items2");
	this.images.icons1			= document.getElementById("icons1");
	this.images.effects1   		= document.getElementById("effects1");
	this.images.terrains1 		= document.getElementById("terrains1");
}


Maze.Camera.prototype.wheelZoom = function(delta) {
	if (this.mouseHover.kind == 'pop') {
		this.mouseHover.obj.trigger('wheel', delta);
		return;
	}

	if (delta > 0) {
		if (this.TILE_WIDTH<64) {
			this.TILE_WIDTH += 4;
			this.TILE_HEIGHT += 4;
		}
	} else {
		if (this.TILE_WIDTH>24) {
			this.TILE_WIDTH -= 4;
			this.TILE_HEIGHT -= 4;
		}
	}
	console.log("Zoom: "+this.TILE_WIDTH);
}

Maze.Camera.prototype.mouseMove = function(mouseX, mouseY) {
	this.mouseX = mouseX;
	this.mouseY = mouseY;
}

Maze.Camera.prototype.mouseLeave = function() {
	this.mouseX = -1;
	this.mouseY = -1;
	this.mouseHover.kind = false;
}

Maze.Camera.prototype.mouseClick = function() {
	this.maze.mouseClick(this.mouseHover);
}




Maze.Camera.prototype.render = function() {

	// reset mouseHover
	this.setMouseHover(false, null);


	if (this.follow) {
		this.centerTileX = this.follow.tileX;
		this.centerTileY = this.follow.tileY;
		this.centerOffsetX = Math.floor(this.follow.offsetX * this.follow.offsetSize * this.TILE_WIDTH);
		this.centerOffsetY = Math.floor(this.follow.offsetY * this.follow.offsetSize * this.TILE_HEIGHT);
	}


	var ctx = this.ctx; //have to write too many times
	ctx.fillStyle = "#222222";
	ctx.fillRect(this.canvasLeft, this.canvasTop, this.canvasWidth, this.canvasHeight);


	
	
	var canvasMidX = Math.floor(this.canvasWidth / 2);
	var canvasMidY = Math.floor(this.canvasHeight / 2);
	
	
	
	
	// ========================================================== CHECK MOUSE ===================================================
	if (this.mouseX >= 0) {
	
		var selectedTileX = Math.floor((this.mouseX - canvasMidX + this.centerOffsetX) / this.TILE_WIDTH) + this.centerTileX;
		var selectedTileY = Math.floor((this.mouseY - canvasMidY + this.centerOffsetY) / this.TILE_HEIGHT) + this.centerTileY;
	
		var item = this.level.itemAt(selectedTileX, selectedTileY);
		var selTile = false;
		var selSelectable = false;
		var selBlur = false;
		while (item != null) {
			if (item.obj.is('selectable') && !selSelectable) {
				selSelectable = item.obj;
			} else if (item.obj.is('blur') && !selSelectable && ! selBlur) {
				selBlur = item.obj;
			} else if (item.obj && !selSelectable && !selBlur && !selTile) {
				selTile = item.obj;
			}
			item = item.next;
		}
		if (selSelectable) {
			this.setMouseHover('selectable', selSelectable, selectedTileX, selectedTileY);
		} else if (selBlur) {
			this.setMouseHover('selectable', selBlur.obj, selectedTileX, selectedTileY);
		} else if (selTile) {
			this.setMouseHover('tile', selTile, selectedTileX, selectedTileY);
		}
	}
	
	// ========================================================== DRAW SCENE ===================================================
	
	
	var viewRangeX = Math.ceil(this.canvasWidth / this.TILE_WIDTH / 2) + 2;
	var viewRangeY = Math.ceil(this.canvasHeight / this.TILE_HEIGHT / 2) + 5;
	
	
	var draw2 = {};
	
	for(var y = -viewRangeY; y <= viewRangeY; y++) {
		for(var x = -viewRangeX; x <= +viewRangeX; x++) {
			var item = this.level.itemAt(x + this.centerTileX, y + this.centerTileY);
			while (item) {
				var ox = 0;
				var oy = 0;
				if (item.obj.offsetSize) {
					ox = Math.floor(item.obj.offsetSize * item.obj.offsetX * this.TILE_WIDTH);
					oy = Math.floor(item.obj.offsetSize * item.obj.offsetY * this.TILE_HEIGHT);
				}
				var left = canvasMidX + x * this.TILE_WIDTH - this.centerOffsetX + ox;
				var top = canvasMidY + y * this.TILE_HEIGHT - this.centerOffsetY + oy;

				if (item.obj.drawPhase > 0) {
					if (!draw2[top+1100000]) { // +  for correct ordering (no minus, alphabetically right)
						draw2[top+1100000] = new Array();
					}
					draw2[top+1100000].push({
						obj : item.obj,
						left : left,
						top : top,
						tileX : x + this.centerTileX, 
						tileY : y + this.centerTileY 
					});
				} else {
					item.obj.trigger('drawIt', this, left, top);
				}
				
				item = item.next;
			}
		} // x
	} // y


	// SELECTION
	if (this.mouseHover.kind == 'tile') {
		ctx.beginPath();
		
		ctx.rect(
			canvasMidX + (this.mouseHover.tileX - this.centerTileX) * this.TILE_WIDTH - this.centerOffsetX,
			canvasMidY + (this.mouseHover.tileY - this.centerTileY) * this.TILE_HEIGHT - this.centerOffsetY,
			this.TILE_WIDTH,
			this.TILE_HEIGHT
			);
			
		ctx.lineWidth="1";
		ctx.fillStyle = 'rgba(0,0,0,0.2)';
		ctx.fill();
	}	
	
	// ======== PHASE 2 ============

	
	for (var i in draw2) {
		var d = draw2[i];
		for (var j in d) {
			var e = d[j];
			var trans = 1.0;
			if (this.follow && this.follow.inFight && !e.obj.is('walker') && (Math.abs(e.tileX - this.follow.tileX) <= 2) && (e.tileY > this.follow.tileY) && (e.tileY <= this.follow.tileY + 5)) {
				trans = 0.2 + Math.abs(e.tileX - this.follow.tileX) * 0.2;
				ctx.globalAlpha = trans;
			}
			e.obj.trigger('drawIt', this, e.left, e.top);
			if (this.trans != 1.0) {
				ctx.globalAlpha = 1.0;
			}
		}
	}
	
	
	
	// === ICONS ===
	// hp
	for (var i = 0; i < this.maze.hero.hp; i++) {
		ctx.drawImage(this.images.icons1, 
			0, 
			0, 
			32, 
			32, 
			10 + i * 26, 
			10, 
			20, 
			20
		);
	}
	


	// ===== FIGHT =======
	// if (this.follow && this.follow.inFight) {
		// var fight = this.follow.inFight;
		// var h = 15;
		
		
		// if (fight.phase == 'waiting') {
			// ctx.beginPath();
			// ctx.rect(
				// 0,
				// this.canvasHeight - h,
				// this.canvasWidth,
				// h
				// );
				
			// ctx.fillStyle = 'rgba(0,0,0,0.2)';
			// ctx.fill();

			// var w = Math.floor((this.maze.timeNow - fight.lastStep) / fight.waitTime * this.canvasWidth);
			// ctx.beginPath();
			// ctx.rect(
				// 0,
				// this.canvasHeight - h,
				// w,
				// h
				// );
				
			// ctx.fillStyle = 'rgba(255, 20, 20, 0.8)';
			// ctx.fill();
			
		
		
		// }
		
	// }
	
	// ===== POP =======
	this.maze.pop.drawIt(this);
	

}


Maze.Camera.prototype.setMouseHover = function(kind, obj, x, y) {
	if (this.mouseHover.obj && this.mouseHover.obj.is && this.mouseHover.obj.is('selectable'))
		this.mouseHover.obj.mouseHover = false;
		
	this.mouseHover.obj = obj;
	this.mouseHover.kind = kind;
	this.mouseHover.tileX = x;
	this.mouseHover.tileY = y;

	if (this.mouseHover.obj && this.mouseHover.obj.is && this.mouseHover.obj.is('selectable'))
		this.mouseHover.obj.mouseHover = true;

}



/* ==================================================== DRAWING ================================================ */
Maze.prototype.drawPut = function(mouse) {
	if (this.draw.type == 'terrain' || this.draw.type == 'floor' || this.draw.type == 'object')  {
		var level = this.camera.follow.level;
		var className = this.draw.terrainClass;
		if (this.draw.type == 'object')
			className = this.draw.objectClass;
		var obj = this[className.toUpperCase()];
		
		if (obj.constructor === Array) {
			obj = obj[0];
		}

		var section = level.getSection(mouse.tileX, mouse.tileY);
		if (!section)
			return;
			
		var msg = {
			cmd : 'draw',
			className : obj.className,
			x : mouse.tileX,
			y : mouse.tileY,
			sectionKey : section.getKey()
		}
		section.server.sock.send(JSON.stringify(msg));
	}



	return; // !!!!!
	// old
	if (this.draw.type == 'terrain')
		this.drawTerrain(mouse);
	if (this.draw.type == 'floor')
		this.drawFloor(mouse);
	if (this.draw.type == 'object')
		this.drawObject(mouse);
		
		
	if (this.draw.type == 'objectRemove') {
		var level = this.camera.follow.level;
		var item = level.itemAt(mouse.tileX, mouse.tileY);
		var obj = null;
		while (item != null) {
			if (!item.obj.is('Floor'))
				obj = item.obj;
			item = item.next;
		
		}
		if (obj) 
			level.removeObject(obj, mouse.tileX, mouse.tileY);
	
	}

}

Maze.prototype.drawTerrain = function(mouse) {
	var level = this.camera.follow.level;
	var objs = this[this.draw.terrainClass.toUpperCase()];
	level.addFloor(objs[0], mouse.tileX, mouse.tileY);
	for (var i in this.NS) {
		var n = this.NS[i];
		level.addFloor(objs[0], mouse.tileX + n.x, mouse.tileY + n.y);
	}
	this.drawTerrainCorrect(level, 'SandFloor');
	this.drawTerrainCorrect(level, 'WaterFloor');
	this.drawTerrainCorrect(level, 'RockFloor');
}

Maze.prototype.drawFloor = function(mouse) {
	var level = this.camera.follow.level;
	var obj = this[this.draw.terrainClass.toUpperCase()];
	level.addFloor(obj, mouse.tileX, mouse.tileY);
	
	this.drawTerrainCorrect(level, 'SandFloor');
	this.drawTerrainCorrect(level, 'WaterFloor');
	this.drawTerrainCorrect(level, 'RockFloor');
}

Maze.prototype.drawObject = function(mouse) {
	var level = this.camera.follow.level;
	var obj = this[this.draw.objectClass.toUpperCase()];
	level.addObject(obj, mouse.tileX, mouse.tileY);
}


Maze.prototype.drawTerrainCorrect = function(level, terrainClass) {
	var objs = this[terrainClass.toUpperCase()];
	for (var section_key in level.sections) {
		var section = level.sections[section_key];
		for (var sy = 0; sy < section.tileHeight; sy++) {
			for (var sx = 0; sx < section.tileWidth; sx++) {
			
			
				var x = sx + section.offX;
				var y = sy + section.offY;
			
				if (!level.hasClass(terrainClass, x, y, true))
					continue;
				var xLeft 		= level.hasClass2(terrainClass, x-1, y, true);
				var xRight 		= level.hasClass2(terrainClass, x+1, y, true);
				var xTop 		= level.hasClass2(terrainClass, x, y-1, true);
				var xBottom 	= level.hasClass2(terrainClass, x, y+1, true);
				var xs = ((xLeft?1:0) + (xRight?1:0) + (xBottom?1:0) + (xTop?1:0));
				var i = 0;
				
				var xTopLeft 			= level.hasClass2(terrainClass, x-1, y-1, true);
				var xTopRight 			= level.hasClass2(terrainClass, x+1, y-1, true);
				var xBottomRight 		= level.hasClass2(terrainClass, x+1, y+1, true);
				var xBottomLeft		 	= level.hasClass2(terrainClass, x-1, y+1, true);
				
				
				if (xs == 3 && !xTop)	 	{ i = 1; }
				if (xs == 3 && !xRight) 	{ i = 2; }
				if (xs == 3 && !xBottom) 	{ i = 3; }
				if (xs == 3 && !xLeft) 		{ i = 4; }
				
				if (xs == 2 && !xTop && !xRight) 		{ i = 20; }
				if (xs == 2 && !xBottom && !xRight) 	{ i = 21; }
				if (xs == 2 && !xBottom && !xLeft) 		{ i = 22; }
				if (xs == 2 && !xTop && !xLeft) 		{ i = 23; }
				
				if (xs == 4 && !xTopLeft) 				{ i = 10; }
				if (xs == 4 && !xTopRight) 				{ i = 11; }
				if (xs == 4 && !xBottomRight) 			{ i = 12; }
				if (xs == 4 && !xBottomLeft) 			{ i = 13; }
			
				level.addFloor(objs[i], x, y);
			}
		}
	}
}