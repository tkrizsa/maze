Maze.Pop = function() {};

Maze.Pop.extend = function(pop, params) {
	pop.left 			= 0;
	pop.top 			= 0;
	pop.width 			= 100;
	pop.height 			= 100;
	pop.parent			= null;
	pop.style			= 'window';
	
	if (typeof params != 'object')
		params = {};
		
	for (var i in params) {
		if (!params.hasOwnProperty(i))
			continue;
		pop[i] = params[i];
	
	}
	
	if (pop.parent)
		pop.parent.add(pop);
	
	pop.children = new Array();

	pop.add 			= Maze.Pop.add;
	pop.remove 			= Maze.Pop.remove;
	pop.drawIt 			= Maze.Pop.drawIt;
	pop.getLeft			= Maze.Pop.getLeft;
	pop.getTop			= Maze.Pop.getTop;
	pop.getWidth		= Maze.Pop.getWidth;
	pop.getHeight		= Maze.Pop.getHeight;

	Maze.EventOwner.extend(pop);
}






Maze.Pop.getLeft = function() {
	if (typeof this.right != 'undefined') {
		return this.parent.getWidth() - this.right - this.getWidth();
	}

	var p = 0;
	if (this.parent)
		p = this.parent.getLeft();
	return this.left + p;
}

Maze.Pop.getTop = function() {
	if (typeof this.bottom != 'undefined') {
		return this.parent.getHeight() - this.bottom - this.getHeight();
	}
	var p = 0;
	if (this.parent)
		p = this.parent.getTop();
	return this.top + p;
}

Maze.Pop.getWidth = function() {
	return this.width;
}

Maze.Pop.getHeight = function() {
	return this.height;
}


Maze.Pop.drawIt = function(cam) {
	if (this.hidden)
		return;

	var left = this.getLeft();
	var top = this.getTop();
	var width = this.getWidth();
	var height = this.getHeight();

	if (
		this.style != 'transparent' && 
		cam.mouseX >= left &&
		cam.mouseY >= top &&
		cam.mouseX < left + width &&
		cam.mouseY < top + height) 
	{
		cam.setMouseHover('pop', this);
	}

	cam.ctx.beginPath();
	cam.ctx.rect(left, top, width, height);
	
	if (this.style == 'window') {
		if (this.fillStyle)
			cam.ctx.fillStyle = this.fillStyle
		else
			cam.ctx.fillStyle = 'rgba(255,255,255,0.7)';
		cam.ctx.fill();
	}

	if (this.style == 'button') {
		cam.ctx.lineWidth= 1;
		cam.ctx.strokeStyle = 'rgba(0,0,0,1.0)';
		cam.ctx.stroke();	
		if (cam.mouseHover.kind == 'pop' && cam.mouseHover.obj == this) {
			cam.ctx.fillStyle = 'rgba(100,100,200,0.5)';
			cam.ctx.fill();
		}
	}
	
	this.trigger('drawIt', cam);

	for(var i in this.children) {
		var c = this.children[i];
		c.drawIt(cam);
	}
}

Maze.Pop.add = function(pop) {
	this.children.push(pop);
}

Maze.Pop.remove = function(pop) {
	var i = this.children.indexOf(pop);
	if (i>=0)
		this.children.splice(i,1);
}

// ============================================ BUTTON-TEXT =========================================
Maze.Pop.ButtonText = function(parent, caption) {
	Maze.Pop.extend(this, {
		left : 10,
		top : 10,
		width : 100,
		height : 20,
		style : 'button',
		parent : parent
	});
	
	this.caption = caption;
	
	var thisButton = this;
	this.bind('click', function() {
		if (typeof thisButton.onClick == 'function') {
			thisButton.onClick();
		}
	});
	this.bind('wheel', function(d) {
		if (typeof thisButton.onWheel == 'function') {
			thisButton.onWheel(d);
		}
	});
	
	var thisButton = this;
	this.bind('drawIt', function(cam) {
		cam.ctx.font = "14px Arial";
		if (thisButton.color) {
			cam.ctx.fillStyle = thisButton.color;
		} else {
			cam.ctx.fillStyle = 'rgba(40,40,40,1)';
		}
		cam.ctx.fillText(thisButton.caption, thisButton.getLeft() + 5, thisButton.getTop() + thisButton.getHeight() - 5);
	});
}

// ============================================ BUTTON-ICON =========================================
Maze.Pop.ButtonIcon = function(parent, p) {
	if (typeof p != 'object')
		p = {};

	Maze.Pop.extend(this, {
		left 		: p.left ? p.left : 10,
		top 		: p.top ? p.top : 10,
		width 		: p.width ? p.width : 100,
		height 		: p.height ? p.height : 20,
		style : 'transparentButton',
		parent : parent
	});
	
	
	var thisButton = this;
	this.bind('click', function() {
		if (typeof thisButton.onClick == 'function') {
			thisButton.onClick();
		}
	});
	this.bind('wheel', function(d) {
		if (typeof thisButton.onWheel == 'function') {
			thisButton.onWheel(d);
		}
	});
	
	var thisButton = this;
}


// ================================================================================= MAIN ================================================================================
Maze.Pop.Main = function(maze) {
	this.maze = maze;
	var thisPop = this;
	
	Maze.Pop.extend(this, {
		left : 0,
		top : 0,
		width : 100,
		height : 100,
		style : 'transparent'
	});
	
	this.poseEditor = new Maze.Pop.PoseEditor(this.maze, this, this.maze.hero, this.maze.hero.animations.step);	
	this.drawMenu = new Maze.Pop.DrawMenu(this.maze, this);	
	
	this.poseEditor.hidden = true;
	this.drawMenu.hidden = true;
	
	
	
	this.musicButton = new Maze.Pop.ButtonText(this, 'Music');
	this.musicButton.left = 800;
	this.musicButton.top = 5;
	this.musicButton.width = 60;
	this.musicButton.color = '#e0e0e0';
	this.musicButton.onClick = function() {
		if (maze.musicOn) {
			maze.audio.bgMusic.pause();
			maze.musicOn = false;
		} else {
			maze.audio.bgMusic.play();
			maze.musicOn = true;
		}
	}
	
	this.soundButton = new Maze.Pop.ButtonText(this, 'Sounds');
	this.soundButton.left = 860;
	this.soundButton.top = 5;
	this.soundButton.width = 60;
	this.soundButton.color = '#e0e0e0';
	this.soundButton.onClick = function() {
		if (maze.soundsOn) {
			maze.soundsOn = false;
		} else {
			maze.soundsOn = true;
		}
	}
	
	this.drawButton = new Maze.Pop.ButtonText(this, 'Draw');
	this.drawButton.left = 740;
	this.drawButton.top = 5;
	this.drawButton.width = 60;
	this.drawButton.color = '#e0e0e0';
	this.drawButton.onClick = function() {
		thisPop.drawMenu.hidden = !thisPop.drawMenu.hidden;
	}
	
	this.gridButton = new Maze.Pop.ButtonText(this, 'Grid');
	this.gridButton.left = 680;
	this.gridButton.top = 5;
	this.gridButton.width = 60;
	this.gridButton.color = '#e0e0e0';
	this.gridButton.onClick = function() {
		thisPop.maze.camera.drawSectionGrid = !thisPop.maze.camera.drawSectionGrid;
	}
	
	
	
	
	this.cmdButtons = [];
	
	
	this.cmdDigButton = new Maze.Pop.ButtonText(this, 'Dig');
	this.cmdButtons.push(this.cmdDigButton);
	this.cmdDigButton.left = 5;
	this.cmdDigButton.bottom = 5;
	this.cmdDigButton.width = 60;
	this.cmdDigButton.height = 60;
	this.cmdDigButton.color = '#e0e0e0';
	this.cmdDigButton.onClick = function() {
		maze.hero.command = 'dig';
		thisPop.heroCommand();
	}
	
	this.cmdBuildButton = new Maze.Pop.ButtonText(this, 'Build');
	this.cmdButtons.push(this.cmdBuildButton);
	this.cmdBuildButton.left = 70;
	this.cmdBuildButton.bottom = 5;
	this.cmdBuildButton.width = 60;
	this.cmdBuildButton.height = 60;
	this.cmdBuildButton.color = '#e0e0e0';
	this.cmdBuildButton.onClick = function() {
		maze.hero.command = 'build_farm';
		thisPop.heroCommand();
	}
	
	
	
	this.cmdCancelButton = new Maze.Pop.ButtonText(this, 'Cancel');
	this.cmdCancelButton.left = 5;
	this.cmdCancelButton.bottom = 5;
	this.cmdCancelButton.width = 60;
	this.cmdCancelButton.height = 60;
	this.cmdCancelButton.color = '#e0e0e0';
	this.cmdCancelButton.hidden = true;
	this.cmdCancelButton.onClick = function() {
		maze.hero.command = false;
		thisPop.heroCancel();
	}
	
	
	this.heroCommand = function() {
		for (var i in this.cmdButtons) {
			this.cmdButtons[i].hidden = true;
		}
		this.cmdCancelButton.hidden = false;
	}

	this.heroCancel = function() {
		for (var i in this.cmdButtons) {
			this.cmdButtons[i].hidden = false;
		}
		this.cmdCancelButton.hidden = true;
	}
}





// ============================================ POSEEDITOR =========================================
Maze.Pop.PoseEditor = function(maze, parent, fighter, animation) {
	var thisMenu = this;
	
	Maze.Pop.extend(this, {
		left : 20,
		top : 50,
		width : 120,
		height : 400,
		parent : parent
	});
	this.fighter = fighter;
	
	
	this.buttonAttack = new Maze.Pop.ButtonText(this, animation.name);
	this.buttonAttack.top = 40;
	this.buttonAttack.onClick = function() {
	
		thisMenu.fighter.animAddAnimation('poseEditor', animation, function() {
		
		}, true);
	}

	var ttop = 70;
	

	var phaseButton = new Maze.Pop.ButtonText(thisMenu);
	phaseButton.top = ttop;
	ttop += 30;
	
	
	var pointButton = new Maze.Pop.ButtonText(thisMenu);
	pointButton.top = ttop;
	ttop += 30;


	var wheelerAlpha = new Maze.Pop.ButtonText(thisMenu);
	wheelerAlpha.param = 'alpha';
	wheelerAlpha.top = ttop;
	ttop += 30;
	
	var wheelerBeta = new Maze.Pop.ButtonText(thisMenu);
	wheelerBeta.param = 'beta';
	wheelerBeta.top = ttop;
	ttop += 30;
	
	var wheelerGamma = new Maze.Pop.ButtonText(thisMenu);
	wheelerGamma.param = 'gamma';
	wheelerGamma.top = ttop;
	ttop += 30;
	
	var wheelerX = new Maze.Pop.ButtonText(thisMenu);
	wheelerX.param = 'x';
	wheelerX.top = ttop;
	ttop += 30;
	
	var wheelerY = new Maze.Pop.ButtonText(thisMenu);
	wheelerY.param = 'y';
	wheelerY.top = ttop;
	ttop += 30;
	
	var wheelerZ = new Maze.Pop.ButtonText(thisMenu);
	wheelerZ.param = 'z';
	wheelerZ.top = ttop;
	ttop += 30;
	
	

	var phaseSelected = 0;
	var phase;
	var pose;
	
	var posePoints;
	var pointSelected;
	var point, posePoint;
	
	var poseChanged = function() {
		phase = animation.phases[phaseSelected];
		pose = phase.pose;
		phaseButton.caption = pose.name;
		posePoints = new Array();
		for (var i in pose.points) 
			posePoints.push(i);
		pointSelected = 0;
		pointChanged();
		
		if (fighter.fixPose != null) {
			fighter.fixPose = pose;
		}
		
	}
	
	var pointChanged = function() {
		point = fighter.points[posePoints[pointSelected]];
		posePoint = pose.points[posePoints[pointSelected]]
		pointButton.caption = posePoints[pointSelected] + ' : ' + point.name;	
		wheelerAlpha.caption = "a : " + (Math.round(posePoint.alpha*100) /100);		
		wheelerBeta.caption = "b : " + (Math.round(posePoint.beta*100) /100);		
		wheelerGamma.caption = "c : " + (Math.round(posePoint.gamma*100) /100);		
		wheelerX.caption = "x : " + (Math.round(pose.x * 100) /100);		
		wheelerY.caption = "y : " + (Math.round(pose.y * 100) /100);		
		wheelerZ.caption = "y : " + (Math.round(pose.z * 100) /100);		
	}
	
	poseChanged();
	
	phaseButton.onClick = function() {
		phaseSelected ++;
		if (phaseSelected >= animation.phases.length)
			phaseSelected = 0;
		poseChanged();
	
	};
	
	pointButton.onClick = function() {
		pointSelected ++;
		if (pointSelected >= posePoints.length)
			pointSelected = 0;
		pointChanged();
	}
	
	
	wheelerAlpha.onWheel = wheelerBeta.onWheel = wheelerGamma.onWheel = function(d) {
		posePoint[this.param] += d * 0.02;
		pointChanged();
	}

	wheelerX.onWheel = wheelerY.onWheel = wheelerZ.onWheel = function(d) {
		pose[this.param] += d * 0.1;
		pointChanged();
	}

	var tleft = 10;

	var zoomButton = new Maze.Pop.ButtonText(thisMenu, 'Z');
	zoomButton.onClick = function() {
		fighter.bigZoom = !fighter.bigZoom;
	}
	zoomButton.width = 25;
	zoomButton.top = ttop;
	zoomButton.left = tleft;
	tleft += 30;

	var keepRotating = new Maze.Pop.ButtonText(thisMenu, 'R');
	keepRotating.onClick = function() {
		fighter.keepRotating = !fighter.keepRotating;
	}
	keepRotating.width = 25;
	keepRotating.top = ttop;
	keepRotating.left = tleft;
	tleft += 30;

	var poseButton = new Maze.Pop.ButtonText(thisMenu, 'F');
	poseButton.onClick = function() {
		if (fighter.animIs('poseEditor')) {
			fighter.animStop('poseEditor');
		} else {
			fighter.animAddPose('poseEditor', pose);
		}
		
	}
	poseButton.width = 25;
	poseButton.top = ttop;
	poseButton.left = tleft;
	tleft += 30;


	ttop += 60;
	
	var omega = new Maze.Pop.ButtonText(thisMenu, 'omega : ' + (Math.round(maze.omega*100)/100));
	omega.top = ttop;
	omega.onWheel = function(d) {
		maze.omega += d * 0.02;
		this.caption = 'omega : ' + (Math.round(maze.omega*100)/100);
	}
	
	ttop += 30;
	
}


// ============================================ DRAWMENU =========================================
Maze.Pop.DrawMenu = function(maze, parent) {
	var thisMenu = this;
	
	Maze.Pop.extend(this, {
		left : 20,
		top : 50,
		width : 120,
		height : 400,
		parent : parent
	});
	
	
	var ttop = 10;
	var gap = 5
	var b;
	
	b = new Maze.Pop.ButtonText(this, 'walk');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = false;
	}

	b = new Maze.Pop.ButtonText(this, 'school');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'object', objectClass : 'School'};
	}

	b = new Maze.Pop.ButtonText(this, 'sand');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'terrain', terrainClass : 'SandFloor'};
	}

	b = new Maze.Pop.ButtonText(this, 'sand2');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'terrain', terrainClass : 'SandFloor2'};
	}

	b = new Maze.Pop.ButtonText(this, 'water');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'terrain', terrainClass : 'WaterFloor'};
	}

	b = new Maze.Pop.ButtonText(this, 'water2');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'terrain', terrainClass : 'WaterFloor2'};
	}

	b = new Maze.Pop.ButtonText(this, 'rock');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'terrain', terrainClass : 'RockFloor'};
	}

	b = new Maze.Pop.ButtonText(this, 'rock2');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'terrain', terrainClass : 'RockFloor2'};
	}

	b = new Maze.Pop.ButtonText(this, 'snow');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'terrain', terrainClass : 'SnowFloor'};
	}

	b = new Maze.Pop.ButtonText(this, 'grass');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'floor', terrainClass : 'GrassFloor'};
	}

	b = new Maze.Pop.ButtonText(this, 'swamp');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'terrain', terrainClass : 'SwampFloor'};
	}

	b = new Maze.Pop.ButtonText(this, 'swamp2');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'terrain', terrainClass : 'SwampFloor2'};
	}

	b = new Maze.Pop.ButtonText(this, 'swamp water');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'terrain', terrainClass : 'SwampWaterFloor'};
	}

	b = new Maze.Pop.ButtonText(this, 'tile1');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'floor', terrainClass : 'TileFloor1'};
	}
	b = new Maze.Pop.ButtonText(this, 'tile2');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'floor', terrainClass : 'TileFloor2'};
	}
	b = new Maze.Pop.ButtonText(this, 'tile3');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'floor', terrainClass : 'TileFloor3'};
	}

	b = new Maze.Pop.ButtonText(this, 'brickwall1');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'object', objectClass : 'BrickWall1'};
	}

	b = new Maze.Pop.ButtonText(this, 'brickwall2');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'object', objectClass : 'BrickWall2'};
	}

	b = new Maze.Pop.ButtonText(this, 'brickwall3');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'object', objectClass : 'BrickWall3'};
	}

	b = new Maze.Pop.ButtonText(this, 'tree1');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'object', objectClass : 'Tree1'};
	}

	b = new Maze.Pop.ButtonText(this, 'tree2');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'object', objectClass : 'Tree2'};
	}

	b = new Maze.Pop.ButtonText(this, 'tree3');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'object', objectClass : 'Tree3'};
	}

	b = new Maze.Pop.ButtonText(this, 'pine1');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'object', objectClass : 'TreePine1'};
	}

	b = new Maze.Pop.ButtonText(this, 'pine2');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'object', objectClass : 'TreePine2'};
	}

	b = new Maze.Pop.ButtonText(this, 'tree bold 1');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'object', objectClass : 'TreeBold1'};
	}

	b = new Maze.Pop.ButtonText(this, 'tree bold 2');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'object', objectClass : 'TreeBold2'};
	}

	b = new Maze.Pop.ButtonText(this, 'tree bold 3');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'object', objectClass : 'TreeBold3'};
	}

	b = new Maze.Pop.ButtonText(this, 'palm 1');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'object', objectClass : 'TreePalm1'};
	}

	b = new Maze.Pop.ButtonText(this, 'palm 2');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'object', objectClass : 'TreePalm2'};
	}

	b = new Maze.Pop.ButtonText(this, 'palm 3');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'object', objectClass : 'TreePalm3'};
	}

	b = new Maze.Pop.ButtonText(this, 'palm 4');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'object', objectClass : 'TreePalm4'};
	}

	b = new Maze.Pop.ButtonText(this, 'bush1');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'object', objectClass : 'Bush1'};
	}

	b = new Maze.Pop.ButtonText(this, 'bush2');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'object', objectClass : 'Bush2'};
	}
	
	b = new Maze.Pop.ButtonText(this, 'rock1');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'object', objectClass : 'rock1'};
	}
	
	b = new Maze.Pop.ButtonText(this, 'rock2');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'object', objectClass : 'rock2'};
	}
	
	b = new Maze.Pop.ButtonText(this, 'rock3');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'object', objectClass : 'rock3'};
	}
	
	

	b = new Maze.Pop.ButtonText(this, 'remove');
	ttop = (b.top = ttop) + b.height + gap;
	b.onClick = function() {
		maze.draw = {type : 'objectRemove'};
	}

}