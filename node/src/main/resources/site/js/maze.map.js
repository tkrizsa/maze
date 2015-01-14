Maze.SECTION_SIZE = 16;


Maze.Map = function(maze) {
	this.maze = maze;
	this.FLOOR 		= maze.GRASSFLOOR;
	this.FLOOR2 	= maze.TILEFLOOR1;
	this.WALL  		= maze.BRICKWALL1;
	this.TREE1  	= maze.TREE1;
	this.TREE2  	= maze.TREE2;
	
	this.servers = {};		// list of servers referenced by url
}

// MAPITEM
Maze.Map.MapItem = function(obj, next) {
	if (typeof next == 'undefined')
		next = null;
	this.obj 	= obj;
	this.next 	= next;
}


Maze.Map.prototype.create = function() {
	this.levels = new Array();
	this.levels[0] = new Maze.Map.Level(this, 30, 30);

	var mapData = $('#mapdata').val();
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

Maze.Map.prototype.stepIt = function() {
	for (var url in this.servers) {
		var server = this.servers[url];
		server.stepIt();
	}
}

/* ============================================ SERVER ========================================= */


Maze.SERVER_ERROR = -1;
Maze.SERVER_OK = 0;
Maze.SERVER_INVALID = 1;
Maze.SERVER_SUBSCRIPTION_SENT = 2;

Maze.Server = function(maze, map, url) {
	var thisServer = this;

	this.maze = maze;
	this.map = map;
	this.url = url;
	this.sections = {};
	this.status = Maze.SERVER_OK;
	
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
	
	/*function send(message) {
		if (sock.readyState === SockJS.OPEN) {
			console.log("sending message")
		sock.send(message);
	} else {
		console.log("The socket is not open.");
	}
	}
	function xclose() {
	sock.close();
	}*/
	
	
}

Maze.Server.prototype.processResponse = function(data) {
	console.log("SERVER RESPONSE : ");
	console.log(data);
	for (var rsection_key in data.sections) {
		console.log(rsection_key);
		var level = this.map.levels[0]; // ??
		var section = level.sections[rsection_key];
		if (!section) {
			console.log("-> not here.");
			continue;
		}
		// if (section.loaded)
			// continue;
		var rsection = data.sections[rsection_key];
		section.deSerialize(rsection);
		section.loaded = true;
	
	}
	console.log("------");
}

Maze.Server.prototype.sectionAdd = function(section) {
	this.sections[section.getKey()] = section;
	this.status = Maze.SERVER_INVALID;
}

Maze.Server.prototype.stepIt = function() {
	if (this.status == Maze.SERVER_OK)
		return;
	if (this.status == Maze.SERVER_SUBSCRIPTION_SENT)
		return;
		
	if (this.sock.readyState !== SockJS.OPEN)
		return;
		
	this.status = Maze.SERVER_SUBSCRIPTION_SENT;
		
	var msg = {
		cmd : 'init',
		sections : [],
		player : {
			id : this.maze.playerId,
			pos : {x : this.maze.hero.tileX, y : this.maze.hero.tileY}
		}
	};
	
	console.log("SEND SUBSCRIPT : " );
	
	for (var key in this.sections) {
		msg.sections.push(key);
		console.log(key);
	}
	
	console.log("-----");
		
	this.sock.send(JSON.stringify(msg));

}





/* ============================================ LEVEL ========================================= */
Maze.Map.Level = function(map) {
	this.map = map;
	this.sections = {};
}

Maze.Map.Level.prototype.getSection = function(x, y) {
	var secX = Math.floor(x / Maze.SECTION_SIZE);
	var secY = Math.floor(y / Maze.SECTION_SIZE);
	var key = secX + "_" + secY;

	if (typeof this.sections[key] != 'undefined')
		return this.sections[key];
	var sec = new Maze.Map.Section(this, key, secX * Maze.SECTION_SIZE, secY * Maze.SECTION_SIZE);
	this.sections[key] = sec;
	
	this.map.serverSubscribe(sec);
	
	return sec;

}

Maze.Map.Level.prototype.itemAt = function(x,y) {
	var section = this.getSection(x,y);
	return section.itemAt(x, y);
}

Maze.Map.Level.prototype.addObject = function(obj, tileX, tileY) {
	if (obj.level) { //unique
		tileX = obj.tileX;
		tileY = obj.tileY;
	}
	
	var section = this.getSection(tileX, tileY);
	section.addObject(obj, tileX, tileY);

}

Maze.Map.Level.prototype.addFloor = function(obj, tileX, tileY) {
	var section = this.getSection(tileX, tileY);
	section.addFloor(obj, tileX, tileY);

}

Maze.Map.Level.prototype.removeObject = function(obj, tileX, tileY) {
	if (obj.level) {  //unique
		tileX = obj.tileX;
		tileY = obj.tileY;
	}
	var section = this.getSection(tileX, tileY);
	section.removeObject(obj, tileX, tileY);
}

Maze.Map.Level.prototype.isBlocking = function(obj, x, y) {
	var section = this.getSection(x, y);
	return section.isBlocking(obj, x, y);
	
}

Maze.Map.Level.prototype.hasClass = function(objClass, x, y, borderIsOk) {
	var section = this.getSection(x, y);
	return section.hasClass(objClass, x, y, borderIsOk);
}

Maze.Map.Level.prototype.hasClass2 = function(objClass, x, y, borderIsOk) {
	var section = this.getSection(x, y);
	return section.hasClass2(objClass, x, y, borderIsOk);
}



/* ============================================ SECTION ========================================= */
Maze.Map.Section = function(level, key, offX, offY) {
	this.level = level;
	this.key = key;
	this.tileWidth = Maze.SECTION_SIZE;
	this.tileHeight = Maze.SECTION_SIZE;
	this.offX = offX;
	this.offY = offY;
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
	//var result = JSON.parse(mapData);

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
