(function (global) {
    'use strict';
    // Code
	var container, stats;
	var camera, controls, scene, renderer;
	var mesh, texture, geometry, material;
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

		camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 );
		camera.position.y = 200;
		controls = new THREE.FirstPersonControls( camera );
		controls.movementSpeed = 500;
		controls.lookSpeed = 0.1;

		scene = new THREE.Scene();
		scene.background = new THREE.Color( 0x66CCFF );
		scene.fog = new THREE.FogExp2( 0x66CCFF, 0.0005 );
		geometry = new THREE.PlaneGeometry( 20000, 20000, worldWidth - 1, worldDepth - 1 );
		geometry.rotateX( - Math.PI / 2 );
		for ( var i = 0, l = geometry.vertices.length; i < l; i ++ ) {
			geometry.vertices[ i ].y = 35 * Math.sin( i / 2 );
		}
		var canvas = draw_texture();
		
		texture = new THREE.Texture(canvas);
		texture.anisotropy  = renderer.capabilities.getMaxAnisotropy();
		texture.needsUpdate = true;
				
		material = new THREE.MeshBasicMaterial( { map: texture } );

		mesh = new THREE.Mesh( geometry, material );
		scene.add( mesh );
		
		stats = new Stats();
		container.appendChild( stats.domElement );

		window.addEventListener( 'resize', onWindowResize, false );
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
		for ( var i = 0, l = geometry.vertices.length; i < l; i ++ ) {
			geometry.vertices[ i ].y = 35 * Math.sin( i / 5 + ( time + i ) / 7 );
		}
		mesh.geometry.verticesNeedUpdate = true;
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