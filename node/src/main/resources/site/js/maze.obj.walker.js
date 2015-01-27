Maze.Obj.Blur = function(obj) {
	Maze.Obj.extend(this);
	this.ancestors.blur = true;
	this.className = 'Blur';
	this.mapPart = false;

	Maze.Obj.Uniq.extend(this);
	
	

	this.obj = obj;
	//this.drawPhase = 1;
	this.bind('drawIt', this.blurDrawIt);
}

Maze.Obj.Blur.prototype.blurDrawIt = function(cam, left, top) {
	return;
	cam.ctx.beginPath();
	cam.ctx.rect(
		left, 
		top, 
		cam.TILE_WIDTH, 
		cam.TILE_HEIGHT
		);
		
	cam.ctx.fillStyle = 'rgba(10,160,10,0.3)';
	cam.ctx.fill();
	
}


// ================================================================ WALKER =================================================

Maze.Obj.Walker = {};
Maze.Obj.Walker.extend = function(obj) {
	obj.ancestors.walker = true;
	
	obj.walking 		= false;
	obj.aimObject 		= null;
	obj.aimTileX 		= obj.tileX;
	obj.aimTileY 		= obj.tileY;
	obj.offsetX 		= 0.0;
	obj.offsetY 		= 0.0;
	obj.offsetSize 		= 0.0;
	obj.speed 			= 0.30; // sec / tile 0.30
	obj.lastStep 		= obj.maze.timeNow;
	
	obj.dir 			= 0; // south
	obj.dirRad 			= 0.0;
	
	
	obj.blur = new Maze.Obj.Blur(obj);

	
	
	obj.jumpTo 			= Maze.Obj.Walker.jumpTo;
	obj.walkTo 			= Maze.Obj.Walker.walkTo;
	obj.walkToObj		= Maze.Obj.Walker.walkToObj;
	obj.walkerStepIt 	= Maze.Obj.Walker.walkerStepIt;
	obj.stopWalk 		= Maze.Obj.Walker.stopWalk;
	obj.cancelWalk 		= Maze.Obj.Walker.cancelWalk;
	obj.findPath 		= Maze.Obj.Walker.findPath;
	obj.neighbours 		= Maze.Obj.Walker.neighbours;
	obj.findAimPosition	= Maze.Obj.Walker.findAimPosition;
	obj.turn			= Maze.Obj.Walker.turn;
	obj.move			= Maze.Obj.Walker.move;
	obj.getMove			= Maze.Obj.Walker.getMove;
	obj.getNeighbours   = Maze.Obj.Walker.getNeighbours;
	obj.blurFollow   	= Maze.Obj.Walker.blurFollow;
	obj.remove 		  	= Maze.Obj.Walker.remove;
	
	
	obj.bind('stepIt', obj.walkerStepIt);
}




Maze.Obj.Walker.blurFollow = function() {
	this.plain.removeObject(this.blur);
	this.blur.plain = this.plain;
	this.blur.tileX = this.tileX;
	this.blur.tileY = this.tileY;
	this.blur.plain.addObject(this.blur);
}

Maze.Obj.Walker.remove = function() {
	this.plain.removeObject(this);
	this.blur.plain.removeObject(this.blur);
	this.maze.objRemove(this);
}

Maze.Obj.Walker.jumpTo = function(plain, tileX, tileY) {
	if (this.plain) {
		this.plain.removeObject(this);
		this.plain.removeObject(this.blur);
	}
	this.plain = plain;
	this.tileX = tileX;
	this.tileY = tileY;
	this.aimTileX = this.tileX;
	this.aimTileY = this.tileY;
	this.aimObject = null;
	this.offsetX = 0.0;
	this.offsetY = 0.0;
	this.offsetSize = 0.0;
	
	this.blur.plain = plain;
	this.blur.tileX = tileX;
	this.blur.tileY = tileY;
	
	this.plain.addObject(this);	
	this.plain.addObject(this.blur);	
}


Maze.Obj.Walker.walkTo = function(tileX, tileY) {
	this.aimTileX = tileX;
	this.aimTileY = tileY;
	this.aimObject = null;
}

Maze.Obj.Walker.walkToObj = function(obj) {
	this.aimTileX = obj.tileX;
	this.aimTileY = obj.tileY;
	this.aimObject = obj;
}

Maze.Obj.Walker.walkerStepIt = function() {
	if (!this.plain)
		return;

	if (this.offsetSize > 0.0) {
		this.offsetSize = 1.0 - ((this.maze.timeNow - this.lastStep) / (this.speed * 1000));
		if (this.offsetSize <= 0.0) {
			this.offsetSize = 0.0;
			this.walking = true; //????
		}
	}

	if (this.maze.timeNow - this.lastStep < this.speed * 1000)
		return; // still animating...
		
	this.blurFollow();
	
	
	
		
	if (this.aimObject != null) {
		this.aimTileX = this.aimObject.tileX;
		this.aimTileY = this.aimObject.tileY;
	}
	
	if (this.dead)
		return;

	var newX = this.tileX;
	var newY = this.tileY;
	
	
	
	if (this.tileX != this.aimTileX || this.tileY != this.aimTileY) {
		// this.maze.timerStart('findpath');
		this.path = this.findPath();
		// this.maze.timerStop('findpath');
		if (this.path && this.path[1]) {
			newX = this.path[1][0];
			newY = this.path[1][1];
			this.offsetX = 0.0;
			if (newX > this.tileX) this.offsetX = -1.0;
			if (newX < this.tileX) this.offsetX = +1.0;
			this.offsetY = 0.0;
			if (newY > this.tileY) this.offsetY = -1.0;
			if (newY < this.tileY) this.offsetY = +1.0;
		}
	}
	

	if (newX != this.tileX || newY != this.tileY) {
	
		if (this.plain.isBlocking(this, newX, newY)) {
			this.stopWalk();
			return;
		}
		
		this.dir = 0;
		
				if (newX == this.tileX + 1	&& newY == this.tileY + 1) {this.dir = 1;}
		else 	if (newX == this.tileX + 1	&& newY == this.tileY + 0) {this.dir = 2;}
		else 	if (newX == this.tileX + 1	&& newY == this.tileY - 1) {this.dir = 3;}
		else 	if (newX == this.tileX + 0	&& newY == this.tileY - 1) {this.dir = 4;}
		else 	if (newX == this.tileX - 1	&& newY == this.tileY - 1) {this.dir = 5;}
		else 	if (newX == this.tileX - 1	&& newY == this.tileY - 0) {this.dir = 6;}
		else 	if (newX == this.tileX - 1	&& newY == this.tileY + 1) {this.dir = 7;}
	
	
		this.plain.removeObject(this);
		this.tileX = newX;
		this.tileY = newY;
		this.plain.addObject(this);
		this.lastStep = this.maze.timeNow;
		this.offsetSize = 1.0;
		this.walking = true;
		
		
		
		
	} else {
		if (this.walking) {
			//var aim = this.aimObject;
			var aimOk = 
				(this.aimObject && this.tileX == this.aimObject.tileX && this.tileY == this.aimObject.tileY) ||
				(!this.aimObject && Math.abs(this.tileX - this.aimTileX) <= 1 && Math.abs(this.tileY - this.aimTileY) <= 1)
			this.stopWalk();
			if (aimOk) {
				this.trigger('arrived')
			}
		}
	}
}

Maze.Obj.Walker.getNeighbours = function() {
	return [
		{x :  0, y : +1},
		{x : +1, y : +1},
		{x : +1, y :  0},
		{x : +1, y : -1},
		{x :  0, y : -1},
		{x : -1, y : -1},
		{x : -1, y :  0},
		{x : -1, y : +1}
	];

}

Maze.Obj.Walker.stopWalk = function() {
	this.walking = false;
	this.offsetX = 0.0;
	this.offsetY = 0.0;
	this.offsetSize = 0.0;
	this.imgY = 0;
	this.aimTileX = this.tileX;
	this.aimTileY = this.tileY;
	this.aimObject = null;
}

Maze.Obj.Walker.cancelWalk = function() {
	this.aimTileX = this.tileX;
	this.aimTileY = this.tileY;
	this.aimObject = null;
}




Maze.Obj.Walker.neighbours = function(x, y) {
	var result = [];
	var item;
	if (!this.plain.isBlocking(this, x+1, y))
		result.push({x:x+1, y:y});
	if (!this.plain.isBlocking(this, x-1, y))
		result.push({x:x-1, y:y});
	if (!this.plain.isBlocking(this, x, y+1))
		result.push({x:x, y:y+1});
	if (!this.plain.isBlocking(this, x, y-1))
		result.push({x:x, y:y-1});
		
	if (!this.plain.isBlocking(this, x+1, y+1))
		result.push({x:x+1, y:y+1});
	if (!this.plain.isBlocking(this, x+1, y-1))
		result.push({x:x+1, y:y-1});
	if (!this.plain.isBlocking(this, x-1, y-1))
		result.push({x:x-1, y:y-1});
	if (!this.plain.isBlocking(this, x-1, y+1))
		result.push({x:x-1, y:y+1});
		
	return result;
}



Maze.Obj.Walker.findPath = function() {

		function Node(Parent, Point)
		{
			var newNode = {
				// pointer to another Node object
				Parent:Parent,
				// array index of this Node in the world linear array
				index:Point.x + "_" + Point.y,
				// the location coordinates of this Node
				x:Point.x,
				y:Point.y,
				// the heuristic estimated cost
				// of an entire path using this node
				f:0,
				// the distanceFunction cost to get
				// from the starting point to this node
				g:0
			};

			return newNode;
		}
		
		function getDistance(Point, Goal)
		{	// linear movement - no diagonals - just cardinal directions (NSEW)
			return Math.abs(Point.x - Goal.x) + Math.abs(Point.y - Goal.y);
		}
		

		

		// create Nodes from the Start and End x,y coordinates
		var	mypathStart = Node(null, {x:this.tileX, y:this.tileY});
		var mypathEnd = Node(null, this.findAimPosition());
		// sign all nodes in open or close to avoid them later
		var AStar = {};
		// A counter to check too long routes
		var AStarCount = 0;
		// list of currently open Nodes
		var Open = [mypathStart];
		// list of closed Nodes
		var Closed = [];
		// list of the final output array
		var result = [];
		// reference to a Node (that is nearby)
		var myNeighbours;
		// reference to a Node (that we are considering now)
		var myNode;
		// reference to a Node (that starts a path in question)
		var myPath;
		// temp integer variables used in the calculations
		var length, max, min, i, j;
		// iterate through the open list until none are left
		while(length = Open.length)
		{
			max = Number.MAX_VALUE;
			min = -1;
			for(i = 0; i < length; i++)
			{
				if(Open[i].f < max)
				{
					max = Open[i].f;
					min = i;
				}
			}
			// grab the next node and remove it from Open array
			myNode = Open.splice(min, 1)[0];
			// is it the destination node?
			if(myNode.index === mypathEnd.index || AStarCount > 5000)
			{
				myPath = Closed[Closed.push(myNode) - 1];
				do
				{
					result.push([myPath.x, myPath.y]);
				}
				while (myPath = myPath.Parent);
				// clear the working arrays
				AStar = Closed = Open = [];
				// we want to return start to finish
				result.reverse();
			}
			else // not the destination
			{
				// find which nearby nodes are walkable
				myNeighbours = this.neighbours(myNode.x, myNode.y);
				// test each one that hasn't been tried already
				for(i = 0, j = myNeighbours.length; i < j; i++)
				{
					myPath = Node(myNode, myNeighbours[i]);
					if (!AStar[myPath.index])
					{
						// estimated cost of this particular route so far
						myPath.g = myNode.g + getDistance(myNeighbours[i], myNode);
						// estimated cost of entire guessed route to the destination
						myPath.f = myPath.g + getDistance(myNeighbours[i], mypathEnd);
						// remember this new path for testing above
						Open.push(myPath);
						// mark this node in the world graph as visited
						AStar[myPath.index] = true;
						AStarCount++;
					}
				}
				// remember this route as having no more untested options
				Closed.push(myNode);
			}
		} // keep iterating until until the Open list is empty
		return result;
}




Maze.Obj.Walker.findAimPosition = function() {
	
	// if target not blocking this is the aim
	if (!this.plain.isBlocking(this, this.aimTileX, this.aimTileY)  && !this.aimNear) {
		return {x : this.aimTileX, y : this.aimTileY};
	}
	
	// if we are one tile from blocking target, we arrived
	if (Math.abs(this.aimTileX - this.tileX) + Math.abs(this.aimTileY - this.tileY) == 1)
		return {x : this.tileX, y : this.tileY};
	
	var o = new Array();
	if (this.aimTileX > this.tileX) {
		o.push({x : -1, y :  0});
		o.push({x :  0, y : +1});
		o.push({x :  0, y : -1});
		o.push({x : +1, y :  0});
	}
	else if (this.aimTileX < this.tileX) {
		o.push({x : +1, y :  0});
		o.push({x :  0, y : -1});
		o.push({x :  0, y : +1});
		o.push({x : -1, y :  0});
	}
	else if (this.aimTileY < this.tileY) {
		o.push({x :  0, y : -1});
		o.push({x : +1, y :  0});
		o.push({x : -1, y :  0});
		o.push({x :  0, y : +1});
	}
	else if (this.aimTileY > this.tileY) {
		o.push({x :  0, y : +1});
		o.push({x : -1, y :  0});
		o.push({x : +1, y :  0});
		o.push({x :  0, y : -1});
	}
	
	for (var i in o) {
		if (!this.plain.isBlocking(this, this.aimTileX + o[i].x, this.aimTileY + o[i].y))
			return {x: this.aimTileX + o[i].x, y: this.aimTileY + o[i].y};
	}
	
	// blocking... but no nearby free tile
	return {x : this.aimTileX, y : this.aimTileY};
	
}


Maze.Obj.Walker.turn = function(a) {
	this.dir = (this.dir + a + 80) % 8;
	if (this.recording)
		this.recording.addTurn(this, a);
}

Maze.Obj.Walker.getMove = function(s) {
	var ns = this.getNeighbours();
	var d = this.dir;
	var n = ns[d];
	return {
		x : this.tileX + n.x * s,
		y : this.tileY + n.y * s
	}
}

Maze.Obj.Walker.move = function(s, noAnim) {
	var ns = this.getNeighbours();
	var d = this.dir;
	if (s==-1) {
		d = (d + 4) % 8;
	}
	var n = ns[d];
/*
	if (this.inFight) {
		for (var pid in this.inFight.participants) {
			var p2 = this.inFight.participants[pid];
			if (p2 == this || p2.dead) 
				continue;
			if (p2.nextAction && p2.nextAction.move) {
				var ns2 = p2.getNeighbours();
				var x2 = p2.tileX;
				var y2 = p2.tileY;
				var dir2 = p2.dir;
				
				if (x2 + ns2[dir2].x * p2.nextAction.move == this.tileX + n.x && y2 + ns2[dir2].y * p2.nextAction.move == this.tileY + n.y) {
					if (s>0) 
						this.animAddPose('fightWalk', this.poses.stepOneBlocked, true);
					else
						this.animAddPose('fightWalk', this.poses.stepBackBlocked, true);
					return;
					
				}
			}
		}
	}
	
	if (this.plain.isBlocking(this, this.tileX + n.x,  this.tileY + n.y)) {
		if (s>0) 
			this.animAddPose('fightWalk', this.poses.stepOneBlocked, true);
		else
			this.animAddPose('fightWalk', this.poses.stepBackBlocked, true);
		return;
	}

*/


	if (this.recording)
		this.recording.addMove(this, s);


	this.plain.removeObject(this);
	this.tileX += n.x;
	this.tileY += n.y;
	this.aimTileX = this.tileX;
	this.aimTileY = this.tileY;
	this.plain.addObject(this);
	this.blurFollow();
	this.offsetX = -n.x;
	this.offsetY = -n.y;
	this.offsetSize = 1.0;
	this.lastStep = this.maze.timeNow;
	
	// if (!noAnim)
		// this.animAddAnimation('fightWalk', this.animations.stepBackward, true);
}