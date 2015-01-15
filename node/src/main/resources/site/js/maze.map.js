Maze.SECTION_SIZE = 16;


Maze.Map = function(maze) {
	this.maze = maze;
	
	/*this.FLOOR 		= maze.GRASSFLOOR;
	this.FLOOR2 	= maze.TILEFLOOR1;
	this.WALL  		= maze.BRICKWALL1;
	this.TREE1  	= maze.TREE1;
	this.TREE2  	= maze.TREE2;*/
	
	this.servers = {};		// list of servers referenced by url
	this.subscribedSections = {};
	this.currPlayerServer = false;
	this.levels = new Array();
}

// MAPITEM
Maze.Map.MapItem = function(obj, next) {
	if (typeof next == 'undefined')
		next = null;
	this.obj 	= obj;
	this.next 	= next;
}


Maze.Map.prototype.create = function() {
	
	this.levels[0] = new Maze.Map.Level(this, 30, 30);

	//var mapData = $('#mapdata').val();
	//this.levels[0].deSerialize(mapData);
	
	
}


Maze.Map.prototype.sectionGetServerUrl = function(section) {
	return 'http://localhost:8091/testapp';
}

Maze.Map.prototype.serverSubscribe = function(section) {
	var url = this.sectionGetServerUrl(section);
	var server = this.servers[url];
	if (typeof server == 'undefined') {

		server = new Maze.Server(this.maze, this, url);
		this.servers[url] = server;
	}
	
	server.sectionAdd(section);
	section.server = server;
}

Maze.Map.prototype.getSectionKeyByObj = function(obj) {
	var x = Math.floor(obj.aimTileX / 16);
	var y = Math.floor(obj.aimTileY / 16);
	return x + "_" + y;
}


Maze.Map.prototype.stepIt = function() {
	var newSubscribedSections = {};
	
	if (!this.maze.camera || !this.maze.camera.follow)
		return;

	var currSecX = Math.floor(this.maze.camera.follow.aimTileX / Maze.SECTION_SIZE);
	var currSecY = Math.floor(this.maze.camera.follow.aimTileY / Maze.SECTION_SIZE);
	var currLevel = this.maze.camera.follow.level;
	
	if (!currLevel) {
		currLevel = this.levels[0]; // temporary!!!!!!!
		currSecX = 0;
		currSecY = 0;
	}

	for (var y = -1; y<=1; y++) {
		for (var x = -1; x<=1; x++) {
			var secX = currSecX + x;
			var secY = currSecY + y;
			var key = secX + "_" + secY;
			newSubscribedSections[key] = true;
		}
	}
	
	// remove not used sections
	for (var key in this.subscribedSections) {
		if (newSubscribedSections[key]) 
			continue;
		var section = this.subscribedSections[key];
		var server = section.server;
		server.sectionRemove(section);
		// remove users from this section
		for (var i in this.maze.objs) {
			var obj = this.maze.objs[i];
			if (obj == this.maze.hero)
				continue;
			var okey = this.getSectionKeyByObj(obj);
			if (okey == key) {
				delete this.maze.objs[i];
			}
		
		}
		
	}
	
	// add new sections
	for (var key in newSubscribedSections) {
		if (this.subscribedSections[key]) {
			newSubscribedSections[key] = this.subscribedSections[key];
			continue;
		}
		var section = new Maze.Map.Section(currLevel, key);
		newSubscribedSections[key] = section;
		this.serverSubscribe(section);
	
	}
	
	// change to new subscribed sections list
	this.subscribedSections = newSubscribedSections;
	
	
	// set player pos
	var newPlayerSecKey = this.getSectionKeyByObj(this.maze.hero);
	var newPlayerSection = this.subscribedSections[newPlayerSecKey];
	var newPlayerX = this.maze.hero.aimTileX;
	var newPlayerY = this.maze.hero.aimTileY;
	var newPlayerServer = newPlayerSection.server;
	
	if (this.currPlayerServer != newPlayerServer) {
		if (this.currPlayerServer)
			this.currPlayerServer.playerRemove();
		this.currPlayerServer = newPlayerServer;
	}
	newPlayerServer.playerSet(newPlayerSecKey, newPlayerX, newPlayerY);
	
	// step servers
	for (var url in this.servers) {
		var server = this.servers[url];
		server.stepIt();
	}
}

/* ============================================ SERVER ========================================= */



Maze.Server = function(maze, map, url) {
	var thisServer = this;

	this.maze = maze;
	this.map = map;
	this.url = url;
	
	// last sent player status
	this.playerKey = false;
	this.playerX = false;
	this.playerY = false;
	// if player status sent to server
	this.playerStatusSent = true;
	
	// current subscribed sections
	this.sections = {};
	// if sections are sent to server
	this.sectionStatusSent = true;
	
	this.sock = new SockJS(url);
	this.sock.onopen = function() {
		console.log('open');
	};
	this.sock.onmessage = function(e) {
		//console.log('message', e.data);
		//$("#log").append(e.data);
		var data;
		try {
			data = JSON.parse(e.data);
		} catch (ex) {
			console.log(ex);
			return;
		}
		thisServer.processResponse(data);
		
	};
	this.sock.onclose = function() {
		console.log('close');
	};	
}

Maze.Server.prototype.processResponse = function(data) {
	console.log("SERVER RESPONSE : ");
	console.log(data);
	
	for (var rsection_key in data.sections) {
		var section = this.map.subscribedSections[rsection_key];
		if (!section) {
			console.log("section '" + rsection_key + "' not here.");
			continue;
		}
		// if (section.loaded)
			// continue;
		var rsection = data.sections[rsection_key];
		
		
		// If server sent back the item map of section, load it
		if (rsection.objects && rsection.items) {
			section.deSerialize(rsection);
			section.loaded = true;
		}
		
		
		// If server sent the players of the section : 
		if (rsection.players) {
			for (var i in rsection.players) {
				var rplayer = rsection.players[i];
				if (rplayer.id == this.maze.playerId) {
					if (!this.maze.heroPlaced) {
						this.maze.heroPlaced = true;
						this.maze.hero.jumpTo(section.level, 5, 5);
					}
					continue;
				}
				var player = false;
				for (var j in this.maze.objs) {
					if (this.maze.objs[j].playerId == rplayer.id) {
						player = this.maze.objs[j];
						break;
					}
				}
				if (player) {
					player.walkTo(rplayer.x, rplayer.y);
				} else {
					player = new Maze.Obj.Hero(this.maze);
					this.maze.objs.push(player);
					player.playerId = rplayer.id;
					player.jumpTo(section.level, rplayer.x, rplayer.y);
				}
			}
		}
		
		// If server sent away players from this section, remove them if exists here
		if (rsection.away) {
			for (var i in rsection.away) {
				var away = rsection.away[i];
				var playerId = away.id;
				
				// dont care if i reported disconnected
				if (playerId == this.maze.playerId)
					continue; 
				// dont care if we are subscribed the section where he is away (we'll handle it in that section)
				if (away.key && this.map.subscribedSections[away.key])
					continue;
					
				// look for player by id
				var player = false;
				for (var j in this.maze.objs) {
					if (this.maze.objs[j].playerId == playerId) {
						player = this.maze.objs[j];
						break;
					}
				}
				
				// if player found remove it.
				if (player) {
					pckey = this.map.getSectionKeyByObj(player);
					// we get rid of him only when he is in this section 
					if (pckey == section.getKey()) {
						player.remove();
						delete this.maze.objs[j];
					}
				} 
			}
		
		
		
		}
	
	}
	console.log("------");
}

Maze.Server.prototype.playerSet = function(key, x, y) {
	if (this.playerKey === key && this.playerX === x && this.playerY === y)
		return;
	this.playerKey = key;
	this.playerX = x;
	this.playerY = y;
	this.playerStatusSent = false;
}

Maze.Server.prototype.playerRemove = function() {
	if (this.playerKey === false && this.playerX === false && this.playerY === false)
		return;
	this.playerKey = false;
	this.playerX = false;
	this.playerY = false;
	this.playerStatusSent = false;
}

Maze.Server.prototype.sectionAdd = function(section) {
	this.sections[section.getKey()] = section;
	this.sectionStatusSent = false;
}

Maze.Server.prototype.sectionRemove = function(section) {
	delete this.sections[section.getKey()];
	this.sectionStatusSent = false;
}

Maze.Server.prototype.stepIt = function() {
	if (this.playerStatusSent && this.sectionStatusSent)
		return;
		
	if (this.sock.readyState !== SockJS.OPEN)
		return;
		
	var msg = {
		cmd : 'init',
		player : {
			id : this.maze.playerId
		}
	};

	
	if (this.playerKey !== false) {
		msg.playerPos = {
			key : this.playerKey,
			x : this.playerX,
			y : this.playerY
		}
	}
	
	
	if (!this.sectionStatusSent) {
		msg.subscribe = new Array();
		for (var key in this.sections) {
			var section = this.sections[key];
			var x = {key : key};
			if (!section.loaded) {
				x.mapNeeded = true;
			}
			msg.subscribe.push(x);
		}
	}
	
		
	console.log("SENT TO SERVER");
	console.log(msg);
	this.sock.send(JSON.stringify(msg));

	this.playerStatusSent = true;
	this.sectionStatusSent = true;
}





/* ============================================ LEVEL ========================================= */
Maze.Map.Level = function(map) {
	this.map = map;
}

Maze.Map.Level.prototype.getSection = function(x, y) {
	var secX = Math.floor(x / Maze.SECTION_SIZE);
	var secY = Math.floor(y / Maze.SECTION_SIZE);
	var key = secX + "_" + secY;

	if (this.map.subscribedSections[key])
		return this.map.subscribedSections[key];
	return null;
		
}

Maze.Map.Level.prototype.itemAt = function(x,y) {
	var section = this.getSection(x,y);
	if (section == null)
		return null;
	return section.itemAt(x, y);
}

Maze.Map.Level.prototype.addObject = function(obj, tileX, tileY) {
	if (obj.level) { //unique
		tileX = obj.tileX;
		tileY = obj.tileY;
	}
	
	var section = this.getSection(tileX, tileY);
	if (section != null)
		section.addObject(obj, tileX, tileY);

}

Maze.Map.Level.prototype.addFloor = function(obj, tileX, tileY) {
	var section = this.getSection(tileX, tileY);
	if (section != null)
		section.addFloor(obj, tileX, tileY);

}

Maze.Map.Level.prototype.removeObject = function(obj, tileX, tileY) {
	if (obj.level) {  //unique
		tileX = obj.tileX;
		tileY = obj.tileY;
	}
	var section = this.getSection(tileX, tileY);
	if (section != null)
		section.removeObject(obj, tileX, tileY);
}

Maze.Map.Level.prototype.isBlocking = function(obj, x, y) {
	var section = this.getSection(x, y);
	if (section == null)
		return true;
	return section.isBlocking(obj, x, y);
	
}

Maze.Map.Level.prototype.hasClass = function(objClass, x, y, borderIsOk) {
	var section = this.getSection(x, y);
	if (section == null)
		return borderIsOk;
	return section.hasClass(objClass, x, y, borderIsOk);
}

Maze.Map.Level.prototype.hasClass2 = function(objClass, x, y, borderIsOk) {
	var section = this.getSection(x, y);
	if (section == null)
		return borderIsOk;
	return section.hasClass2(objClass, x, y, borderIsOk);
}



/* ============================================ SECTION ========================================= */
Maze.Map.Section = function(level, key) {
	this.level = level;
	this.key = key;
	this.tileWidth = Maze.SECTION_SIZE;
	this.tileHeight = Maze.SECTION_SIZE;
	var off = key.split('_');
	this.offX = parseInt(off[0]) * Maze.SECTION_SIZE;
	this.offY = parseInt(off[1]) * Maze.SECTION_SIZE;
	this.loaded = false;
	this.cleanUp();
}

Maze.Map.Section.prototype.cleanUp = function() {
	this.items = new Array();
	for (var y = 0; y < this.tileHeight; y++) {
		this.items[y] = new Array();
		for (var x = 0; x < this.tileWidth; x++) {
			this.items[y][x] = null;
		}
	}

}


Maze.Map.Section.prototype.getKey = function() {
	return this.key;
}

Maze.Map.Section.prototype.itemAt = function(x,y) {
	x = x - this.offX;
	y = y - this.offY;
	if (x<0 || y<0 || x>=this.tileWidth || y>=this.tileHeight)
		return null;
	return this.items[y][x];
}

Maze.Map.Section.prototype.addObject = function(obj, tileX, tileY) {
	tileX -= this.offX;
	tileY -= this.offY;
	
	if (tileX<0 || tileY<0 || tileX>=this.tileWidth || tileY>=this.tileHeight)
		 return;
	
	var olditem = this.items[tileY][tileX];
	var item = new Maze.Map.MapItem(obj);
	
	if (olditem == null) {
		this.items[tileY][tileX] = item;
	} else {
		while(olditem.next != null) {
			olditem = olditem.next;
		}
		olditem.next = item;
	}
}

Maze.Map.Section.prototype.addFloor = function(obj, tileX, tileY) {
	tileX -= this.offX;
	tileY -= this.offY;

	if (tileX<0 || tileY<0 || tileX>=this.tileWidth || tileY>=this.tileHeight)
		return;
	
	var olditem = this.items[tileY][tileX];
	
	
	if (olditem == null) {
		this.items[tileY][tileX] = new Maze.Map.MapItem(obj);
	} else {
		while(true) {
			if (olditem.obj.ancestors.Floor) {
				olditem.obj = obj;
				return;
			}
			if (!olditem.next)
				break;
			olditem = olditem.next;
		}
		olditem.next = new Maze.Map.MapItem(obj);
	}
}

Maze.Map.Section.prototype.removeObject = function(obj, tileX, tileY) {
	tileX -= this.offX;
	tileY -= this.offY;
	
	if (tileX<0 || tileY<0 || tileX>=this.tileWidth || tileY>=this.tileHeight)
		return;
	
	var xItem = this.items[tileY][tileX];
	if (xItem == null)
		return;
	if (xItem.obj == obj) {
		this.items[tileY][tileX] = xItem.next;
	} else {
		while (xItem.next != null) {
			if (xItem.next.obj == obj) {
				xItem.next = xItem.next.next;
				break;
			}
			xItem = xItem.next;
		}
	}
}

Maze.Map.Section.prototype.isBlocking = function(obj, x, y) {
	x -= this.offX;
	y -= this.offY;
	
	if (x<0 || y<0 || x>=this.tileWidth || y>=this.tileHeight)
		return true;
		
	var item = this.itemAt(x + this.offX, y + this.offY);
	while (item != null) {
		if (item != obj && item.obj.isBlocking(obj))
			return true;
		item = item.next;
	}
	return false;
}

Maze.Map.Section.prototype.hasClass = function(objClass, x, y, borderIsOk) {
	x -= this.offX;
	y -= this.offY;

	if (borderIsOk !== true) borderIsOk = false;
	if (x<0 || y<0 || x>=this.tileWidth || y>=this.tileHeight)
		return borderIsOk;
		
	var item = this.itemAt(x + this.offX, y + this.offY);
	while (item != null) {
		if (item.obj.ancestors && item.obj.ancestors[objClass])
			return true;
		item = item.next;
	}
	return false;
}

Maze.Map.Section.prototype.hasClass2 = function(objClass, x, y, borderIsOk) {
	x -= this.offX;
	y -= this.offY;
	if (borderIsOk !== true) borderIsOk = false;
	if (x<0 || y<0 || x>=this.tileWidth || y>=this.tileHeight)
		return borderIsOk;
		
	var item = this.itemAt(x + this.offX, y + this.offY);
	while (item != null) {
		if (item.obj.ancestors && item.obj.ancestors[objClass])
			return true;
		if (objClass == 'SandFloor' && item.obj.ancestors && item.obj.ancestors['WaterFloor'])
			return true;
		if (objClass == 'RockFloor' && item.obj.ancestors && (item.obj.className == 'TileFloor1' || item.obj.className == 'TileFloor2' || item.obj.className == 'TileFloor3'))
			return true;
		item = item.next;
	}
	return false;
}

/* ==================================================== EXPORT / IMPORT ================================================ */
Maze.Map.Section.prototype.deSerialize = function(result) {
	var saveObjects = [];
	for (var y = 0; y < this.tileHeight; y++) {
		for (var x = 0; x < this.tileWidth; x++) {
			var item = this.itemAt(x + this.offX, y + this.offY);
			while (item != null) {
				if (!item.obj.mapPart) {
					saveObjects.push(item.obj);
				}
				item = item.next;
			}
		}
	}
	
	this.cleanUp();
	var xy = 0;
	for (var y = 0; y < this.tileHeight; y++) {
		for (var x = 0; x < this.tileWidth; x++) {
			var items = result.items[xy];
			for (var i in items) {
				var className = '';
				var obj;
				if (typeof items[i] == 'number') {
					className = result.objects[items[i]];
					obj = this.level.map.maze[className.toUpperCase()];
					if (!obj.isBlocking) {
						obj = obj[0];
					}
				} else {
					className = result.objects[items[i].CI];
					obj = this.level.map.maze[className.toUpperCase()];
					if (!obj.isBlocking) {
						obj = obj[0];
					}
				}
				
				
				this.addObject(obj, x + this.offX, y + this.offY);
			}
			
	
	
			xy++;
		}
	}
	this.level.map.maze.drawTerrainCorrect(this.level, 'SandFloor');
	this.level.map.maze.drawTerrainCorrect(this.level, 'WaterFloor');
	this.level.map.maze.drawTerrainCorrect(this.level, 'RockFloor');	
	
	for (var i in saveObjects) {
		var obj = saveObjects[i];
		this.level.addObject(obj);
	}
}

Maze.Map.Section.prototype.serialize = function() {
	var objects = new Array();
	var map = new Array();
	for (var y = 0; y < this.tileHeight; y++) {
		for (var x = 0; x < this.tileWidth; x++) {
			var tileRes = new Array();
			var item = this.itemAt(x, y);
			while (item != null) {
				if (item.obj.mapPart && objects.indexOf(item.obj.className) < 0) {
					objects.push(item.obj.className);
				}
				var classIx = objects.indexOf(item.obj.className);
				if (classIx>=0) {
					var data = {};
					item.obj.trigger('serialize', data);
					var pc = 0;
					for (var p in data)
						if (data.hasOwnProperty(p))
							pc++;
					if (pc <= 0) {
						tileRes.push(classIx);
					} else {
						data.CI = classIx;
						tileRes.push(data);
					}
				}
				item = item.next;
			}
			map.push(tileRes);
		}
	}
	var result = {
		objects : objects,
		map : map
	}
	return JSON.stringify(result);

}
