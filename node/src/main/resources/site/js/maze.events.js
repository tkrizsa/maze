Maze.EventOwner = function() {};

Maze.EventOwner.extend = function(obj) {
	obj.events = {};
	
	obj.bind 		= Maze.EventOwner.bind;
	obj.trigger		= Maze.EventOwner.trigger;
	obj.triggerObj	= Maze.EventOwner.triggerObj;
}

Maze.EventOwner.bind = function(event, handler) {
	if (typeof handler != 'function') {
		throw "Handler is not a function";
	}
	var hl = this.events[event];
	if (typeof hl == 'undefined') {
		hl = new Array();
		this.events[event] = hl;
	}
	hl.push(handler);
}

Maze.EventOwner.trigger = function(event, p0, p1, p2, p3) {
	var hl = this.events[event];
	if (!hl)
		return;
	for (var i in hl) {
		var h = hl[i];
		var res = h.call(this, p0, p1, p2, p3);
		if (res === true)
			break;
	}
}

Maze.EventOwner.triggerObj = function(obj, event, p0, p1, p2, p3) {
	var hl = this.events[event];
	if (!hl)
		return;
	for (var i in hl) {
		var h = hl[i];
		var res = h.call(obj, p0, p1, p2, p3);
		if (res === true)
			break;
	}
}

