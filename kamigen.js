(function (global) {
    'use strict';
    // Code
	var container, stats;
	var camera, controls, scene, renderer;
	var water, texture, water_geometry, material;
	var worldWidth = 128, worldDepth = 128,
	worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;
	var clock = new THREE.Clock();
	init();
	animate();
	function init() {
		container = document.getElementById( 'container' );
		renderer = new THREE.WebGLRenderer();
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		container.innerHTML = "";
		container.appendChild( renderer.domElement );

		scene = new THREE.Scene();
		scene.background = new THREE.Color( 0x66CCFF );
		scene.fog = new THREE.FogExp2( 0x66CCFF, 0.0005 );
		camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 );
		camera.position.y = 200;

		var light = new THREE.PointLight( 0xffffff );
		light.position.copy( camera.position );
		scene.add( light );
		
		controls = new THREE.OrbitControls( camera, renderer.domElement );
		controls.movementSpeed = 500;
		controls.lookSpeed = 0.05;

		water_geometry = new THREE.PlaneGeometry( 20000, 20000, worldWidth - 1, worldDepth - 1 );
		water_geometry.rotateX( - Math.PI / 2 );
		for ( var i = 0, l = water_geometry.vertices.length; i < l; i ++ ) {
			water_geometry.vertices[ i ].y = 35 * Math.sin( i / 2 );
		}
		var canvas = draw_texture();
		
		texture = new THREE.Texture(canvas);
		texture.anisotropy  = renderer.capabilities.getMaxAnisotropy();
		texture.needsUpdate = true;
				
		material = new THREE.MeshBasicMaterial( { map: texture } );

		water = new THREE.Mesh( water_geometry, material );
		scene.add( water );
		
		var ship = drawShip()
		ship.add(camera);
		scene.add( ship );
		stats = new Stats();
		container.appendChild( stats.domElement );

		window.addEventListener( 'resize', onWindowResize, false );
	}

	function drawShip() {
		var ship;

		var wingPort = getWing('port');
		var wingStarboard = getWing('starboard');

		var fuselage = getFuselage();
		
		ship = new THREE.Object3D();
		ship.add(wingPort);
		ship.add(wingStarboard);
		ship.add(fuselage);
		ship.position.set(500, 200, 0);
		
		return ship;
	}

	function getFuselage() {
		var geometry = new THREE.CylinderGeometry( 15, 2, 50, 32 );
		var material = new THREE.MeshBasicMaterial( {color: 0xffAA00} );
		var nose = new THREE.Mesh( geometry, material );
		nose.rotation.set(0, 0, Math.PI / 2);
		nose.position.set(150, 0, 0);

		geometry = new THREE.CylinderGeometry( 15, 15, 250, 32 );
		var body = new THREE.Mesh(geometry, material);
		body.rotation.set(0, 0, Math.PI / 2);

		var fuselage = new THREE.Object3D();
		fuselage.add(nose);
		fuselage.add(body);
		fuselage.position.set(0,-120, 0);

		return fuselage;
	}

	function getWing(side) {

		if (side == 'port') {
			var closedSpline = new THREE.CatmullRomCurve3( [		
				new THREE.Vector3(  -120,  20, 120 ),
				new THREE.Vector3(  -120,  20, -120 )
			] );
		}
		if (side == 'starboard') {
			var closedSpline = new THREE.CatmullRomCurve3( [		
				new THREE.Vector3(  -120,  20, -120 ),
				new THREE.Vector3(  -120,  20, 120 )
			] );	
		}
		closedSpline.type = 'catmullrom';
		closedSpline.closed = true;
		var extrudeSettings = {
			steps			: 10,
			bevelEnabled	: false,
			extrudePath		: closedSpline
		};
		var pts = [], count = 3;
		for ( var i = 0; i < count; i ++ ) {
			var l = 30;
			var a = 20 * i / count * Math.PI;
			pts.push( new THREE.Vector2 ( Math.cos( a ) * l, Math.sin( a ) * 4 ) );
		}
		var shape = new THREE.Shape( pts );
		var geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
		var material = new THREE.MeshLambertMaterial( { color: 0xFFAA00, wireframe: false } );
		var wing = new THREE.Mesh( geometry, material );
		wing.rotation.set(0, 0 , Math.PI / 2);

		if (side == 'port') {
			wing.position.set(0,0,-130);	
		}
		if (side == 'starboard') {
			wing.position.set(0,0,130);
		}
		
		return wing;
	}

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
		controls.handleResize();
	}
	//
	function animate() {
		requestAnimationFrame( animate );
		render();
		stats.update();
	}
	function render() {
		var delta = clock.getDelta(),
			time = clock.getElapsedTime() * 10;
		for ( var i = 0, l = water_geometry.vertices.length; i < l; i ++ ) {
			water_geometry.vertices[ i ].y = 35 * Math.sin( i / 5 + ( time + i ) / 7 );
		}
		water.geometry.verticesNeedUpdate = true;
		controls.update( delta );
		renderer.render( scene, camera );
	}

	function draw_texture () {
		var texture_image = document.createElement("canvas");
		var height = 128;
		var width = 128;
		texture_image.height = height;
		texture_image.width = width;
		var simplex = new SimplexNoise();
	
		var context = texture_image.getContext('2d');
		// Create the yellow face
		var twopi = Math.PI * 2;
		var imageData = context.createImageData(height, width);
		for (var i = 0; i < width; i++) {
			var n = simplex.noise(width , i);
			for (var j = 0; j < height; j++) {
				n -= simplex.noise(height, j);
				var red =  1.25 * Math.sin(i  * n / twopi) ; 
				var green = 125 * Math.cos(i  * n  / twopi) ; 
				var blue =  250 * Math.cos(i  * n  / twopi) ;
				
				red = Math.floor(red);
				green = Math.floor(green);
				blue = Math.floor(blue);
				setPixel(imageData, i, j, red, green, blue, 255);
			}
		}
		context.putImageData(imageData, 0,0);
	
		return texture_image;
	}
	
	function setPixel(imageData, x, y, r, g, b, a) {
	    var index = (x + y * imageData.width) * 4;
	    imageData.data[index+0] = r;
	    imageData.data[index+1] = g;
	    imageData.data[index+2] = b;
	    imageData.data[index+3] = a;
	}

}(this));