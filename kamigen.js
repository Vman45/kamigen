//var generator = tgen.init(256, 256);
var water, light;
var parameters = {
	oceanSide: 2000,
	size: .025,
	distortionScale: 3.7,
	alpha: 1.0
};
var waterNormals;
var container, stats;
var keyboard, ship;
var camera, camera_controls, scene, renderer;
var water, texture, water_geometry, material;
var worldWidth = 128, worldDepth = 128,
worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;
var clock = new THREE.Clock();
init();
animate();
function init() {
	keyboard	= new THREEx.KeyboardState();
	container = document.getElementById( 'container' );
	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.innerHTML = "";
	container.appendChild( renderer.domElement );

	scene = new THREE.Scene(0x66CCFF, .0000001);
	scene.background = new THREE.Color( 0x66CCFF );
	scene.fog = new THREE.FogExp2( 0x66CCFF, 0.00023 );
	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 );
	camera.position.y = 800;
	camera.position.z = - 1500;
	
	light = new THREE.PointLight( 0xffffff );
	light.position.copy( camera.position );
	scene.add( light );
	
	camera_controls = new THREE.OrbitControls( camera, renderer.domElement );
	camera_controls.movementSpeed = 500;
	camera_controls.lookSpeed = 0.05;

	setWater();

	ship = drawShip();
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
	ship.position.set(500, 500, 0);
	
	return ship;
}

function setWater() {
	
	water = new THREE.Water(
		parameters.oceanSide * 5,
		parameters.oceanSide * 5,
		{
			textureWidth: 512,
			textureHeight: 512,
			waterNormals: new THREE.TextureLoader().load( './libs/waternormals.jpg', function ( texture ) {
				texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			}),
			alpha: 	parameters.alpha,
			sunDirection: light.position.clone().normalize(),
			sunColor: 0xffffff,
			waterColor: 0x001e0f,
			distortionScale: parameters.distortionScale,
			fog: scene.fog != undefined
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
	stats.update();
}
function render() {
	var delta = clock.getDelta(),
		time = clock.getElapsedTime() * 10;

	water.geometry.verticesNeedUpdate = true;
	camera_controls.update( delta );
	water.material.uniforms.time.value += 1.0 / 60.0;
	water.material.uniforms.size.value = parameters.size;
	water.material.uniforms.distortionScale.value = parameters.distortionScale;
	water.material.uniforms.alpha.value = parameters.alpha;

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
	renderer.render( scene, camera );
}

function draw_texture () {
	var delta = clock.getElapsedTime();
	var texture_image = document.getElementById("waterTexture");
	var height = 256;
	var width = 256;
	texture_image.height = height;
	texture_image.width = width;

	var context = texture_image.getContext('2d');
	var params = {
		"width": 256,
		"height": 256,
		"items": [
			[0, "pyramids", {"blend": "lighten", "rgba": [[0, 10], [20, 80], [150, 255], [0.7, 1]]}],
			[0, "pyramids", {
				"blend": "lineardodge",
				"dynamic": true,
				"rgba": [170, 170, 170, [0.7, 1]]
			}],
			[0, "waves", {"blend": "softlight"}],
			[0, "waves", {"blend": "softlight"}],
			[0, "map", {
				"xamount": [10, 144],
				"yamount": [10, 144],
				"xchannel": [0, 3],
				"ychannel": [0, 3],
				"xlayer": 0,
				"ylayer": 0
			}],
			[0, "brightness", {"adjust": 20}],
			[0, "contrast", {"adjust": 30}]
		]
	};

    var canvas3 = generator.render(params).toCanvas();
    context.drawImage(canvas3, 0, 0);
    
	return texture_image;
}

function setPixel(imageData, x, y, r, g, b, a) {
    var index = (x + y * imageData.width) * 4;
    imageData.data[index+0] = r;
    imageData.data[index+1] = g;
    imageData.data[index+2] = b;
    imageData.data[index+3] = a;
}
