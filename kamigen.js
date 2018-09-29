var NEAR = 1e-6, FAR = 1e27;
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
			5000 + 9250 * Math.random(),
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
		azimuth: 5, // Facing front,
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
	var displacementMap = new THREE.TextureLoader().load( "/assets/height.png" );
	var map = new THREE.TextureLoader().load( "/assets/texture.png" );

	var sandMap = new THREE.TextureLoader().load( "/assets/sand.jpg", function ( texture ) {
				texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		});
	var forestMap = new THREE.TextureLoader().load( "/assets/forest.jpg" , function ( texture ) {
				texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			});
	var volcanoMap = new THREE.TextureLoader().load( "/assets/volcano.jpg" , function ( texture ) {
				texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			});

 	var customMaterial = new THREE.ShaderMaterial( 
	{
	  uniforms: {
			bumpTexture:	{ type: "t", value: displacementMap },
			bumpScale:	  { type: "f", value: 24361.43 },
			texture:	{ type: "t", value: map },
			sandyTexture:	{ type: "t", value: sandMap },
			grassTexture:	{ type: "t", value: forestMap },
			rockyTexture:	{ type: "t", value: volcanoMap },
		},
		vertexShader:   document.getElementById( 'landVertexShader'   ).textContent,
		fragmentShader: document.getElementById( 'landFragmentShader' ).textContent,
		transparent: true
	}   );
	var geometry = new THREE.PlaneBufferGeometry( 200000, 200000, 200, 200 );
	var land  = new THREE.Mesh( geometry, customMaterial ) ;
	land.position.y = -900;
	land.position.z =  -5000;
	land.position.x = - 75000;
	land.rotation.x = - Math.PI / 2;
	scene.add( land );
	console.log(land);
	var box = new THREE.BoxHelper( land, 0xffff00 );
	box.update();
	scene.add( box );
}
function init() {
	keyboard	= new THREEx.KeyboardState();
	container = document.getElementById( 'container' );
	renderer = new THREE.WebGLRenderer({
		// antialias: true,
		logarithmicDepthBuffer: false
	});
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.innerHTML = "";
	container.appendChild( renderer.domElement );

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 100, parameters.oceanSide * 10000 );
	camera.position.y = 120;
	camera.position.z = - 1600;
	
	var amb_light = new THREE.AmbientLight( 0xffffff, Math.PI / 10 );
	scene.add( amb_light );

	light = new THREE.DirectionalLight( 0xffffff, Math.PI / 2 );
	scene.add( light );
	
	camera_controls = new THREE.OrbitControls( camera, renderer.domElement );
	camera_controls.target.set(0,0,0);
	
	setWater();

	ship = drawShip();
		
	scene.add( ship );
	ship.add(camera);
	ship.rotateY(-Math.PI/2);

	initSky();
	initLand();

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
	ship.position.set(0, 750, 0);
	
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
			sunDirection: light.position.clone().normalize(),
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
	var geometry = new THREE.OctahedronGeometry( 30, 2);
	var texture = new THREE.TextureLoader().load( './vendor/camo.png', function ( texture ) {
		texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping;
		texture.repeat.set( 1., 2.5 );
	});
	var material = new THREE.MeshLambertMaterial( { map: texture } );
	var fuselage = new THREE.Mesh( geometry, material );

	fuselage.scale.set(1,5,1);
	fuselage.position.set(0, -120, 0);
	fuselage.rotation.set(-Math.PI / 2, Math.PI / 2, 0);

	return fuselage;
}

function getCockpit() {
	var geometry = new THREE.OctahedronGeometry( 30, 1);
	var material = new THREE.MeshToonMaterial( { color: 0x003366, shininess: 100 } );
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
	var material = new THREE.MeshLambertMaterial( { map: texture, wireframe: false } );
	var wing = new THREE.Mesh( geometry, material );
	

	if (side == 'port') {
		wing.position.set(-120,-240,-10);
		wing.rotation.set(0, Math.PI / 3 , -Math.PI / 2);
	}
	if (side == 'starboard') {
		wing.position.set(120,-240,-10);
		wing.rotation.set(0, ((2 * Math.PI) / 3) , -Math.PI / 2);
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
		ship.translateZ(20);
	}
	if (keyboard.pressed("s")) {
		ship.translateZ(-20);
	}
	if (keyboard.pressed("a")) {
		ship.rotateY(Math.PI / 180);
	}
	if (keyboard.pressed("d")) {
		ship.rotateY(-Math.PI / 180);
	}
	if (keyboard.pressed(" ")) {
		ship.translateY(20);
	}
	if (keyboard.pressed("shift")) {
		ship.translateY(-20);
	}
	
	requestAnimationFrame( animate );
	render();
}
function render() {
	var delta = clock.getDelta(),
		time = clock.getElapsedTime() * 10;
	
	water.material.uniforms.time.value += 1.0 / 60.0;
	
	if (effectController) {
		var distance = 40000;

		var uniforms = sky.material.uniforms;
		uniforms.turbidity.value = effectController.turbidity;
		uniforms.rayleigh.value = effectController.rayleigh;
		uniforms.luminance.value = effectController.luminance;
		uniforms.mieCoefficient.value = effectController.mieCoefficient;
		uniforms.mieDirectionalG.value = effectController.mieDirectionalG;

		sunSphere.visible = effectController.sun;

		var theta = Math.PI * ( effectController.inclination - 0.5 );
		var phi = 2 * Math.PI * ( effectController.azimuth - 0.5 );

		light.position.x = sunSphere.position.x = distance * Math.cos( phi );
		light.position.y = sunSphere.position.y = distance * Math.sin( phi ) * Math.sin( theta );
		light.position.z = sunSphere.position.z = distance * Math.sin( phi ) * Math.cos( theta );	

		uniforms.sunPosition.value.copy( sunSphere.position );
	}

	camera_controls.update( delta );
	camera.lookAt(ship.position);
	stats.update();

	renderer.render( scene, camera );
}

var fire_material = new THREE.SpriteMaterial( {
	map: new THREE.TextureLoader().load( './vendor/smoke.png'),
	blending: THREE.AdditiveBlending
} );
function initParticles() {

	var scale = Math.random() * 32 + 16;
	var thrust = 360 * Math.random();
	var right_thruster = new THREE.Sprite( fire_material );
	right_thruster.position.set( ship.position.x, ship.position.y, ship.position.z );
	right_thruster.rotation.set( ship.rotation.x, ship.rotation.y, ship.rotation.z );
	right_thruster.translateX(-150);
	right_thruster.translateZ(-80);
	right_thruster.material.rotation = thrust;
	initParticle(right_thruster, scale);

	var left_thruster = new THREE.Sprite( fire_material );
	left_thruster.position.set( ship.position.x, ship.position.y, ship.position.z );
	left_thruster.rotation.set( ship.rotation.x, ship.rotation.y, ship.rotation.z );
	left_thruster.translateX(150);
	left_thruster.translateZ(-80);
	left_thruster.material.rotation = -thrust;
	initParticle(left_thruster, scale);
}

function initParticle( particle, scale ) {
	particle.scale.x = particle.scale.y = scale;
	particle.translateY(-120);
	new TWEEN.Tween( particle.scale )
		.onComplete(function(){ scene.remove(particle) })
		.to( { x: 0.01, y: 0.01 }, 1000 )
		.start();
	scene.add( particle );
}
