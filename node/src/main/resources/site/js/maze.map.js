/* ==================================================== MAPS ================================================ */

Maze.prototype.sectionGetServerUrl = function(section) {
	return 'http://localhost:8091/mazesocket';
}

Maze.prototype.objectGetServerUrl = function(objectId) {
	return 'http://localhost:8091/mazesocket';
}

Maze.prototype.getServer = function(url) {
	var server = this.servers[url];
	if (typeof server == 'undefined') {
		server = new Maze.Server(this, url);
		this.servers[url] = server;
	}
	return server;
}

Maze.prototype.serverSubscribe = function(section) {
	var url = this.sectionGetServerUrl(section);
	var server = this.getServer(url);
	
	server.sectionAdd(section);
	section.server = server;
}

Maze.prototype.getSectionKeyByObj = function(obj) {
	var x = Math.floor(obj.aimTileX / 16);
	var y = Math.floor(obj.aimTileY / 16);
	return obj.plain.plainId+ "#" + x + "#" + y;
}


Maze.prototype.serversStepIt = function() {
	var newSubscribedSections = {};
	
		
		
	if (!this.accessToken) {
		if (this.accessTokenSent)
			return;
			
		var sessionId = this.readCookie("sessionid");
		if (!sessionId) {
			window.location.href = "/";
			return;
		}
			
		var msg = {
			cmd : "getaccesstoken",
			sessionId : sessionId
		};
		var url = this.objectGetServerUrl();
		var server = this.getServer(url);
		if (server.send(msg)) {
			this.accessTokenSent = this.timeNow;
		}
		return;
	}
	
	if (!this.camera || !this.camera.follow)
		return;
	
		
	if (!this.camera.follow.loaded) {
		if (this.camera.follow.loadSent)
			return;
		
		var playerId = this.camera.follow.playerId;
		var msg = {
			cmd : "init",
			playerId : playerId,
			getObjects : [playerId]
		};
		var url = this.objectGetServerUrl(playerId);
		var server = this.getServer(url);
		if (server.send(msg)) {
			this.camera.follow.loadSent = this.timeNow;
		}
		return;
	}
		
		

	var currSecX = Math.floor(this.camera.follow.tileX / this.SECTION_SIZE);
	var currSecY = Math.floor(this.camera.follow.tileY / this.SECTION_SIZE);
	var currPlain = this.camera.follow.plain;
	
	if (!this.heroPlaced) {
		if (!this.plains[this.playerRecord.plainId])
			this.plains[this.playerRecord.plainId] = new Maze.Plain(this, this.playerRecord.plainId);
		currPlain = this.plains[this.playerRecord.plainId]; // temporary!!!!!!!
		currSecX = this.playerRecord.sectionX;
		currSecY = this.playerRecord.sectionY;
	}

	for (var y = -1; y<=1; y++) {
		for (var x = -1; x<=1; x++) {
			var secX = currSecX + x;
			var secY = currSecY + y;
			var key = currPlain.plainId + "#" + secX + "#" + secY;
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
		for (var i in this.objs) {
			var obj = this.objs[i];
			if (obj == this.hero)
				continue;
			var okey = this.getSectionKeyByObj(obj);
			if (okey == key) {
				delete this.objs[i];
			}
		
		}
		
	}
	
	// add new sections
	for (var key in newSubscribedSections) {
		if (this.subscribedSections[key]) {
			newSubscribedSections[key] = this.subscribedSections[key];
			continue;
		}
		var section = new Maze.Section(currPlain, key);
		newSubscribedSections[key] = section;
		this.serverSubscribe(section);
	
	}
	
	// change to new subscribed sections list
	this.subscribedSections = newSubscribedSections;
	
	
	// set player pos
	if (this.hero.plain) {
		var newPlayerSecKey = this.getSectionKeyByObj(this.hero);
		var newPlayerSection = this.subscribedSections[newPlayerSecKey];
		var newPlayerX = this.hero.aimTileX;
		var newPlayerY = this.hero.aimTileY;
		var newPlayerServer = newPlayerSection.server;
		
		if (this.currPlayerServer != newPlayerServer) {
			if (this.currPlayerServer)
				this.currPlayerServer.playerRemove();
			this.currPlayerServer = newPlayerServer;
		}
		newPlayerServer.playerSet(newPlayerSecKey, newPlayerX, newPlayerY);
	}
	
	// step servers
	for (var url in this.servers) {
		var server = this.servers[url];
		server.stepIt();
	}
}






/* ============================================ SERVER ========================================= */



Maze.Server = function(maze, url) {
	var thisServer = this;

	this.maze = maze;
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

Maze.Server.prototype.send = function(omsg) {
	omsg.accessToken = this.maze.accessToken;
	var msg = JSON.stringify(omsg);
	console.log("SENT TO SERVER");
	console.log(msg);
	
	try {
		this.sock.send(msg);
	} catch (ex) {
		console.log("CANNOT SENT PACKAGE:");
		console.log(ex.message);
		return false;
	}

	return true;
}

Maze.Server.prototype.processResponse = function(data) {
	console.log("SERVER RESPONSE : ");
	console.log(data);
	
	if (!data) {
		alert("No data returned from server!");
		return;
	}
	
	if (data.error) {
		switch (data.errorCode) {
			case 100 : 
				delete this.maze.sessionId;
				this.maze.eraseCookie("sessionid");
				window.location.href = "/";
				return;
			break;
		
		}
		alert("Server : " + data.error);
		return;
		
	}
	
	if (data.cmd == "accesstoken") {
		this.maze.hero = new Maze.Obj.Hero(this.maze);
		this.maze.hero.playerId = data.playerId;
		
		this.maze.objs[this.maze.hero.playerId] = this.maze.hero;
		this.maze.accessToken = data.accessToken;
		this.maze.playerRecord.playerId = data.playerId;
		
		this.maze.heroPlaced = false;
		this.maze.camera.follow = this.maze.hero;
		
		return;
	
	}
	
	if (data.cmd != "init")
		return;
		
		
	// If server sent objects
	if (data.objects) {
		var jitems = data.objects;
		for (var i in jitems) {
			var jitem = jitems[i];
			var objectKey = jitem.objectId;
			if (!objectKey)
				objectKey = jitem.playerId;
			var obj = this.maze.objs[objectKey];
			if (!obj) {
				console.log("Unknown object data from server : " + objectKey);
				continue;
			}
			obj.setData(jitem);
		}
	}
		
	
	for (var rsection_key in data.sections) {
		var section = this.maze.subscribedSections[rsection_key];
		if (!section) {
			console.log("section '" + rsection_key + "' not here.");
			continue;
		}
		var isNewSection = !section.loaded;

		var rsection = data.sections[rsection_key];
		
		
		// If server sent uniq objects
		
		/*if (rsection.uniqitems) {
			var jitems = rsection.uniqitems;
			for (var i in jitems) {
				var jitem = jitems[i];
				var objectKey = jitem.objectKey;
				if (!this.maze.objs[objectKey]) {
					var className = jitem.className;
					var obj = new Maze.Obj[className]();
					this.maze.objs[objectKey] = obj;
					obj.plain = section.plain;
					obj.tileX = jitem.tileX;
					obj.tileY = jitem.tileY;
					obj.objectKey = jitem.objectKey;
				}
			}
		}*/
		
		
		
		// If server sent back the item map of section, load it
		if (rsection.objects && rsection.items) {
			section.deSerialize(rsection);
			section.loaded = true;
		}
		
		
		// If server sent the players of the section : 
		if (rsection.players) {
			for (var i in rsection.players) {
				var rplayer = rsection.players[i];
				
				var player = this.maze.objs[rplayer.id];
			
				
				if (rplayer.id == this.maze.hero.playerId) {
					continue;
				}
				if (player) {
					player.walkTo(rplayer.x, rplayer.y);
					player.away = false;
				} else {
					player = new Maze.Obj.Hero(this.maze);
					this.maze.objs[rplayer.id] = player;
					player.playerId = rplayer.id;
					if (!isNewSection && rplayer.fromKey) {
						var fromPlainId = rplayer.fromKey.split("#")[0];
						if (fromPlainId == section.plain.plainId) {
							player.jumpTo(section.plain, rplayer.fromX, rplayer.fromY);
							player.walkTo(rplayer.x, rplayer.y);
						} else {
							player.jumpTo(section.plain, rplayer.x, rplayer.y);
						}
					} else {
						player.jumpTo(section.plain, rplayer.x, rplayer.y);
					}
				}
			}
		}
		
		// If server sent away players from this section, remove them if exists here
		if (rsection.away) {
			for (var i in rsection.away) {
				var away = rsection.away[i];
				var playerId = away.id;
				
				// dont care if i reported disconnected
				if (playerId == this.maze.hero.playerId)
					continue; 
				// dont care if we are subscribed the section where he is away (we'll handle it in that section)
				if (away.key && this.maze.subscribedSections[away.key])
					continue;
					
				// look for player by id
				var player = this.maze.objs[playerId];
				
				// if player found remove it.
				if (player) {
					pckey = this.maze.getSectionKeyByObj(player);
					// we get rid of him, but only when he is in this section now.
					if (pckey == section.getKey()) {
						if (away.key) {
							// if we knows where he left, make him walk away
							var awayPlainId = away.key.split("#")[0];
							if (awayPlainId == section.plain.plainId) {
								player.away = true;
								player.walkTo(away.x, away.y);
							} else {
								player.remove();
							}
						} else {
							player.remove();
						}
						
					}
				} 
			}
		
		
		
		}
	
	}
	
	if (!this.maze.heroPlaced && this.maze.subscribedSections[this.maze.playerRecord.sectionKey]) {
		var section = this.maze.subscribedSections[this.maze.playerRecord.sectionKey]
		this.maze.hero.jumpTo(section.plain, this.maze.playerRecord.x, this.maze.playerRecord.y);
		this.maze.heroPlaced = true;
		
		// if (section.plain.plainId == 'earth') {
			// var gate = new Maze.Obj.Gate(this.maze, 'moon', 2, 3);
			// gate.placeTo(section.plain, -14, 2);
		// } else {
			// var gate = new Maze.Obj.Gate(this.maze, 'earth', -14, 3);
			// gate.placeTo(section.plain, 2, 2);
		// }
		
		
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

	var notLoadedObject = false;
	var msg = {
		cmd : 'init',
		playerId :  this.maze.hero.playerId
	};
	
	for (var objectId in this.maze.objs) {
		
		var obj = this.maze.objs[objectId];
		if (!obj.loaded && !obj.loadSent) {
			notLoadedObject = true;
			if (!msg.getObjects) {
				msg.getObjects = [];
			}
			msg.getObjects.push(objectId);
			obj.loadSent = this.maze.timeNow;
		}
	}


	if (this.playerStatusSent && this.sectionStatusSent && !notLoadedObject)
		return;
		
	if (this.sock.readyState !== SockJS.OPEN)
		return;
		

	
	if (!this.playerStatusSent || !this.sectionStatusSent) {
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
	}
	
	
		
	this.send(msg);

	this.playerStatusSent = true;
	this.sectionStatusSent = true;
}





/* ============================================ MapItem ========================================= */

Maze.MapItem = function(obj, next) {
	if (typeof next == 'undefined')
		next = null;
	this.obj 	= obj;
	this.next 	= next;
}

/* ============================================ Plain ========================================= */
Maze.Plain = function(maze, plainId) {
	this.plainId = plainId;
	this.maze = maze;
}

Maze.Plain.prototype.getSection = function(x, y) {
	var secX = Math.floor(x / this.maze.SECTION_SIZE);
	var secY = Math.floor(y / this.maze.SECTION_SIZE);
	var key = this.plainId + "#" + secX + "#" + secY;

	if (this.maze.subscribedSections[key])
		return this.maze.subscribedSections[key];
	return null;
		
}

Maze.Plain.prototype.itemAt = function(x,y) {
	var section = this.getSection(x,y);
	if (section == null)
		return null;
	return section.itemAt(x, y);
}

Maze.Plain.prototype.addObject = function(obj, tileX, tileY) {
	if (obj.plain) { //unique
		tileX = obj.tileX;
		tileY = obj.tileY;
	}
	
	var section = this.getSection(tileX, tileY);
	if (section != null) {
		section.addObject(obj, tileX, tileY);
	} else {
		// if a remote player walks out of the map and he is 'away' (=we want to get rid of them this way)
		//  remove him!
		if (obj.is('hero') && obj != this.maze.hero && obj.away) {
			obj.remove();
		}
	}
}

//for buildings and multi tile items normal addObject not good, it takes coordinates from object's tileX and tileY
//but if object lays on multiple tiles, it's not the proper way
Maze.Plain.prototype.addObjectMulti = function(obj, tileX, tileY) {
	var section = this.getSection(tileX, tileY);
	if (section != null) {
		section.addObject(obj, tileX, tileY);
	} 
}

Maze.Plain.prototype.addFloor = function(obj, tileX, tileY) {
	var section = this.getSection(tileX, tileY);
	if (section != null)
		section.addFloor(obj, tileX, tileY);

}

Maze.Plain.prototype.removeObject = function(obj, tileX, tileY) {
	if (obj.plain) {  //unique
		tileX = obj.tileX;
		tileY = obj.tileY;
	}
	var section = this.getSection(tileX, tileY);
	if (section != null)
		section.removeObject(obj, tileX, tileY);
}

Maze.Plain.prototype.isBlocking = function(obj, x, y) {
	var section = this.getSection(x, y);
	if (section == null)
		return obj == this.maze.hero; // if no section here, tile is blocking for our hero, but not for other users
	return section.isBlocking(obj, x, y);
	
}

Maze.Plain.prototype.hasClass = function(objClass, x, y, borderIsOk) {
	var section = this.getSection(x, y);
	if (section == null)
		return borderIsOk;
	return section.hasClass(objClass, x, y, borderIsOk);
}

Maze.Plain.prototype.hasClass2 = function(objClass, x, y, borderIsOk) {
	var section = this.getSection(x, y);
	if (section == null)
		return borderIsOk;
	return section.hasClass2(objClass, x, y, borderIsOk);
}



/* ============================================ SECTION ========================================= */
Maze.Section = function(plain, key) {
	this.plain = plain;
	this.key = key;
	this.tileWidth = this.plain.maze.SECTION_SIZE;
	this.tileHeight = this.plain.maze.SECTION_SIZE;
	var off = key.split("#");
	this.offX = parseInt(off[1]) * this.plain.maze.SECTION_SIZE;
	this.offY = parseInt(off[2]) * this.plain.maze.SECTION_SIZE;
	this.loaded = false;
	this.cleanUp();
}

Maze.Section.prototype.cleanUp = function() {
	this.items = new Array();
	for (var y = 0; y < this.tileHeight; y++) {
		this.items[y] = new Array();
		for (var x = 0; x < this.tileWidth; x++) {
			this.items[y][x] = null;
		}
	}

}


Maze.Section.prototype.getKey = function() {
	return this.key;
}

Maze.Section.prototype.itemAt = function(x,y) {
	x = x - this.offX;
	y = y - this.offY;
	if (x<0 || y<0 || x>=this.tileWidth || y>=this.tileHeight)
		return null;
	return this.items[y][x];
}

Maze.Section.prototype.addObject = function(obj, tileX, tileY) {
	tileX -= this.offX;
	tileY -= this.offY;
	
	if (tileX<0 || tileY<0 || tileX>=this.tileWidth || tileY>=this.tileHeight)
		 return;
	
	var olditem = this.items[tileY][tileX];
	var item = new Maze.MapItem(obj);
	
	if (olditem == null) {
		this.items[tileY][tileX] = item;
	} else {
		while(olditem.next != null) {
			olditem = olditem.next;
		}
		olditem.next = item;
	}
}

Maze.Section.prototype.addFloor = function(obj, tileX, tileY) {
	tileX -= this.offX;
	tileY -= this.offY;

	if (tileX<0 || tileY<0 || tileX>=this.tileWidth || tileY>=this.tileHeight)
		return;
	
	var olditem = this.items[tileY][tileX];
	
	
	if (olditem == null) {
		this.items[tileY][tileX] = new Maze.MapItem(obj);
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
		olditem.next = new Maze.MapItem(obj);
	}
}

Maze.Section.prototype.removeObject = function(obj, tileX, tileY) {
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

Maze.Section.prototype.isBlocking = function(obj, x, y) {
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

Maze.Section.prototype.hasClass = function(objClass, x, y, borderIsOk) {
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

Maze.Section.prototype.hasClass2 = function(objClass, x, y, borderIsOk) {
	x -= this.offX;
	y -= this.offY;
	if (borderIsOk !== true) borderIsOk = false;
	if (x<0 || y<0 || x>=this.tileWidth || y>=this.tileHeight)
		return borderIsOk;
		
	var item = this.itemAt(x + this.offX, y + this.offY);
	while (item != null) {
		if (item.obj.ancestors && item.obj.ancestors[objClass])
			return true;
		if (objClass == 'SwampFloor2' && item.obj.ancestors && item.obj.ancestors['SwampWaterFloor']) return true;
		if (objClass == 'SwampFloor' && item.obj.ancestors && item.obj.ancestors['SwampFloor2']) return true;
		if (objClass == 'SandFloor' && item.obj.ancestors && item.obj.ancestors['SandFloor2']) return true;
		if (objClass == 'SandFloor' && item.obj.ancestors && item.obj.ancestors['WaterFloor']) 	return true;
		if (objClass == 'RockFloor' && item.obj.ancestors && item.obj.ancestors['RockFloor2'])	return true;
		if (objClass == 'WaterFloor' && item.obj.ancestors && item.obj.ancestors['WaterFloor2'])	return true;
		if (objClass == 'RockFloor2' && item.obj.ancestors && item.obj.ancestors['SnowFloor'])			return true;
		if (objClass == 'RockFloor' && item.obj.ancestors && (item.obj.className == 'TileFloor1' || item.obj.className == 'TileFloor2' || item.obj.className == 'TileFloor3'))
			return true;
		item = item.next;
	}
	return false;
}

/* ==================================================== EXPORT / IMPORT ================================================ */
Maze.Section.prototype.deSerialize = function(result) {
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
					if (className.indexOf("#")<0) {
						obj = this.plain.maze[className.toUpperCase()];
						if (obj == null) {
							alert("invalid classname : " + (className?className:"NULL"));
							continue;
						}
						if (obj.constructor === Array) { // if array..
							obj = obj[0];
						}
					} else {
						var objar = className.split("#");
						var className = objar[0];
						var objectKey = objar[1];
						obj = this.plain.maze.objs[objectKey];
						if (!obj) {
							// console.log("Object missing : " + result.objects[items[i]]);
							// continue;
							obj = new Maze.Obj[className](this);
							obj.objectKey = objectKey;
							obj.plain = this.plain;
							this.plain.maze.objs[objectKey] = obj;
						}
					}
				} else {
					alert("Invalid item : " + items[i]);
					continue;
					// className = result.objects[items[i]._ix];
					// obj = new Maze.Obj[className]();
					// obj.plain = this;
					// obj.tileX = this.offX + x;
					// obj.tileY = this.offY + y;
					// obj.setMapData(items[i]);
				}
				
				
				this.addObject(obj, x + this.offX, y + this.offY);
			}
			
	
	
			xy++;
		}
	}
	// this.plain.maze.drawTerrainCorrect(this.plain, 'SandFloor');
	// this.plain.maze.drawTerrainCorrect(this.plain, 'WaterFloor');
	// this.plain.maze.drawTerrainCorrect(this.plain, 'RockFloor');	
	this.plain.maze.drawTerrainCorrectAll(this.plain);	
	
	for (var i in saveObjects) {
		var obj = saveObjects[i];
		this.plain.addObject(obj);
	}
}

Maze.Section.prototype.serialize = function() {
	var objects = new Array();
	var items = new Array();
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
			items.push(tileRes);
		}
	}
	var result = {
		objects : objects,
		items : items
	}
	return JSON.stringify(result);

}
