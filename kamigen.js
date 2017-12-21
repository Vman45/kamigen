//var generator = tgen.init(256, 256);
var water, light;
var parameters = {
	oceanSide: 15000,
	size: .15337,
	distortionScale: 3.7,
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

	/// GUI

	effectController  = {
		turbidity: 10,
		rayleigh: 2,
		mieCoefficient: 0.005,
		mieDirectionalG: 0.8,
		luminance: 1,
		inclination: 0.175, // elevation / inclination
		azimuth: 0.25, // Facing front,
		sun: ! true
	};

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
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 900000 );
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
	camera_controls.movementSpeed = 500;
	camera_controls.lookSpeed = 0.05;

	setWater();

	ship = drawShip();
	ship.add(camera);
	
	scene.add( ship );

	initSky();

	initLand();

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
	var waterGeometry = new THREE.PlaneBufferGeometry( parameters.oceanSide * 5, parameters.oceanSide * 5, 1000, 1000 );
	water = new THREE.Water(
		waterGeometry,
		{
			clipBias: -0.0000001,
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
			side: THREE.DoubleSide
		}
	);

	water.rotation.x = - Math.PI / 2;
	water.receiveShadow = true;

	scene.add( water );

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
	var material = new THREE.MeshLambertMaterial( { color: 0xFFAA00, wireframe: false } );
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
	camera_controls.handleResize();
}
//
function animate() {
	requestAnimationFrame( animate );
	render();
}
function render() {
	var delta = clock.getDelta(),
		time = clock.getElapsedTime() * 10;

	water.material.uniforms.time.value += 1.0 / 60.0;

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
	stats.update();
	renderer.render( scene, camera );
}

function generateHeight( width, height ) {
	var size = width * height, data = new Uint8Array( size ),
	perlin = new ImprovedNoise(), quality = 1, z = Math.random() * 1000;

	for ( var j = 0; j < 4; j ++ ) {
		for ( var i = 0; i < size; i ++ ) {
			var x = i % width, y = ~~ ( i / width );
			data[ i ] += Math.abs( perlin.noise( x / quality, y / quality, z ) * quality * 1.75 );
		}
		quality *= 5;
	}
	return data;
}
function generateTexture( data, width, height ) {
	var canvas, canvasScaled, context, image, imageData,
	level, diff, vector3, sun, shade;
	vector3 = new THREE.Vector3( 0, 0, 0 );
	sun = new THREE.Vector3( 1, 1, 1 );
	sun.normalize();
	canvas = document.createElement( 'canvas' );
	canvas.width = width;
	canvas.height = height;
	context = canvas.getContext( '2d' );
	context.fillStyle = '#000';
	context.fillRect( 0, 0, width, height );
	image = context.getImageData( 0, 0, canvas.width, canvas.height );
	imageData = image.data;
	for ( var i = 0, j = 0, l = imageData.length; i < l; i += 4, j ++ ) {
		vector3.x = data[ j - 2 ] - data[ j + 2 ];
		vector3.y = 2;
		vector3.z = data[ j - width * 2 ] - data[ j + width * 2 ];
		vector3.normalize();
		shade = vector3.dot( sun );
		imageData[ i ] = ( 96 + shade * 128 ) * ( 0.5 + data[ j ] * 0.007 );
		imageData[ i + 1 ] = ( 32 + shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );
		imageData[ i + 2 ] = ( shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );
	}
	context.putImageData( image, 0, 0 );
	// Scaled 4x
	canvasScaled = document.createElement( 'canvas' );
	canvasScaled.width = width * 4;
	canvasScaled.height = height * 4;
	context = canvasScaled.getContext( '2d' );
	context.scale( 4, 4 );
	context.drawImage( canvas, 0, 0 );
	image = context.getImageData( 0, 0, canvasScaled.width, canvasScaled.height );
	imageData = image.data;
	for ( var i = 0, l = imageData.length; i < l; i += 4 ) {
		var v = ~~ ( Math.random() * 5 );
		imageData[ i ] += v;
		imageData[ i + 1 ] += v;
		imageData[ i + 2 ] += v;
	}
	context.putImageData( image, 0, 0 );
	return canvasScaled;
}
