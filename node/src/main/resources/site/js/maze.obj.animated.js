Maze.Obj.Animated = function() {};


Maze.Obj.Animated.extend = function(obj) {
	obj.ancestors.animated = true;
	
	obj.walkAnim = null;
	obj.keepRotating = false;
	
	
	
	obj.poses = {};
	
	
	
	
	obj.animations = {};
	obj.runningAnims = {};	
	
	
	obj.animatedStepIt 		= Maze.Obj.Animated.animatedStepIt;
	obj.animatedDrawIt 		= Maze.Obj.Animated.animatedDrawIt;
	obj.init 				= Maze.Obj.Animated.init;
	obj.addPoint 			= Maze.Obj.Animated.addPoint;
	obj.addLine 			= Maze.Obj.Animated.addLine;
	obj.addCircle 			= Maze.Obj.Animated.addCircle;
	obj.addRectangle 		= Maze.Obj.Animated.addRectangle;

	obj.animStep			= Maze.Obj.Animated.animStep;
	obj.isAnimating			= Maze.Obj.Animated.isAnimating;
	obj.animGet		 		= Maze.Obj.Animated.animGet;
	obj.animAddPose 		= Maze.Obj.Animated.animAddPose;
	obj.animAddAnimation	= Maze.Obj.Animated.animAddAnimation;
	obj.animStop			= Maze.Obj.Animated.animStop;
	obj.animStopAll			= Maze.Obj.Animated.animStopAll;
	obj.animContinue		= Maze.Obj.Animated.animContinue;
	obj.animFinish			= Maze.Obj.Animated.animFinish;
	obj.animClear			= Maze.Obj.Animated.animClear;
	obj.animIs				= Maze.Obj.Animated.animIs;
	obj.animAddWait			= Maze.Obj.Animated.animAddWait;
	obj.animAddTrigger		= Maze.Obj.Animated.animAddTrigger;
	obj.animTriggered		= Maze.Obj.Animated.animTriggered;
	


	obj.lineColor = '#202020';
	obj.bootColor = '#dddd40';
	obj.swordColor = '#e0e0e0';
	obj.headColor = '#202020';
	obj.swordLength = 2.5;
	obj.legLength = 0.8;
	obj.headRad	 = 0.4;
	obj.spineHeight	 = 1.0;
	obj.armLength	 = 0.6;
	obj.neckLength	 = 0.6;
	
	obj.shieldTop	 	 = 1.3;
	obj.shieldBottom	 = 0.6;
	
	//obj.zanal = true;
	obj.bind('drawIt', obj.animatedDrawIt);
	obj.bind('stepIt', obj.animatedStepIt);
	
}

Maze.Obj.Animated.animatedStepIt = function() {
	this.dirRad += 0.05;
	if (this.dirRad > 2 * Math.PI)
		this.dirRad -= 2 * Math.PI;
		
}

Maze.Obj.Animated.animatedDrawIt = function(cam, left, top) {
	var sourceHeight = 8;
	var height = Math.round(sourceHeight * cam.TILE_HEIGHT / cam.SOURCE_TILE_HEIGHT);
	var ctx = cam.ctx;

	
	var centerX = left + cam.TILE_WIDTH / 2;
	var centerY = top + cam.TILE_HEIGHT / 3 * 2;
	var zoom = cam.TILE_HEIGHT / 2.2; //3.5!!
	if (this.bigZoom)
		zoom = cam.TILE_HEIGHT / 0.8; //3.5!!
	
	if (!this.keepRotating)
		this.dirRad = this.dir * Math.PI / 4 + 0.12; 
	
	//	this.dirRad = 0.5 * Math.PI / 2; 
	
	if (this.walking && !this.runningAnims['walk']) {
		this.animAddAnimation('walk', this.animations.step);
	}
	if (!this.walking && this.runningAnims['walk']) {
		this.animStop('walk', true);
	}
	
	// shadow
	if (!this.dead) {
		ctx.fillStyle = 'rgba(0,0,0,0.3)';
		ctx.beginPath();
		ctx.arc(centerX, centerY, 0.8 * zoom, 0, 2 * Math.PI, false)
		ctx.fill();
	}

	
	
	
	ctx.lineWidth= Math.floor(cam.TILE_WIDTH / 12);
	ctx.strokeStyle = this.lineColor;
	ctx.fillStyle = this.lineColor;
	
	
	var animp = new Array();
	var poseX = 0.0;
	var poseY = 0.0;
	var poseZ = 0.0;
	
	// ==== calculate animation angles for all proceeding animaions ==== 
	for (var a in this.runningAnims) {
		
		if (this.animStep(a)) 
			continue;
			
		var animation = this.runningAnims[a];
		
		phase1 = animation.phases[animation.phase];
		
		timeElapsed =  this.maze.timeNow - animation.phaseStart;
		var timeRatio = timeElapsed / phase1.duration;
		
		phase0 = animation.phases[animation.phase-1];
		
		if (animation.loop && animation.phase == 1) {
			phase0 = animation.phases[animation.phases.length-1];
		}
		
		if (animation.waitingAtEnd) {
			phase0 = phase1;
			timeRatio = 0;
		}
		
		if (phase1.wait) {
			phase0 = phase1;
			timeRatio = 0;
		}
		

		var pose0 = phase0.pose;
		var pose1 = phase1.pose;
		
		
	
		for(var i in this.points) {
			if (!pose0.points[i] && !pose1.points[i])
				continue;
			var alpha0 = 0.0;
			var alpha1 = 0.0;
			var beta0 = 0.0;
			var beta1 = 0.0;
			var gamma0 = 0.0;
			var gamma1 = 0.0;
			
			
			if (pose0.points[i]) {
				if (pose0.points[i].alpha) alpha0 = pose0.points[i].alpha;
				if (pose0.points[i].beta) beta0 = pose0.points[i].beta;
				if (pose0.points[i].gamma) gamma0 = pose0.points[i].gamma;
			}
			if (pose1.points[i]) {
				if (pose1.points[i].alpha) alpha1 = pose1.points[i].alpha;
				if (pose1.points[i].beta) beta1 = pose1.points[i].beta;
				if (pose1.points[i].gamma) gamma1 = pose1.points[i].gamma;
			}
			
			var alpha = alpha0 + (alpha1 - alpha0) * timeRatio;
			var beta = beta0 + (beta1 - beta0) * timeRatio;
			var gamma = gamma0 + (gamma1 - gamma0) * timeRatio;
		
			if (typeof animp[i] == 'undefined') {
				animp[i] = {alpha : 0.0, beta : 0.0, gamma : 0.0};
			}
			animp[i].alpha += alpha;
			animp[i].beta += beta;
			animp[i].gamma += gamma;
		}
		
		
		var poseX0 = 0.0;
		var poseX1 = 0.0;
		var poseY0 = 0.0;
		var poseY1 = 0.0;
		var poseZ0 = 0.0;
		var poseZ1 = 0.0;
		
		if (pose0.x) poseX0 = pose0.x;
		if (pose1.x) poseX1 = pose1.x;
		if (pose0.y) poseY0 = pose0.y;
		if (pose1.y) poseY1 = pose1.y;
		if (pose0.z) poseZ0 = pose0.z;
		if (pose1.z) poseZ1 = pose1.z;
		poseX = poseX0 + (poseX1 - poseX0) * timeRatio;
		poseY = poseY0 + (poseY1 - poseY0) * timeRatio;
		poseZ = poseZ0 + (poseZ1 - poseZ0) * timeRatio;
		
	}



	
	// ==== calculate point positions ====
	var pts = new Array();	//from zero position
	var ptsp = new Array(); //screen position and rotation applied

	
	// root point: 
	var p0 = 
	{	x : 0.0, y : 0.0, z:0.0, 
		aNormal : {x: 0.0, y: 0.0, z: 1.0},  // rotation normal for alpha angles
		bNormal : {x: 0.0, y: 1.0, z: 0.0},   // rotation normal for beta angles
		cNormal : {x: 1.0, y: 0.0, z: 0.0}   // rotation normal for beta angles
		
	};
	
	for (var i in this.points) {
		var p = this.points[i];
		
		// get root point
		var r;
		if (p.root == -1)
			r = p0;
		else
			r = pts[p.root];
			
		// get angles with animation phases	
		var alpha = p.alpha;
		var beta = p.beta;
		var gamma = p.gamma;
		if (animp[i] && animp[i].alpha)
			alpha += animp[i].alpha;
		if (animp[i] && animp[i].beta)
			beta += animp[i].beta;
		if (animp[i] && animp[i].gamma)
			gamma += animp[i].gamma;
			
		var newPoint = {
			x : r.bNormal.x * p.len,
			y : r.bNormal.y * p.len,
			z : r.bNormal.z * p.len
		}
		newPoint 		= Maze.TD.rotateNormal({x:0.0, y:0.0, z:0.0}, r.bNormal, newPoint, beta * 2 * Math.PI);
		var newANormal 	= Maze.TD.rotateNormal({x:0.0, y:0.0, z:0.0}, r.bNormal, r.aNormal, beta * 2 * Math.PI);
		var newCNormal 	= Maze.TD.rotateNormal({x:0.0, y:0.0, z:0.0}, r.bNormal, r.cNormal, beta * 2 * Math.PI);
		
		newPoint 		= Maze.TD.rotateNormal({x:0.0, y:0.0, z:0.0}, newANormal, newPoint, -alpha * 2 * Math.PI);
		var newBNormal 	= Maze.TD.rotateNormal({x:0.0, y:0.0, z:0.0}, newANormal, r.bNormal, -alpha * 2 * Math.PI);
		    newCNormal 	= Maze.TD.rotateNormal({x:0.0, y:0.0, z:0.0}, newANormal, r.cNormal, -alpha * 2 * Math.PI);
		
		newPoint 		= Maze.TD.rotateNormal({x:0.0, y:0.0, z:0.0}, newCNormal, newPoint, gamma * 2 * Math.PI);
			newANormal 	= Maze.TD.rotateNormal({x:0.0, y:0.0, z:0.0}, newCNormal, newANormal, gamma * 2 * Math.PI);
		    newBNormal 	= Maze.TD.rotateNormal({x:0.0, y:0.0, z:0.0}, newCNormal, newBNormal, gamma * 2 * Math.PI);
		
		
		var x = r.x + newPoint.x;
		var y = r.y + newPoint.y;
		var z = r.z + newPoint.z;
		
		pts.push({
			x : x,
			y : y,
			z : z,
			aNormal : newANormal,
			bNormal : newBNormal,
			cNormal : newCNormal
		});
		
		// rotation & 2d projection
		
		var omega = this.maze.omega * 2 * Math.PI;
		var xx = (x + poseX) * zoom;
		var yy = (y + poseY) * zoom;
		var zz = (z + poseZ) * zoom;
		ptsp.push({
			x : centerX + xx * Math.cos(this.dirRad) + zz * Math.sin(this.dirRad),
			y : centerY - yy * Math.cos(omega)       - xx * Math.sin(this.dirRad) * Math.sin(omega) + zz * Math.cos(this.dirRad) * Math.sin(omega),
			z : centerX - xx * Math.sin(this.dirRad) * Math.cos(omega)   +    zz * Math.cos(this.dirRad) * Math.cos(omega) + yy * Math.sin(omega)
		});
		
		//ptsp[i].x = ptsp[i].z;
		
		
		omega = 22;
	
	}
	
	
	// calculate part's z order
	var zOrdered = new Array();
	for (var i in this.parts) {
		var part  = this.parts[i];
		part.z = 0;
		if (part.kind == 'line') {
			var zmin = Math.min(ptsp[part.p0].z, ptsp[part.p1].z);
			var zmax = Math.max(ptsp[part.p0].z, ptsp[part.p1].z);
			part.z = (zmax * 3 + zmin) / 4;
			
			if (part.p2) {
				part.z = (ptsp[part.p0].z + ptsp[part.p1].z + ptsp[part.p2].z * 2) / 4;
			}
		}
		if (part.kind == 'circle') {
			part.z = ptsp[part.p0].z + part.rad * zoom;
		}
		if (part.kind == 'rectangle') {
			
			var z1 = Math.min(ptsp[part.p0].z, ptsp[part.p1].z);
			var z2 = Math.min(ptsp[part.p2].z, ptsp[part.p3].z);
			var zmin = Math.min(z1, z2);
			
			var z1 = Math.max(ptsp[part.p0].z, ptsp[part.p1].z);
			var z2 = Math.max(ptsp[part.p2].z, ptsp[part.p3].z);
			var zmax = Math.max(z1, z2);
			
			part.z = (zmax * 3 + zmin) / 4;
			
			// part.z = (ptsp[part.p0].z + ptsp[part.p1].z + ptsp[part.p2].z + ptsp[part.p3].z) / 4;
			// part.z = zmax;
		}
		zOrdered.push(part);
	}
	
	zOrdered.sort(function(a, b) {return a.z - b.z});
	
	var zz = 100;
	
	function signZ(part) {
			ctx.beginPath();
			ctx.moveTo(part.z + zz, ptsp[part.p0].y - 10);
			ctx.lineTo(part.z + zz, ptsp[part.p0].y + 10);
			ctx.strokeStyle = 'green';
			if (part.kind == 'line') 
				ctx.strokeStyle = 'blue';
			ctx.strokeWidth = '2px';
			ctx.stroke();	
	}
	
	for (var i in zOrdered) {
		var part  = zOrdered[i];
		if (part.kind == 'line') {
			ctx.strokeStyle = this.lineColor;
			if (part.strokeStyle) {
				ctx.strokeStyle	= part.strokeStyle;
			}
			ctx.beginPath();
			ctx.moveTo(ptsp[part.p0].x, ptsp[part.p0].y);
			ctx.lineTo(ptsp[part.p1].x, ptsp[part.p1].y);
			ctx.stroke();
			
			if (this.zanal) {
				ctx.beginPath();
				ctx.moveTo(ptsp[part.p0].z + zz, ptsp[part.p0].y);
				ctx.lineTo(ptsp[part.p1].z + zz, ptsp[part.p1].y);
				ctx.stroke();
				if (part.signZ) {
					signZ(part);
				}
			}
		}
		if (part.kind == 'circle') {
			ctx.beginPath();
			ctx.arc(ptsp[part.p0].x, ptsp[part.p0].y, part.rad * zoom, 0, 2 * Math.PI, false);
			ctx.fillStyle = part.fillStyle;
			ctx.fill();
			if (this.zanal) {
				ctx.beginPath();
				ctx.arc(ptsp[part.p0].z + zz, ptsp[part.p0].y, part.rad * zoom, 0, 2 * Math.PI, false);
				ctx.fillStyle = part.fillStyle;
				ctx.fill();
			}
		}
		if (part.kind == 'rectangle') {
			ctx.beginPath();
			ctx.moveTo(ptsp[part.p0].x, ptsp[part.p0].y);
			ctx.lineTo(ptsp[part.p1].x, ptsp[part.p1].y);
			ctx.lineTo(ptsp[part.p2].x, ptsp[part.p2].y);
			ctx.lineTo(ptsp[part.p3].x, ptsp[part.p3].y);
			ctx.fillStyle = part.fillStyle;
			ctx.fill();
			
			if (this.zanal) {
				ctx.beginPath();
				ctx.moveTo(ptsp[part.p0].z + zz, ptsp[part.p0].y);
				ctx.lineTo(ptsp[part.p1].z + zz, ptsp[part.p1].y);
				ctx.lineTo(ptsp[part.p2].z + zz, ptsp[part.p2].y);
				ctx.lineTo(ptsp[part.p3].z + zz, ptsp[part.p3].y);
				ctx.fillStyle = part.fillStyle;
				ctx.fill();
				signZ(part);
			}
		}
	
	}

}

Maze.Obj.Animated.init = function() {

	this.poses['base'] = {
		name   : 'base',
		protect : 1
	};
	
	this.poses['dead'] = {
		name   : 'dead'
	};
	
	this.poses['shieldUp'] = {
		name   : 'shieldUp',
		protect : 3
	};
	
	this.poses['stepBase'] = {
		name   : 'stepBase'
	};
	this.poses['step1'] = {
		name   : 'step1'
	};
	
	this.poses['step2'] = {
		name   : 'step2'
	};
	this.poses['stepOne'] = {
		name   : 'stepOne'
	};
	this.poses['stepOneBlocked'] = {
		name   : 'stepOneBlocked'
	};
	this.poses['stepBackBlocked'] = {
		name   : 'stepOneBlocked'
	};
	
	this.poses['hitNormal1'] = {
		name   : 'hitNormal1',
		protect : 1
	};
	
	this.poses['hitNormal2'] = {
		name   : 'hitNormal2'
	};
	
	this.poses['hitStraight'] = {
		name   : 'hitStraight',
		protect : 1
	};
	
	this.basePose = this.poses.base;



	this.points = new Array();
	
	this.addPoint(-1,	this.legLength*1.6,	0.0,	0.0, 0.0, 'spine bottom');  		//0  : spine bottom
	this.addPoint(0,	this.spineHeight,	0.0,	0.0, 0.0, 'neck bottom');  		//1  : neck bottom
	this.addPoint(0,	0.2,	0.25,	0.0, 0.0, 'hip left');  		//2  : hip left
	this.addPoint(0,	0.2,	-0.25,	0.0, 0.0, 'hip right');  		//3  : hip right
	
	this.addPoint(2,	this.legLength,	0.25,	-0.05, 0.0, 'knee left');  	//4  : knee left
	this.addPoint(3,	this.legLength,	-0.25,	+0.05, 0.0, 'knee right');  	//5  : knee right
	
	this.addPoint(4,	this.legLength,	0.15,	+0.25, 0.0, 'ankle left');  	//6  : ankle left
	this.addPoint(5,	this.legLength,	0.15,	+0.25, 0.0, 'ankle right');  	//7  : ankle right

	this.addPoint(6,	0.5,	-0.35,	+0.0, 0.0, 'toe left');  	//8  : toe left
	this.addPoint(7,	0.5,	-0.35,	+0.0, 0.0, 'toe right');  	//9  : toe right
	
	
	this.addPoint(1,	0.4,	0.25,	+0.0, 0.0, 'shoulder left');  	//10  : shouler left
	this.addPoint(1,	0.4,	-0.25,	+0.0, 0.0, 'shoulder right');  	//11  : shouler right

	this.addPoint(10,	this.armLength,	+0.25,	+0.0, 0.0, 'upper arm left');  		//12  : upper arm left 
	this.addPoint(11,	this.armLength,	-0.25,	-0.0, 0.0, 'upper arm right');  	//13  : upper arm right

	this.addPoint(12,	this.armLength,	-0.05,	+0.25, 0.0, 'lower arm left');  	//14  : lower arm left
	this.addPoint(13,	this.armLength,	-0.05,	+0.25, 0.0, 'lower arm right');  	//15  : lower arm right  alpha -0.2 volt karddal!
	
	this.addPoint(1,	this.neckLength,	0.03,	-0.25, 0.0, 'head center');  	//16  : head center
	
	this.addPoint(15,	this.swordLength,	-0.25,	+0.00, 0.0, 'sword');  	//17  : sword
	this.addPoint(15,	1.6,	0.05,	-0.0, 0.0, 'sword2');  	//18  : sword2
	
	this.addPoint(10,   1.1,  0.22, 0.1, 0.0, 'robe center left'); // 19 robe center left 
	this.addPoint(11,   1.1,  -0.22, -0.1, 0.0, 'robe center right'); // 20 robe center right

	this.addPoint(19,   1.1,  0.12, -0.29, 0.0, 'robe bottom left'); // 21 robe bottom left 
	this.addPoint(20,   1.1,  0.12, -0.29, 0.0, 'robe bottom right'); // 22 robe center right
	
	
	this.addPoint(14,   0.01,  0.04, +0.02, 0.0, 'shield center'); 		//23
	this.addPoint(23,   this.shieldBottom,  0.16, +0.04, 0.0, 'shield bottom right'); 		//24
	this.addPoint(23,   this.shieldBottom,  0.29, +0.06, 0.0, 'shield bottom left'); 		//25
	this.addPoint(23,   this.shieldTop,  0.64, -0.02, 0.0, 'shield top left'); 	//26
	this.addPoint(23,   this.shieldTop,  0.79, +0.02, 0.0, 'shield top right'); 	//27
	
	
	

	this.parts = new Array();
	this.addLine(0,1); // spine
	this.addLine(0,2); // hip left
	this.addLine(0,3); // hip right
	this.addLine(2,4); // tight left
	this.addLine(3,5); // tight right
	this.addLine(4,6); // leg left
	this.addLine(5,7); // leg right
	this.addLine(6,8); // foot left
	this.addLine(7,9); // foot right
	

	// this.parts[5].strokeStyle = this.bootColor;
	// this.parts[6].strokeStyle = this.bootColor;
	this.parts[7].strokeStyle = this.bootColor;
	this.parts[8].strokeStyle = this.bootColor;
	
	this.addLine(1,10); // shoulder left
	this.addLine(1,11); // shoulder right
	
	this.addLine(10,12,14); // upper arm left
	this.addLine(11,13,15); // upper arm right
	this.parts[12].signZ = true;
	
	this.addLine(12,14); // lower arm left
	this.addLine(13,15); // lower arm right
	
	this.addLine(1,16); // neck
	
	this.addCircle(16, this.headRad, this.headColor);

	
	// this.addLine(15,17); // sword
	// this.parts[17].strokeStyle = this.swordColor;


	// var c = 'brown';
	// this.addRectangle(24, 25, 26, 27, '#888888'); // shield
	// this.addLine(24, 25); // shield
	// this.addLine(25, 26); // shield
	// this.addLine(26, 27); // shield
	// this.addLine(27, 24); // shield
	// var c = '#555555';
	// this.parts[19].strokeStyle = c;
	// this.parts[20].strokeStyle = c;
	// this.parts[21].strokeStyle = c;
	// this.parts[22].strokeStyle = c;
	
	
	 
	 
	// ======================================== POSES =========================================
	this.poses['shieldUp'].points = {
		1 : {alpha : +0.00, beta : +0.00, gamma : -0.06},
		5 : {alpha : +0.02, beta : -0.06, gamma : -0.02},
		7 : {alpha : -0.06, beta : +0.10, gamma : -0.02},
		11 : {alpha : +0.00, beta : -0.04, gamma : -0.06},
		10 : {alpha : +0.00, beta : +0.00, gamma : +0.06},
		12 : {alpha : -0.14, beta : -0.08, gamma : +0.14},		
		14 : {alpha : -0.04, beta : +0.14, gamma : +0.00},		
		23 : {alpha : +0.02, beta : -0.26, gamma : -0.00}
//		23 : {alpha : +0.40, beta : +0.54, gamma : -0.44}
	};
	
	this.poses['base'].points = {
		20 : {alpha : 0.0, beta : 0.0, gamma : 0.0}		
	};
	
	this.poses['dead'].points = {
		0 : {alpha : 0.25, beta : 0.0, gamma : 0.25},		
		1 : {alpha : 0.00, beta : 0.0, gamma : 0.0},		
		12 : {alpha : 0.00, beta : 0.0, gamma : 0.0},		
		13 : {alpha : 0.00, beta : 0.0, gamma : 0.0}
	};
	
	var rope1 = 0.05;
	var rope2 = 0.05;
	
	this.poses['stepBase'].points = {
		19 : {alpha : -0.00, beta : +rope1, gamma : 0.0},
		20 : {alpha : -0.00, beta : -rope1, gamma : 0.0},
		21 : {alpha : -rope2, beta : +0.00, gamma : 0.0},
		22 : {alpha : -rope2, beta : -0.00, gamma : 0.0}
	};
	
	this.poses['step1'].points = {
		19 : {alpha : +0.08, beta : +rope1, gamma : 0.0},
		20 : {alpha : +0.08, beta : -rope1, gamma : 0.0},
		21 : {alpha : -rope2, beta : +0.00, gamma : 0.0},
		22 : {alpha : -rope2, beta : -0.00, gamma : 0.0},
		4 : {beta : -0.12},
		5 : {beta : -0.16},
		10 : {beta : -0.06},
		11 : {beta : -0.06},
		12 : {alpha : 0.0, beta : 0.12, gamma : 0.0},
		13 : {alpha : 0.0, beta :  0.08, gamma : 0.0}
	};
	
	this.poses['step2'].points = {
		19 : {alpha : -0.08, beta : +rope1},
		20 : {alpha : -0.08, beta : -rope1},
		21 : {alpha : -rope2, beta : +0.00},
		22 : {alpha : -rope2, beta : -0.00},
		4 : {beta : +0.16},
		5 : {beta : +0.12},
		10 : {beta : +0.06},
		11 : {beta : +0.06},
		12 : {alpha : 0.0, beta : -0.08, gamma : 0.0},
		13 : {alpha : 0.0, beta :  -0.12, gamma : 0.0}
	};
	
	this.poses['stepOne'].y = 0.5;
	this.poses['stepOne'].points = {
		19 : {alpha : -0.08, beta : +rope1},
		20 : {alpha : -0.08, beta : -rope1},
		21 : {alpha : -rope2, beta : +0.00},
		22 : {alpha : -rope2, beta : -0.00},
		4 : {beta : +0.12},
		5 : {beta : +0.16},
		10 : {beta : +0.1},
		11 : {beta : +0.1}
	};
	
	this.poses['stepOneBlocked'].x = 0.0;
	this.poses['stepOneBlocked'].y = -0.2;
	this.poses['stepOneBlocked'].z = 0.8;
	this.poses['stepOneBlocked'].points = {
		19 : {alpha : -0.08, beta : +rope1},
		20 : {alpha : -0.08, beta : -rope1},
		21 : {alpha : -rope2, beta : +0.00},
		22 : {alpha : -rope2, beta : -0.00},
		4 : {beta : +0.12},
		5 : {beta : +0.16},
		10 : {beta : +0.1},
		11 : {beta : +0.1}
	};
	
	this.poses['stepBackBlocked'].x = 0.0;
	this.poses['stepBackBlocked'].y = -0.2;
	this.poses['stepBackBlocked'].z = -0.8;
	this.poses['stepBackBlocked'].points = {
		19 : {alpha : -0.08, beta : +rope1},
		20 : {alpha : -0.08, beta : -rope1},
		21 : {alpha : -rope2, beta : +0.00},
		22 : {alpha : -rope2, beta : -0.00},
		4 : {beta : +0.12},
		5 : {beta : +0.16},
		10 : {beta : +0.1},
		11 : {beta : +0.1}
	};
	
	this.poses['hitNormal1'].points = {
		1 :  {alpha : -0.04, beta : -0.04},
		10 : {beta : -0.12},
		11 : {beta : -0.12},
		13 : {alpha : 0.00, beta : +0.46},
		15 : {alpha : 0.12, beta : +0.08}
	};
	
	//this.poses['hitNormal2'].audio = 'swordswing';
	this.poses['hitNormal2'].points = {
		1 :  {alpha : 0.04, beta : -0.02},
		10 : {beta : +0.14},
		11 : {beta : +0.14},
		13 : {alpha : +0.08, beta : +0.18},
		15 : {alpha : +0.14, beta : -0.02},
		17 : {alpha : +0.22, beta : +0.04}
	};

	//this.poses['hitStraight'].audio = 'swordswing';
	this.poses['hitStraight'].points = {
		0 :  {alpha : +0.00, beta : +0.00, gamma : +0.02},
		1 :  {alpha : +0.02, beta : +0.00, gamma : +0.02},
		5 :  {alpha : +0.02, beta : +0.06, gamma : +0.00},
		10 :  {alpha : +0.00, beta : +0.12, gamma : +0.00},
		11 :  {alpha : +0.00, beta : +0.22, gamma : +0.00},
		13 :  {alpha : +0.22, beta : +0.28, gamma : +0.00},
		15 :  {alpha : +0.20, beta : +0.00, gamma : +0.00},
		17 :  {alpha : +0.24, beta : +0.00, gamma : +0.00}
	};

	this.poses['kick'] = {name:'kick'};
	this.poses['kick'].points = {
		0 :  {alpha : +0.00, beta : +0.00, gamma : -0.00},
		1 :  {alpha : +0.08, beta : +0.10, gamma : -0.04},
		2 :  {alpha : +0.00, beta : +0.00, gamma : -0.00},
		3 :  {alpha : +0.00, beta : +0.00, gamma : -0.00},
		4 :  {alpha : +0.00, beta : +0.00, gamma : -0.00},
		5 :  {alpha : +0.00, beta : +0.30, gamma : -0.00},
		6 :  {alpha : +0.00, beta : +0.00, gamma : -0.00},
		7 :  {alpha : +0.20, beta : +0.00, gamma : -0.00},
		10:  {alpha : +0.00, beta : +0.00, gamma : +0.00},
		11:  {alpha : +0.00, beta : -0.10, gamma : +0.00}
	};
	this.poses['kick2'] = {name:'kick2'};
	this.poses['kick2'].points = {
		0 :  {alpha : +0.02, beta : +0.02, gamma : -0.00},
		1 :  {alpha : +0.08, beta : +0.10, gamma : -0.04},
		2 :  {alpha : +0.00, beta : +0.00, gamma : -0.00},
		3 :  {alpha : +0.00, beta : +0.00, gamma : -0.00},
		4 :  {alpha : +0.00, beta : +0.00, gamma : -0.00},
		5 :  {alpha : +0.00, beta : +0.34, gamma : -0.00},
		6 :  {alpha : +0.00, beta : +0.00, gamma : -0.00},
		7 :  {alpha : -0.12, beta : +0.06, gamma : +0.04},
		10:  {alpha : +0.00, beta : +0.00, gamma : +0.00},
		11:  {alpha : +0.00, beta : -0.25, gamma : +0.00}
	};
	this.animations.kick = {
		name : 'kick',
		phases : [
			{pose : this.poses.kick, duration : 250},
			{pose : this.poses.kick2, duration : 150},
			{pose : this.poses.kick, duration : 200}
		]
	};
	
	this.poses['wounded'] = {name:'wounded'};
	//this.poses['wounded'].audio = 'wound';
	this.poses['wounded'].points = {
		0 :  {alpha : +0.00, beta : +0.00, gamma : -0.03},
		1 :  {alpha : +0.00, beta : +0.00, gamma : -0.07}
	};
	this.animations.wounded = {
		name : 'wounded',
		phases : [
			{pose : this.poses.wounded, duration : 150}
		]
	};
	this.animations.stepOneBlocked = {
		name : 'stepOneBlocked',
		phases : [
			{pose : this.poses.stepOneBlocked, duration : 200}
		]
	};
	
	
	// ======================================== ANIMATIONS =========================================

	var d = 150;
	this.animations.step = {
		audioLoop : 'footstep',
		name : 'walk',
		loop : true,
		phases : [
			{pose : this.poses.step1, duration : d}, 
			{pose : this.poses.stepBase,  duration : d},
			{pose : this.poses.step2, duration : d},
			{pose : this.poses.stepBase,  duration : d}
		]
	};
	
	var d = 300;
	this.animations.stepBackward = {
		//audioLoop : 'footstep',
		name : 'stepBackward',
		loop : false,
		phases : [
			{pose : this.poses.stepOne, duration : d}
		]
	};
	
	d = 100;
	this.animations.hitNormal = {
		//noAudio : true,
		name : 'hitNormal',
		loop : false,
		phases : [
			{pose : this.poses.hitNormal1, duration : 180},
			{pose : this.poses.hitNormal2, duration : 100}
		]
	};
	
	this.animations.die = {
		//audio : 'scream',
		name : 'die',
		loop : false,
		phases : [
			{pose : this.poses.dead, duration : 250}
		]
	};
	
	this.animations.shieldUp = {
		name : 'shieldUp',
		loop : false,
		phases : [
			{pose : this.poses.shieldUp, duration : 300}
		]
	};
	
	this.animations.hitStraight = {
		name : 'hitStraight',
		loop : false,
		phases : [
			{pose : this.poses.hitStraight, duration : 300}
		]
	};
	
	
}



// ===================================== ANIMATION PUBLISHED =============================================

Maze.Obj.Animated.isAnimating = function() {
	for (var a in this.runningAnims) {
		var animation = this.runningAnims[a];
		if (!animation.waitingAtEnd)
			return true;
	}
	return false;
}


Maze.Obj.Animated.animIs = function(animID) {
	var animation = this.runningAnims[animID];
	return (animation != null);
}

Maze.Obj.Animated.animGet = function(animID) {
	var animation = this.runningAnims[animID];
	
	if (!animation) {
		this.runningAnims[animID] = {
			phases : new Array(),
			phase : 1,
			phaseStart : this.maze.timeNow,
			loop : false,
			stopped : false,
			waitingAtEnd : false
		}
		animation = this.runningAnims[animID];
		animation.phases.push({
			pose : this.basePose,
			duration : 0
		});
	}
	
	return animation;
}

Maze.Obj.Animated.animAddPose = function(animID, pose, callback, stopWhenOver) {
	if (typeof callback == 'boolean') {
		stopWhenOver = callback;
		callback = false;
	}
	
	if (this.recording) {
		this.recording.addAnimPose(this, animID, pose, stopWhenOver);
	}
	
	var animation = this.animGet(animID);
		
	animation.phases.push({
		pose : pose,
		duration : pose.duration ? pose.duration : 200,
		callback : callback
	});
	
	if (stopWhenOver)
		this.animStop(animID);
		
	this.animContinue(animID);
}



Maze.Obj.Animated.animAddAnimation = function(animID, newAnim, callback, stopWhenOver) {
	if (typeof callback == 'boolean') {
		stopWhenOver = callback;
		callback = false;
	}
	
	if (this.recording) {
		this.recording.addAnimAnimation(this, animID, newAnim, stopWhenOver);
	}
	
	var animation = this.animGet(animID);

	for (var i in newAnim.phases) {
		var newPhase = newAnim.phases[i];
		animation.phases.push({
			pose : newPhase.pose,
			duration : newPhase.duration ? newPhase.duration : (newPhase.pose.duration ? newPhase.pose.duration : 200)
		});
	}
	
	animation.phases[animation.phases.length-1].callback = callback;

	if (stopWhenOver)
		this.animStop(animID);
	
	animation.loop = newAnim.loop;
	
	if (newAnim.audioLoop) {
		animation.audioLoop = newAnim.audioLoop;
		this.maze.soundPlayLoop(this.audio[animation.audioLoop]);
	}
	
	this.animContinue(animID);
}

Maze.Obj.Animated.animStopAll = function(cancel) {
	for (var i in this.runningAnims) {
		this.animStop(i, null, cancel);
	}
}

Maze.Obj.Animated.animStop = function(animID, callback, cancel) {
	if (typeof callback == 'boolean') {
		cancel = callback;
		callback = false;
	}
	
	if (this.recording) {
		this.recording.addAnimStop(this, animID, cancel);
	}
	

	if (!this.runningAnims[animID])
		return;
	var animation = this.animGet(animID);
	
	if (cancel) {
		animation.phases.splice(animation.phase, 10000);
	}
	
	animation.stopped = true;
	animation.loop = false;
	
	
	if (animation.phases[animation.phases.length-1] != this.basePose) { // must close with base pose
		animation.phases.push({
			pose : this.basePose,
			duration : this.basePose.duration ? this.basePose.duration : 200,
			callback : callback
		});
		this.animContinue(animID);
	} else if (animation.waitingAtEnd) {
		this.animFinish(animID);
	}

	
	

}


Maze.Obj.Animated.animContinue = function(animID) {
	var animation = this.animGet(animID);
	if (animation.waitingAtEnd) {
		animation.waitingAtEnd = false;
		if (animation.phases[animation.phase].trigger)
			this.maze.animTrigger(animation.phases[animation.phase].trigger);
		animation.phaseStart = this.maze.timeNow;
		animation.phase++;
		if (!animation.noAudio) {
			this.maze.soundPlay(this.audio[animation.phases[animation.phase].pose.audio]);
		}
	}
}


Maze.Obj.Animated.animStep = function(animID) {
	var animation = this.runningAnims[animID];
	var phase1 = animation.phases[animation.phase];
	
	if (animation.wait)
		return;

	var timeElapsed = this.maze.timeNow - animation.phaseStart;


	if (timeElapsed > phase1.duration && !animation.waitingAtEnd && !phase1.wait) {
		if (phase1.trigger) {
			this.maze.animTrigger(phase1.trigger);
		}
		// Next phase comming
		if (animation.phases[animation.phase+1]) {
			// Next phase exists
			animation.phaseStart += phase1.duration;
			animation.phase++;
			phase1 = animation.phases[animation.phase];
			if (!animation.noAudio) {
				this.maze.soundPlay(this.audio[phase1.pose.audio]);
			}
		} else {
			// Next phase not exists
			if (animation.loop && !animation.stopped) {
				// Looped animation
				animation.phaseStart += phase1.duration;
				animation.phase = 1;
			} else {
				if (animation.stopped) {
					// Animation stopped... only way to dispose animation, else stay in last state
					this.animFinish(animID);
					return true;
				} else {
					// End of animation, no loop, no next step : stay in last phase
					animation.phaseStart = this.maze.timeNow + phase1.duration; // stay it at the end
					animation.waitingAtEnd = true;
				}
			}
		}
	}
}

Maze.Obj.Animated.animFinish = function(animID) {
	if (!this.runningAnims[animID])
		return;
	var animation = this.animGet(animID);
	if (animation.audioLoop && this.audio[animation.audioLoop]) {
		this.audio[animation.audioLoop].pause();
	}
	delete this.runningAnims[animID];
	if (typeof animation.callback == 'function')
		animation.callback();
}

Maze.Obj.Animated.animClear = function() {
	this.runningAnims = {};
}

Maze.Obj.Animated.animAddWait = function(animID, triggerID) {
	var animation = this.animGet(animID);
	animation.phases[animation.phase-1].wait = triggerID;
}

Maze.Obj.Animated.animAddTrigger = function(animID, triggerID) {
	var animation = this.animGet(animID);
	animation.phases[animation.phases.length-1].trigger = triggerID;
}

Maze.Obj.Animated.animTriggered = function(triggerID) {
	for (var a in this.runningAnims) {
		for (p in this.runningAnims[a].phases) {
			var phase = this.runningAnims[a].phases[p];
			if (phase.wait == triggerID) {
				this.runningAnims[a].phaseStart	 = this.maze.timeNow;
				delete phase.wait;
			}
		}
	}
}



// ===================================================== TOOOOOOL =============================================

Maze.Obj.Animated.addPoint = function(root, len, alpha, beta, gamma, name) {
	this.points.push({root : root, len : len, alpha : alpha, beta : beta, gamma : gamma, name : name});
}

Maze.Obj.Animated.addLine = function(p0, p1, p2) {
	// p2 only for z index!
	this.parts.push({kind : 'line', p0:p0, p1:p1, p2 : p2});
}

Maze.Obj.Animated.addCircle = function(p0, rad, fillStyle) {
	this.parts.push({kind : 'circle', p0:p0, rad : rad, fillStyle : fillStyle});
}

Maze.Obj.Animated.addRectangle = function(p0, p1, p2, p3, fillStyle) {
	this.parts.push({kind : 'rectangle', p0:p0, p1:p1, p2:p2, p3:p3, fillStyle : fillStyle});
}



Maze.TD = function() {};
Maze.TD.rotateNormal = function(p0, normal, vector, teta) {
	result = {x:0.0, y : 0.0, z : 0.0};
	var x = vector.x;
	var y = vector.y;
	var z = vector.z;

	var a = p0.x;
	var b = p0.y;
	var c = p0.z;
	
	var u = normal.x;
	var v = normal.y;
	var w = normal.z;
	
	var sinTeta = Math.sin(teta);
	var cosTeta = Math.cos(teta);

	result.x = (a * (v*v + w*w) - u * (b*v + c*w - u*x - v*y - w*z)) * (1 - cosTeta) + x * cosTeta + (-c*v + b*w - w*y + v*z) * sinTeta;
	result.y = (b * (u*u + w*w) - v * (a*u + c*w - u*x - v*y - w*z)) * (1 - cosTeta) + y * cosTeta + (+c*u - a*w + w*x - u*z) * sinTeta;
	result.z = (c * (u*u + v*v) - w * (a*u + b*v - u*x - v*y - w*z)) * (1 - cosTeta) + z * cosTeta + (-b*u + a*v - v*x + u*y) * sinTeta;
	
	return result;
}