/**
  * Island.
  * 
  * Object Class
  *
  */

// Globals.
import $ from 'jQuery';
import THREE from 'THREE';

// Game libs.
import Materials from '../materials.js';

export default class Island {
  constructor(options) {
    
  }

  animate() {
    water.material.uniforms.time.value += 1.0 / 60.0;
    land.material.uniforms.time.value += 1.0 / 60.0;
    
    if (effectController) {
      var distance = parameters.oceanSide;
  
      var uniforms = sky.material.uniforms;
      uniforms.turbidity.value = effectController.turbidity;
      uniforms.rayleigh.value = effectController.rayleigh;
      uniforms.luminance.value = effectController.luminance;
      uniforms.mieCoefficient.value = effectController.mieCoefficient;
      uniforms.mieDirectionalG.value = effectController.mieDirectionalG;
  
      var theta = Math.PI * ( effectController.inclination - 0.5 );
      var phi = 2 * Math.PI * ( effectController.azimuth - 0.5 );
  
      light.position.x = sunSphere.position.x = distance * Math.cos( phi );
      light.position.y = sunSphere.position.y = distance * Math.sin( phi ) * Math.sin( theta );
      light.position.z = sunSphere.position.z = distance * Math.sin( phi ) * Math.cos( theta ); 
  
      sky.material.uniforms.sunPosition.value.copy( light.position.clone() );
      land.material.uniforms.sunPosition.value.copy( light.position.clone() );
    }
  
    clouds.forEach((sprite) => {
      sprite.material.opacity = Math.min(1, Math.max(0.05,(sunSphere.position.y / parameters.oceanSide)));
    });
  }

  initLand() {   
    var geometry = new THREE.PlaneGeometry( 200000, 200000, 200, 200 );
    land  = new THREE.Mesh( geometry,  Materials.island ) ;
    land.position.y = -900;
    land.rotation.x = - Math.PI / 2;
    scene.add( land );
  }
}
