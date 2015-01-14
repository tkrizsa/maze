maze = {};


maze.start = function() {

	this.playerPos = new maze.UnitCoords(216,16);
	this.playerId = 'user' + (Math.round(Math.random()*90000) + 10000);
	
	this.map = {};
	this.servers = {};

	this.sectionAdd(this.playerPos.getSectionCoords());

	var thisMaze = this;
	setInterval(function() {
		thisMaze.stepIt();
	}, 100);
}

maze.stepIt = function() {
	for (var url in this.servers) {
		this.servers[url].stepIt();
	}

}



/* ==== */

maze.sectionAdd = function(coords) {
	var sectionKey = coords.getKey();
	var existing = this.map[sectionKey];
	if (typeof existing != 'undefined')
		return existing;
	var newSection = new maze.Section(this, coords);
	this.map[sectionKey] = newSection;

	return newSection;
} 

maze.sectionGetServerUrl = function(coords) {
	return 'http://localhost:8091/testapp';
}

maze.serverGet = function(url) {
	var existing = this.servers[url];
	if (typeof existing != 'undefined')
		return existing;
	
	var newServer = new maze.Server(this, url);
	this.servers[url] = newServer;
	
	return newServer;
}



/* ============================== UNIT HELPER CLASSES ================================ */

maze.SectionCoords = function(x, y) {
	this.x = x;
	this.y = y;
}

maze.SectionCoords.prototype.getKey = function() {
	return this.x + '_' + this.y;
}

maze.UnitCoords = function(x, y) {
	this.x = x;
	this.y = y;
}

maze.UnitCoords.prototype.getSectionCoords = function() {
	return new maze.SectionCoords(this.x % 16, this.y % 16);
}



/* ============================== SECTION ================================ */


maze.Section = function(maze, coords) {
	this.maze 	= maze;
	this.coords = coords;
	this.server = maze.serverGet(maze.sectionGetServerUrl(this.coords));
	this.server.sectionAdd(this);
	
}


maze.Section.prototype.getKey = function() {
	return this.coords.getKey();
}

/* ============================== SERVER ================================ */

maze.SERVER_ERROR = -1;
maze.SERVER_OK = 0;
maze.SERVER_INITIAL = 1;
maze.SERVER_SUBSCRIPTION_SENT = 2;

maze.Server = function(maze, url) {
	this.maze = maze;
	this.url = url;
	this.sections = {};
	this.status = maze.SERVER_INITIAL;
	
	this.sock = new SockJS(url);
	this.sock.onopen = function() {
		console.log('open');
	};
	this.sock.onmessage = function(e) {
		console.log('message', e.data);
		$("#log").append(e.data);
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

maze.Server.prototype.sectionAdd = function(section) {
	this.sections[section.getKey()] = section;
	this.subscriptionOk = false;
}

maze.Server.prototype.stepIt = function() {
	if (this.status == maze.SERVER_OK)
		return;
	if (this.status == maze.SERVER_SUBSCRIPTION_SENT)
		return;
		
	if (this.sock.readyState !== SockJS.OPEN)
		return;
		
	this.status = maze.SERVER_SUBSCRIPTION_SENT;
		
	var msg = {
		cmd : 'init',
		sections : [],
		player : {
			id : this.maze.playerId,
			pos : this.maze.playerPos
		}
	};
	
	for (var key in this.sections) {
		msg.sections.push(key);
	}
		
	this.sock.send(JSON.stringify(msg));

}
