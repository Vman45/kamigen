var ManifoldApplication = (function ($, THREE, TWEEN$1) {
  'use strict';

  $ = $ && $.hasOwnProperty('default') ? $['default'] : $;
  THREE = THREE && THREE.hasOwnProperty('default') ? THREE['default'] : THREE;
  TWEEN$1 = TWEEN$1 && TWEEN$1.hasOwnProperty('default') ? TWEEN$1['default'] : TWEEN$1;

  /**
    * Director.
    * 
    * Manages scenes and the config and variables for the active scene.
    *
    */

  var Director = function Director(options) {
      
  };

  /**
    * Materials.
    * 
    * Central store for all the images used for textures and materials.
    *
    */

  var Materials = function Materials(options) {
    var this$1 = this;

    /** 
     * Textures
     */
    this.textures = {
      darkMetal1: this.loadTexture('./assets/darkmetal.jpg', function (texture) {
        texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping;
        texture.repeat.set( 10., 25. );
      }),
      darkMetal2: this.loadTexture('./assets/darkmetal.jpg', function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( .05, .05 );
      }),
      forest: this.loadTexture('/assets/forest.jpg', function ( texture ) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }),
      island_heightMap: this.loadTexture('./assets/height.png'),
      island_texture: this.loadTexture('./assets/texture.png'),
      sand: this.loadTexture('/assets/sand.jpg', function ( texture ) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }),
      smoke: this.loadTexture('./assets/smoke.png'),
      volcano: this.loadTexture('/assets/volcano.jpg', function ( texture ) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      })
    };
    /** 
     * Material definitions
     */
    this.island = function () {
      return new THREE.ShaderMaterial({
        uniforms: {
          bumpTexture:{ type: "t", value: this$1.textures.island_heightMap },
          bumpScale:  { type: "f", value: 24361.43 },
          landSize:   { type: "f", value: 200000 },
          time:       { type: "f", value: 0.0 },
          texture:    { type: "t", value: this$1.textures.island_texture },
          sandyTexture: { type: "t", value: this$1.textures.sand },
          forestTexture: { type: "t", value: this$1.textures.forest },
          rockyTexture: { type: "t", value: this$1.textures.volcano },
          sunPosition:{ type: "v3", value: light.position.clone() },
          center:     { type: "v3", value: { x: 0, y: 0, z: 0} }
        },
        vertexShader: document.getElementById( 'landVertexShader' ).textContent,
        fragmentShader: document.getElementById( 'landFragmentShader' ).textContent,
        transparent: true
      });
    };
    this.smoke = function () {
      return new THREE.SpriteMaterial( {
        alphaTest: .0543212345,
        map: this$1.textures.smoke,
        transparent: true
      } );
    };
  };

  Materials.prototype.loadTexture = function loadTexture (texture_location, callback) {
      if ( callback === void 0 ) callback = function () {};

    return new THREE.TextureLoader().load( texture_location, callback);
  };

  /**
    * Aircraft.
    * 
    * Object Class
    *
    */

  var Aircraft = function Aircraft(options) {
      
  };

  Aircraft.prototype.animate = function animate () {
    if (ship.velocity < 10) {
      // Falling gravity
      ship.position.y -= 25 - (ship.velocity * 2.5);
    }
    else {
      // Regular gravity
      ship.position.y -= .98;
    }
    if (keyboard.pressed(" ")) {
      if (ship.velocity < 50) {
        ship.velocity += 0.1;
      }
    }
    if (keyboard.pressed("shift")) {
      if (ship.velocity > 0) {
        ship.velocity -= 0.1;  
      }
      else {
        ship.velocity = 0;
      }
    }
    
    ship.translateZ(ship.velocity);
    if (keyboard.pressed("a")) {
      ship.rotateZ(-Math.PI / 360);
    }
    if (keyboard.pressed("d")) {
      ship.rotateZ(Math.PI / 360);
    }
    if (keyboard.pressed("s")) {
      ship.rotateX(-Math.PI / 360);
    }
    if (keyboard.pressed("w")) {
      ship.rotateX(Math.PI / 360);
    }
    if (keyboard.pressed("c")) {
      camera_controls.reset();
    }
    
    if (ship.velocity != 0) {
      initParticles();
      ship.velocity *= 0.9999;
    }};

  Aircraft.prototype.drawShip = function drawShip () {
    var wingPort = getWing('port');
    var wingStarboard = getWing('starboard');
    var cockpit = getCockpit();
    var fuselage = getFuselage();
      
    ship = new THREE.Object3D();  ship.add(wingPort);
    ship.add(wingStarboard);
    ship.add(fuselage);
    ship.add(cockpit);
    ship.position.set(0, 25000, 0);
    ship.velocity = 15.0;
    
    $('.ui.button.accelerate').click(function () { return ship.velocity += 0.5; });
    $('.ui.button.decelerate').click(function () { return ship.velocity -= 0.5; });
    $('.ui.button.reset').click(function () { return camera_controls.reset(); });
    
      
      var eventHandler = function (event) {
        var betaDiff = lastBeta - event.beta;
        var gammaDiff = lastGamma - event.gamma;
    
        if (betaDiff > 5.5 || betaDiff < 5.5) {
          ship.rotateX(betaDiff / 250);
          if (betaDiff > 35 || betaDiff < 35) {
            ship.rotateX(betaDiff / 50);
          }
        }
        if (gammaDiff > 5.5 || gammaDiff < 5.5) {
          ship.rotateY(gammaDiff / 250);
          if (gammaDiff > 35 || gammaDiff < 35) {
            ship.rotateY(gammaDiff / 50);
          }
        }
          
        lastBeta = event.beta;
        lastGamma = event.gamma;
      };
      window.addEventListener("deviceorientation", eventHandler, true );
    
    return ship;
  };

  Aircraft.prototype.getFuselage = function getFuselage () {
    var geometry = new THREE.OctahedronGeometry( 30, 0);
    var texture = Materials.textures.darkMetal1;
    var material = new THREE.MeshPhongMaterial( { map: texture } );
    var fuselage = new THREE.Mesh( geometry, material );
    
    fuselage.scale.set(.75,5,1.85);
    fuselage.position.set(0, -120, 0);
    fuselage.rotation.set(-Math.PI / 2, Math.PI / 2, 0);
    
    return fuselage;
  };
    
  Aircraft.prototype.getCockpit = function getCockpit () {
    var geometry = new THREE.OctahedronGeometry( 30, 1);
    var material = new THREE.MeshToonMaterial( { color: 0x006633, shininess: 100 } );
    var fuselage = new THREE.Mesh( geometry, material );
    
    fuselage.scale.set(.8,.15,.35);
    fuselage.position.set(0, -110, 70);
    fuselage.rotation.set(0.1, -Math.PI / 2, 0);
    
    return fuselage;
  };
    
  Aircraft.prototype.getWing = function getWing (side) {
    if (side == 'port') {
      var closedSpline = new THREE.CatmullRomCurve3( [    
        new THREE.Vector3(-120,90, 120 ),
        new THREE.Vector3(-120,90, -120 )
      ] );
    }
    if (side == 'starboard') {
      var closedSpline = new THREE.CatmullRomCurve3( [    
        new THREE.Vector3(-120,90, -120 ),
        new THREE.Vector3(-120,90, 120 )
      ] );  
    }
    closedSpline.type = 'catmullrom';
    closedSpline.closed = true;
    var extrudeSettings = {
      steps   : 10,
      bevelEnabled: false,
      extrudePath : closedSpline
    };
    var pts = [], count = 3;
    for ( var i = 0; i < count; i ++ ) {
      var l = 80;
      var a = 20 * i / count * Math.PI;
      pts.push( new THREE.Vector2 ( Math.cos( a ) * l, Math.sin( a ) * 4 ) );
    }
    var shape = new THREE.Shape( pts );
    var geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
    var texture = Materials.textures.darkMetal2;
    var material = new THREE.MeshPhongMaterial( { map: texture, wireframe: false } );
    var wing = new THREE.Mesh( geometry, material );
      
    
    if (side == 'port') {
      wing.position.set(-100,-240, 90);
      wing.rotation.set(0, Math.PI / 3 , -Math.PI / 2);
    }
    if (side == 'starboard') {
      wing.position.set(100,-240, 90);
      wing.rotation.set(0, ((2 * Math.PI) / 3) , -Math.PI / 2);
    }
      
    return wing;
  };

  Aircraft.prototype.initParticles = function initParticles () {
    
    var scale = Math.random() * 32 + 16;
    var thrust = 360 * Math.random();
    var right_thruster = new THREE.Sprite( Materials.smoke );
    right_thruster.position.set( ship.position.x, ship.position.y, ship.position.z );
    right_thruster.rotation.set( ship.rotation.x, ship.rotation.y, ship.rotation.z );
    right_thruster.translateX(-90);
    right_thruster.translateZ(-70);
    right_thruster.material.rotation = thrust;
    initParticle(right_thruster, scale);
    
    var left_thruster = new THREE.Sprite( Materials.smoke );
    left_thruster.position.set( ship.position.x, ship.position.y, ship.position.z );
    left_thruster.rotation.set( ship.rotation.x, ship.rotation.y, ship.rotation.z );
    left_thruster.translateX(90);
    left_thruster.translateZ(-70);
    left_thruster.material.rotation = -thrust;
    initParticle(left_thruster, scale);
  };
    
  Aircraft.prototype.initParticle = function initParticle ( particle, scale ) {
    particle.scale.x = particle.scale.y = scale;
    particle.translateY(-120);
    new TWEEN.Tween( particle.scale )
      .onComplete(function(){ scene.remove(particle); })
      .to( { x: 0.01, y: 0.01 }, 1000 )
      .start();
    scene.add( particle );
  };

  /**
    * Island.
    * 
    * Object Class
    *
    */

  /**
    * Opening.
    * 
    * Scene Class
    *
    */

  var Opening = function Opening(options) {
    this.scripts = {
      'Demo': [],
      'Flight': []
    };
  };

  Opening.prototype.animate = function animate () {

  };
  Opening.prototype.addCloud = function addCloud (position) {
    var spriteMap = new THREE.TextureLoader().load( cloudTextures[cloudId] );
    var spriteMaterial = new THREE.SpriteMaterial( { alphaTest: 0.00125, map: spriteMap, color: 0xffffff } );
    var sprite = new THREE.Sprite( spriteMaterial );
    sprite.position.set(position.x, position.y, position.z);
    var randomer = Math.random();
    
    var scaler = 1;
    if (cloudId == 2) {
      scaler = 3;
    }
    sprite.scale.set(scaler * 100000 * randomer, scaler * 75000 * randomer,1);
    clouds.push(sprite);
      
    scene.add( clouds[clouds.length - 1] );
    
    cloudId++;
    if (cloudId > 2) {
      cloudId = 0;
    }
  };
  Opening.prototype.setWater = function setWater () {
    var waterGeometry = new THREE.CircleBufferGeometry( parameters.oceanSide * 5, 1000 );
    water = new THREE.Water(
      waterGeometry,
      {
        clipBias: -0.000001,
        textureWidth: 1024,
        textureHeight: 1024,
        waterNormals: new THREE.TextureLoader().load( './assets/waternormals.jpg', function ( texture ) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }),
        alpha:parameters.alpha,
        sunDirection: light.position.clone().normalize(),
        sunColor: 0x66CCFF,
        waterColor: 0x001e0f,
        distortionScale: parameters.distortionScale,
        fog: scene.fog != undefined,
        size: parameters.size
      }
    );
    
    water.rotation.x = - Math.PI / 2;
    water.receiveShadow = true;
    
    scene.add( water );
    
  };
  Opening.prototype.init = function init () {
    keyboard= new THREEx.KeyboardState();
    container = document.getElementById( 'container' );
    renderer = new THREE.WebGLRenderer({
      antialias: true,
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
        
    setWater();
    
    Aircraft.drawShip();
        
    scene.add( ship );
    ship.add(camera);
    ship.rotateY(-Math.PI/2);
    
    initLand();
    initSky();
    
    drawTorus(-25000, 25000, 0);
    drawTorus(-45000, 35000, 0);
    
    stats = new Stats();
    document.getElementById( 'stats' ).appendChild( stats.domElement );
    
    window.addEventListener( 'resize', onWindowResize, false );
  };
  Opening.prototype.initSky = function initSky () {
    // Add Sky
    sky = new THREE.Sky();
    sky.scale.setScalar( parameters.oceanSide * 5 );
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
        (parameters.oceanSide / 35) * x,
        150000 + 25000 * Math.random(),
        (parameters.oceanSide / 35) * y)
      );  
    } 
      
      
    // old GUI params
    effectController= {
      turbidity: 10,
      rayleigh: 2,
      mieCoefficient: 0.005,
      mieDirectionalG: 0.8,
      luminance: 1,
      inclination: -1.1, // elevation / inclination
      azimuth: -1.1, // Facing front,
      sun: ! true
    };
    
     var sun_cycle = new TWEEN.Tween(effectController)
      .to({azimuth: 1.1}, 600000)
      .to({inclination: 1.1}, 600000)
      .repeat(Infinity)
      .yoyo(true)
      .start();
    
  };

  /**
    * Scenograph.
    *
    * Manages scenes
    * 
    * Properties,
    * - Director, class containing scene configuration and helpers
    * - Scenes, Array, contains Director configs, Object layouts and helper functions to draw a scene.
    * -- Scripts, class within each Scene, extensible way to activate a scene - i.e. interactive/play mode or flyby demo mode.
    * 
    * Internal classes,
    * - Materials, object containing reusable THREE JS materials
    * - Objects, reusable THREE JS scene objects with helper classes like animate()
    */

  var Scenograph = function Scenograph(options) {
    this.Director = Director;
    this.Scenes = [
      Opening      // 0 - The signature and opening scene of the game.
    ];
  };
  Scenograph.prototype.onWindowResize = function onWindowResize () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  };
  Scenograph.prototype.animate = function animate$1 () {
    TWEEN$1.update();
       
    requestAnimationFrame( animate );
    render();
  };
  Scenograph.prototype.render = function render () {
    var delta = clock.getDelta(),
      time = clock.getElapsedTime() * 10;
    
    camera_controls.update( delta );
    camera.lookAt(ship.position);
    stats.update();
    
    renderer.render( scene, camera );
  };

  /**
   * Kamigen Browser Application
   */

  // Setup the main App class.
  var App = function App() {
    this.scenograph = new Scenograph(this);
  };

  // Run App using jQuery.ready()
  $(function () {
    var app = new App();

    // Run all the ready functions
    for (var classInstance in app) {
      if (app[classInstance].ready) {
        app[classInstance].ready();
      }
    }
  });

  return App;

}(jQuery, THREE, TWEEN));
//# sourceMappingURL=app.js.map
