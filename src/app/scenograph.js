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

// Globals.
import $ from 'jQuery';
import THREE from 'THREE';
import TWEEN from 'TWEEN';

// Game libs.
import Director from './scenograph/director.js';
import Opening from './scenograph/scenes/opening.js';

export default class Scenograph {
  constructor(options) {
    this.Director = Director;
    this.Scenes = [
      Opening        // 0 - The signature and opening scene of the game.
    ];
  }
  onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }
  animate() {
    TWEEN.update();
     
    requestAnimationFrame( animate );
    render();
  }
  render() {
    var delta = clock.getDelta(),
      time = clock.getElapsedTime() * 10;
  
    camera_controls.update( delta );
    camera.lookAt(ship.position);
    stats.update();
  
    renderer.render( scene, camera );
  }
}
