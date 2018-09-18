//var generator = tgen.init(256, 256);
var water, light;
var parameters = {
	oceanSide: 150000,
	size: 1,
	distortionScale: 50,
	alpha: 0.8
};
var waterNormals;
var container, stats;
var keyboard, ship;
var camera, camera_controls, scene, renderer;
var water, texture, water_geometry, material;
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
	
	light = new THREE.DirectionalLight( 0xffffff, 0.8 );
	light.position.set( - 30, 30, 30 );
	light.castShadow = true;
	light.shadow.camera.top = 45;
	light.shadow.camera.right = 40;
	light.shadow.camera.left = light.shadow.camera.bottom = -40;
	light.shadow.camera.near = 1;
	light.shadow.camera.far = 200;
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
	ship.position.set(500, 750, 0);
	
	return ship;
}

function setWater() {
	var waterGeometry = new THREE.CircleBufferGeometry( parameters.oceanSide * 5, 1000 );
	water = new THREE.Water(
		waterGeometry,
		{
			clipBias: -0.00001,
			textureWidth: 512,
			textureHeight: 512,
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
	var geometry = new THREE.OctahedronGeometry( 30, 1);
	var material = new THREE.MeshToonMaterial( {color: 0xffAA00} );
	var fuselage = new THREE.Mesh( geometry, material );

	fuselage.scale.set(5,1,1);
	fuselage.position.set(0, -120, 0);
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
	var material = new THREE.MeshToonMaterial( { color: 0xFFAA00, wireframe: false } );
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
//
function animate() {
	if (keyboard.pressed("w")) {
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

		light.position.set( sunSphere.position );

		sunSphere.visible = effectController.sun;

		uniforms.sunPosition.value.copy( sunSphere.position );
	}

	camera_controls.update( delta );
	camera.lookAt(ship.position);
	stats.update();
	renderer.render( scene, camera );
}
