var water, light;
var parameters = {
	oceanSide: 150000,
	size: 1,
	distortionScale: 8,
	alpha: 1
};
var waterNormals;
var container, stats;
var keyboard, ship;
var camera, camera_controls, scene, renderer;
var water, texture, water_geometry, material, particle;
var worldWidth = 256, worldDepth = 256,
worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;
var clock = new THREE.Clock();
var sky;
var sunSphere;
var effectController;
init();
animate();

/* World building functions */
function initSky() {
	// Add Sky
	sky = new THREE.Sky();
	sky.scale.setScalar( 450000 );
	scene.add( sky );

	// Add Sun Helper
	sunSphere = new THREE.Mesh(
		new THREE.SphereBufferGeometry( 20000, 16, 8 ),
		new THREE.MeshBasicMaterial( { color: 0xffffff } )
	);
	sunSphere.position.y = - 700000;
	sunSphere.visible = false;
	scene.add( sunSphere );

	for (var i = 0; i < 100; i++) {
		// Credit - https://stackoverflow.com/a/13455101/8255070
		var x = Math.floor(Math.random()*99) + 1; // this will get a number between 1 and 99;
		x *= Math.floor(Math.random()*2) == 1 ? 1 : -1; 
		var y = Math.floor(Math.random()*99) + 1; // this will get a number between 1 and 99;
		y *= Math.floor(Math.random()*2) == 1 ? 1 : -1; 
		addCloud(new THREE.Vector3(
			(parameters.oceanSide / 100) * x,
			2000 + 3250 * Math.random(),
			(parameters.oceanSide / 100) * y)
		);	
	} 
	
	
	// old GUI params
	effectController  = {
		turbidity: 10,
		rayleigh: 2,
		mieCoefficient: 0.005,
		mieDirectionalG: 0.8,
		luminance: 1,
		inclination: 0.475, // elevation / inclination
		azimuth: 0.45, // Facing front,
		sun: ! true
	};

}

function addCloud(position) {
	var spriteMap = new THREE.TextureLoader().load( "./vendor/cloud.png" );
	var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff } );
	var sprite = new THREE.Sprite( spriteMaterial );
	sprite.position.set(position.x, position.y, position.z);
	var randomer = Math.random();
	sprite.scale.set(1000 * randomer,1000 * randomer,1);
	scene.add( sprite );
}

function initLand() {
	var data = generateHeight( worldWidth, worldDepth );
	var geometry = new THREE.PlaneBufferGeometry( 15000, 15000, worldWidth - 1, worldDepth - 1 );
	geometry.rotateX( - Math.PI / 2 );
	var vertices = geometry.attributes.position.array;
	for ( var i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
		vertices[ j + 1 ] = data[ i ] * 10;
	}
	texture = new THREE.CanvasTexture( generateTexture( data, worldWidth, worldDepth ) );
	texture.wrapS = THREE.ClampToEdgeWrapping;
	texture.wrapT = THREE.ClampToEdgeWrapping;
	var land  = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { map: texture, side: THREE.DoubleSide, transparent: true } ) );
	land.position.y = -500;
	land.position.z = 1000;
	scene.add( land );
}
function init() {
	keyboard	= new THREEx.KeyboardState();
	container = document.getElementById( 'container' );
	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.innerHTML = "";
	container.appendChild( renderer.domElement );

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, parameters.oceanSide * 10 );
	camera.position.y = 800;
	camera.position.z = - 1500;
	
	var light = new THREE.AmbientLight( 0xffffff ); // soft white light
	scene.add( light );

	
	camera_controls = new THREE.OrbitControls( camera, renderer.domElement );
	camera_controls.target.set(0,0,0);
	
	setWater();

	ship = drawShip();
		
	scene.add( ship );
	ship.add(camera);

	initSky();
	//initLand();

	stats = new Stats();
	document.getElementById( 'stats' ).appendChild( stats.domElement );

	window.addEventListener( 'resize', onWindowResize, false );
}

function drawShip() {
	var ship;

	var wingPort = getWing('port');
	var wingStarboard = getWing('starboard');
	var cockpit = getCockpit();
	var fuselage = getFuselage();
	
	ship = new THREE.Object3D();
	ship.add(wingPort);
	ship.add(wingStarboard);
	ship.add(fuselage);
	ship.add(cockpit);
	ship.position.set(500, 750, 0);
	
	return ship;
}

function setWater() {
	var waterGeometry = new THREE.CircleBufferGeometry( parameters.oceanSide * 5, 1000 );
	water = new THREE.Water(
		waterGeometry,
		{
			clipBias: -0.000001,
			textureWidth: 1024,
			textureHeight: 1024,
			waterNormals: new THREE.TextureLoader().load( './vendor/waternormals.jpg', function ( texture ) {
				texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			}),
			alpha: 	parameters.alpha,
			sunDirection: new THREE.Vector3(0,0,0),
			sunColor: 0x66CCFF,
			waterColor: 0x001e0f,
			distortionScale: parameters.distortionScale,
			fog: scene.fog != undefined,
			side: THREE.DoubleSide,
			size: parameters.size
		}
	);

	water.rotation.x = - Math.PI / 2;
	water.receiveShadow = true;

	scene.add( water );

}

function getFuselage() {
	var geometry = new THREE.OctahedronGeometry( 30, 1);
	var texture = new THREE.TextureLoader().load( './vendor/camo.png', function ( texture ) {
		texture.wrapS = texture.wrapT = THREE.RepeatWrappinge;
		texture.repeat.set( 1.8, 1. );
	});
	var material = new THREE.MeshLambertMaterial( { map: texture } );
	var fuselage = new THREE.Mesh( geometry, material );

	fuselage.scale.set(5,1,1);
	fuselage.position.set(0, -120, 0);
	fuselage.rotation.set(0, -Math.PI / 2, 0);

	return fuselage;
}

function getCockpit() {
	var geometry = new THREE.OctahedronGeometry( 30, 1);
	var material = new THREE.MeshToonMaterial( { color: 0x66CCFF, alpha: 0.85 } );
	var fuselage = new THREE.Mesh( geometry, material );

	fuselage.scale.set(.8,.35,.45);
	fuselage.position.set(0, -110, 115);
	fuselage.rotation.set(0, -Math.PI / 2, 0);

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
	var texture = new THREE.TextureLoader().load( './vendor/camo.png', function ( texture ) {
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set( .005, .005 );
	});
	var material = new THREE.MeshToonMaterial( { map: texture, wireframe: false } );
	var wing = new THREE.Mesh( geometry, material );
	wing.rotation.set(0, Math.PI / 2 , Math.PI / 2);

	if (side == 'port') {
		wing.position.set(-130,0,0);	
	}
	if (side == 'starboard') {
		wing.position.set(130,0,0);
	}
	
	return wing;
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
	TWEEN.update();
	if (keyboard.pressed("w")) {
		initParticles();		
		ship.translateZ(10);
	}
	if (keyboard.pressed("s")) {
		ship.translateZ(-10);
	}
	if (keyboard.pressed("a")) {
		ship.rotateY(Math.PI / 180);
	}
	if (keyboard.pressed("d")) {
		ship.rotateY(-Math.PI / 180);
	}
	if (keyboard.pressed(" ")) {
		ship.translateY(10);
	}
	if (keyboard.pressed("shift")) {
		ship.translateY(-10);
	}
	
	requestAnimationFrame( animate );
	render();
}
function render() {
	var delta = clock.getDelta(),
		time = clock.getElapsedTime() * 10;
	
	water.material.uniforms.time.value += 1.0 / 60.0;
	
	if (effectController) {
		var distance = 400000;

		var uniforms = sky.material.uniforms;
		uniforms.turbidity.value = effectController.turbidity;
		uniforms.rayleigh.value = effectController.rayleigh;
		uniforms.luminance.value = effectController.luminance;
		uniforms.mieCoefficient.value = effectController.mieCoefficient;
		uniforms.mieDirectionalG.value = effectController.mieDirectionalG;

		var theta = Math.PI * ( effectController.inclination - 0.5 );
		var phi = 2 * Math.PI * ( effectController.azimuth - 0.5 );

		sunSphere.position.x = distance * Math.cos( phi );
		sunSphere.position.y = distance * Math.sin( phi ) * Math.sin( theta );
		sunSphere.position.z = distance * Math.sin( phi ) * Math.cos( theta );

		sunSphere.visible = effectController.sun;

		uniforms.sunPosition.value.copy( sunSphere.position );
	}

	camera_controls.update( delta );
	camera.lookAt(ship.position);
	stats.update();

	renderer.render( scene, camera );
}

function generateSprite() {
	var canvas = document.createElement( 'canvas' );
	canvas.width = 8;
	canvas.height = 8;
	var context = canvas.getContext( '2d' );
	var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );
	gradient.addColorStop( 0, 'rgba(255,255,255,1)' );
	gradient.addColorStop( 0.3, 'rgba(0,255,0,1)' );
	gradient.addColorStop( 0.5, 'rgba(0,64,0,1)' );
	gradient.addColorStop( 1, 'rgba(0,0,0,1)' );
	context.fillStyle = gradient;
	context.fillRect( 0, 0, canvas.width, canvas.height );
	return canvas;
}

function initParticles() {
	var fire_material = new THREE.SpriteMaterial( {
		map: new THREE.CanvasTexture( generateSprite() ),
		blending: THREE.AdditiveBlending
	} );

	var scale = Math.random() * 32 + 16;
	var right_thruster = new THREE.Sprite( fire_material );
	right_thruster.position.set( ship.position.x, ship.position.y, ship.position.z );
	right_thruster.rotation.set( ship.rotation.x, ship.rotation.y, ship.rotation.z );
	right_thruster.translateX(-150);
	initParticle(right_thruster, scale);

	var left_thruster = new THREE.Sprite( fire_material );
	left_thruster.position.set( ship.position.x, ship.position.y, ship.position.z );
	left_thruster.rotation.set( ship.rotation.x, ship.rotation.y, ship.rotation.z );
	left_thruster.translateX(150);
	initParticle(left_thruster, scale);
}

function initParticle( particle, scale ) {
	particle.scale.x = particle.scale.y = scale;
	particle.translateY(-120);
	new TWEEN.Tween( particle.scale )
		.to( { x: 0.01, y: 0.01 }, 1000 )
		.start();
	scene.add( particle );
}