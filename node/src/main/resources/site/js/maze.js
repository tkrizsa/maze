

Maze = function(domSelector) {

	this.playerRecord = {
		playerId 	: 'player' + (Math.round(Math.random()*90000) + 10000),
		sectionKey 	: "earth#-1#0",
		x 			: -7,
		y 			:  13,
		plainId		: "earth",
		sectionX	: -1,
		sectionY	: 0
	}



	this.SECTION_SIZE = 16;
	
	// CREATE NOT UNIQUE OBJECT SINGLETONES
	this.NOTHING 		= new Maze.Obj.Nothing();
	
	this.BLOOD1 		= new Maze.Obj.Blood1();
	this.BLOOD2			= new Maze.Obj.Blood2();
	this.BLOOD_BIG 		= new Maze.Obj.BloodBig();
	
	this.GRASSFLOOR 		= new Maze.Obj.GrassFloor();
	this.TILEFLOOR1 		= new Maze.Obj.TileFloor1();
	this.TILEFLOOR2 		= new Maze.Obj.TileFloor2();
	this.TILEFLOOR3 		= new Maze.Obj.TileFloor3();
	
	this.SANDFLOOR 		= Maze.Obj.Terrain.createAll(Maze.Obj.SandFloor);
	this.SANDFLOOR2		= Maze.Obj.Terrain.createAll(Maze.Obj.SandFloor2);
	this.WATERFLOOR 	= Maze.Obj.Terrain.createAll(Maze.Obj.WaterFloor);
	this.WATERFLOOR2 	= Maze.Obj.Terrain.createAll(Maze.Obj.WaterFloor2);
	this.ROCKFLOOR 		= Maze.Obj.Terrain.createAll(Maze.Obj.RockFloor);
	this.ROCKFLOOR2		= Maze.Obj.Terrain.createAll(Maze.Obj.RockFloor2);
	this.SNOWFLOOR		= Maze.Obj.Terrain.createAll(Maze.Obj.SnowFloor);
	this.SWAMPFLOOR		= Maze.Obj.Terrain.createAll(Maze.Obj.SwampFloor);
	this.SWAMPFLOOR2	= Maze.Obj.Terrain.createAll(Maze.Obj.SwampFloor2);
	this.SWAMPWATERFLOOR= Maze.Obj.Terrain.createAll(Maze.Obj.SwampWaterFloor);
	
	this.BRICKWALL1		= new Maze.Obj.BrickWall1();
	this.BRICKWALL2		= new Maze.Obj.BrickWall2();
	this.BRICKWALL3		= new Maze.Obj.BrickWall3();
	
	this.TREE1			= new Maze.Obj.Tree1();
	this.TREE2			= new Maze.Obj.Tree2();
	this.TREE3			= new Maze.Obj.Tree3();
	this.TREEPINE1		= new Maze.Obj.TreePine1();
	this.TREEPINE2		= new Maze.Obj.TreePine2();
	this.TREEBOLD1		= new Maze.Obj.TreeBold1();
	this.TREEBOLD2		= new Maze.Obj.TreeBold2();
	this.TREEBOLD3		= new Maze.Obj.TreeBold3();
	this.TREEPALM1		= new Maze.Obj.TreePalm1();
	this.TREEPALM2		= new Maze.Obj.TreePalm2();
	this.TREEPALM3		= new Maze.Obj.TreePalm3();
	this.TREEPALM4		= new Maze.Obj.TreePalm4();
	this.BUSH1			= new Maze.Obj.Bush1();
	this.BUSH2			= new Maze.Obj.Bush2();
	
	this.ROCK1			= new Maze.Obj.Rock1();
	this.ROCK2			= new Maze.Obj.Rock2();
	this.ROCK3			= new Maze.Obj.Rock3();
	
	this.SCHOOL			= new Maze.Obj.School();

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
	
	this.servers = {};					// list of servers referenced by url
	this.subscribedSections = {};		// list of subscribed sections referenced by sectionKey
	this.currPlayerServer = false;
	this.plains = {};					// list of plains referenced by plainId
	this.objs = {};  					// list of uniq objects indexed by objectId

	this.hero = new Maze.Obj.Hero(this);
	this.hero.playerId = this.playerRecord.playerId;
	this.objs[this.hero.playerId] = this.hero;
	this.heroPlaced = false;
	
	this.camera.follow = this.hero;
	
	this.timeLast = new Date().getTime();
	
	this.omega = 0.08; // dõlésszög


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
	
	

	/*
	// create orks
	var ork;
	for (var i = 0; i<5; i++) {
		ork = new Maze.Obj.Ork(this);
		ork.jumpTo(this.plains[0], 9 + i, 10+i*2);
		this.objs.push(ork);
	}
	
	/*
	var ork1;
	ork1 = new Maze.Obj.Ork(this);
	this.objs.push(ork1);
	ork1.jumpTo(this.plains[0], 7, 7);
	ork1.dir = 3;
	
	var ork2;
	ork2 = new Maze.Obj.Ork(this);
	this.objs.push(ork2);
	ork2.jumpTo(this.plains[0], 5, 8);
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

	this.serversStepIt();
	
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
	

		this.hero.click(mouse);
	}
	
}

Maze.prototype.objIndex = function(obj) {
	for (var i in this.objs) {
		if (this.objs[i] == obj) {
			return i;
		}
	}
	return false;
}

Maze.prototype.objIndexByPlayerId = function(playerId) {
	for (var i in this.objs) {
		if (this.objs[i].playerId == playerId) {
			return i;
		}
	}
	return false;
}

Maze.prototype.objByPlayerId = function(playerId) {
	for (var i in this.objs) {
		if (this.objs[i].playerId == playerId) {
			return this.objs[i];
		}
	}
	return false;
}

Maze.prototype.objRemove = function(obj) {
	for (var i in this.objs) {
		if (this.objs[i] == obj) {
			delete this.objs[i];
			return;
		}
	}
}

// ======================================== CAMERA =====================================
Maze.Camera = function(maze) {
	this.maze = maze;
	
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
	
	this.drawSectionGrid = false;
}

Maze.Camera.prototype.setCanvas = function(ctx, canvasLeft, canvasTop, canvasWidth, canvasHeight) {
	this.ctx 			= ctx;
	this.canvasLeft 	= canvasLeft;
	this.canvasTop 		= canvasTop;
	this.canvasWidth 	= canvasWidth;
	this.canvasHeight 	= canvasHeight;
	
	this.maze.pop.width  = canvasWidth;
	this.maze.pop.height = canvasHeight;
	

	this.images.treex2			= document.getElementById("treex2");
	this.images.rock			= document.getElementById("rock");
	this.images.basic1			= document.getElementById("items2");
	this.images.icons1			= document.getElementById("icons1");
	this.images.terrains1 		= document.getElementById("terrains1");
	this.images.school 			= document.getElementById("school");
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

	if (!this.follow || !this.follow.plain)
		return;

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
	
		var item = this.follow.plain.itemAt(selectedTileX, selectedTileY);
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
			var item = this.follow.plain.itemAt(x + this.centerTileX, y + this.centerTileY);
			
			
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
					// multitile objects should be drawn once!
					var drawNow = true;
					if (item.obj.is('multitile') && (item.obj.tileX != x + this.centerTileX || item.obj.tileY != y + this.centerTileY)) {
						drawNow = false;
					}

					if (drawNow) {
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
					}
				} else {
					item.obj.trigger('drawIt', this, left, top);
					
					//SECTION BORDER
					if (this.drawSectionGrid) {
						var xx = (x + this.centerTileX) % 16;
						var yy = (y + this.centerTileY) % 16;
						if (xx==0 || xx == this.maze.SECTION_SIZE - 1 || yy == 0 || yy == this.maze.SECTION_SIZE - 1) {
							ctx.lineWidth= 1;
							ctx.strokeStyle = 'rgba(0,0,0,1.0)';
						}
						if (xx == 0) {
							ctx.beginPath();
							ctx.moveTo(left, top);
							ctx.lineTo(left, top + this.TILE_HEIGHT);
							ctx.closePath();
							ctx.stroke();						
						}
						if (xx == this.maze.SECTION_SIZE - 1) {
							ctx.beginPath();
							ctx.moveTo(left + this.TILE_WIDTH - 1, top);
							ctx.lineTo(left + this.TILE_WIDTH - 1, top + this.TILE_HEIGHT);
							ctx.closePath();
							ctx.stroke();						
						}
						if (yy == 0) {
							ctx.beginPath();
							ctx.moveTo(left, top);
							ctx.lineTo(left + this.TILE_WIDTH, top);
							ctx.closePath();
							ctx.stroke();						
						}
						if (yy == this.maze.SECTION_SIZE - 1) {
							ctx.beginPath();
							ctx.moveTo(left, top + this.TILE_HEIGHT - 1);
							ctx.lineTo(left + this.TILE_WIDTH, top + this.TILE_HEIGHT - 1);
							ctx.closePath();
							ctx.stroke();						
						}
						if (xx==0 && yy==0) {
							var secX = Math.floor((x + this.centerTileX) / this.maze.SECTION_SIZE);
							var secY = Math.floor((y + this.centerTileY) / this.maze.SECTION_SIZE);
						
						
							ctx.font = "12px Arial";
							ctx.fillStyle = 'rgba(0,0,0,1.0)';
							ctx.fillText(secX + ", " + secY, left + 3, top + 11);
						
						}
					}
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
		var plain = this.camera.follow.plain;
		var className = this.draw.terrainClass;
		if (this.draw.type == 'object')
			className = this.draw.objectClass;
		var obj = this[className.toUpperCase()];
		
		if (obj.constructor === Array) {
			obj = obj[0];
		}

		var msgs = {};
		
		var section = plain.getSection(mouse.tileX, mouse.tileY);
			
		var msg = {
			cmd 		: 'draw',
			playerId 	: this.hero.playerId,
			items 		: []
		}
		msg.items.push({
			className : obj.className,
			plainId : plain.plainId,
			tileX : mouse.tileX,
			tileY : mouse.tileY
		});
		msgs[section.server.url] = msg;
		
		if (this.draw.type == 'terrain') {
			for (var i in this.NS) {
				var n = this.NS[i];
				var section = plain.getSection(mouse.tileX+n.x, mouse.tileY+n.y);
				var msg = msgs[section.server.url];
				if (!msg) {
					msg = {
						cmd 		: 'draw',
						playerId 	: this.hero.playerId,
						items 		: []
					}
					msgs[section.server.url] = msg;
				}
				
				msg.items.push({
					className : obj.className,
					plainId : plain.plainId,
					tileX : mouse.tileX+n.x,
					tileY : mouse.tileY+n.y
				});
			}
		}
		for (var url in msgs) {
			var server = this.servers[url];
			var msg = msgs[url];
			server.send(msg);
		}
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
		var plain = this.camera.follow.plain;
		var item = plain.itemAt(mouse.tileX, mouse.tileY);
		var obj = null;
		while (item != null) {
			if (!item.obj.is('Floor'))
				obj = item.obj;
			item = item.next;
		
		}
		if (obj) 
			plain.removeObject(obj, mouse.tileX, mouse.tileY);
	
	}

}

Maze.prototype.drawTerrain = function(mouse) {
	var plain = this.camera.follow.plain;
	var objs = this[this.draw.terrainClass.toUpperCase()];
	plain.addFloor(objs[0], mouse.tileX, mouse.tileY);
	for (var i in this.NS) {
		var n = this.NS[i];
		plain.addFloor(objs[0], mouse.tileX + n.x, mouse.tileY + n.y);
	}
	this.drawTerrainCorrectAll(plain);
}

Maze.prototype.drawFloor = function(mouse) {
	var plain = this.camera.follow.plain;
	var obj = this[this.draw.terrainClass.toUpperCase()];
	plain.addFloor(obj, mouse.tileX, mouse.tileY);
	this.drawTerrainCorrectAll(plain);
	
}

Maze.prototype.drawObject = function(mouse) {
	var plain = this.camera.follow.plain;
	var obj = this[this.draw.objectClass.toUpperCase()];
	plain.addObject(obj, mouse.tileX, mouse.tileY);
}


Maze.prototype.drawTerrainCorrectAll = function(plain) {
	this.drawTerrainCorrect(plain, 'SandFloor');
	this.drawTerrainCorrect(plain, 'SandFloor2');
	this.drawTerrainCorrect(plain, 'WaterFloor');
	this.drawTerrainCorrect(plain, 'WaterFloor2');
	this.drawTerrainCorrect(plain, 'RockFloor');
	this.drawTerrainCorrect(plain, 'RockFloor2');
	this.drawTerrainCorrect(plain, 'SnowFloor');
	this.drawTerrainCorrect(plain, 'SwampFloor');
	this.drawTerrainCorrect(plain, 'SwampFloor2');
	this.drawTerrainCorrect(plain, 'SwampWaterFloor');
}

Maze.prototype.drawTerrainCorrect = function(plain, terrainClass) {
	var objs = this[terrainClass.toUpperCase()];
	for (var section_key in this.subscribedSections) {
		var section = this.subscribedSections[section_key];
		for (var sy = 0; sy < section.tileHeight; sy++) {
			for (var sx = 0; sx < section.tileWidth; sx++) {
			
			
				var x = sx + section.offX;
				var y = sy + section.offY;
			
				if (!plain.hasClass(terrainClass, x, y, true))
					continue;
				var xLeft 		= plain.hasClass2(terrainClass, x-1, y, true);
				var xRight 		= plain.hasClass2(terrainClass, x+1, y, true);
				var xTop 		= plain.hasClass2(terrainClass, x, y-1, true);
				var xBottom 	= plain.hasClass2(terrainClass, x, y+1, true);
				var xs = ((xLeft?1:0) + (xRight?1:0) + (xBottom?1:0) + (xTop?1:0));
				var i = 0;
				
				var xTopLeft 			= plain.hasClass2(terrainClass, x-1, y-1, true);
				var xTopRight 			= plain.hasClass2(terrainClass, x+1, y-1, true);
				var xBottomRight 		= plain.hasClass2(terrainClass, x+1, y+1, true);
				var xBottomLeft		 	= plain.hasClass2(terrainClass, x-1, y+1, true);
				
				
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
			
				plain.addFloor(objs[i], x, y);
			}
		}
	}
}