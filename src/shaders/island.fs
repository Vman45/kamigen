uniform float landSize;
uniform sampler2D sandyTexture;
uniform sampler2D grassTexture;
uniform sampler2D rockyTexture;
uniform sampler2D texture;
uniform vec3 sunPosition;
uniform vec3 center;

varying vec2 vUV;
varying float vAmount;
varying vec4 worldPosition;

// Shade island based on sun direction.
float sunshadeIsland() {
  float radius = landSize / 4.;

  // Distance between this point and sun.
  float a = distance(worldPosition.xyz, sunPosition);

  // Distance between the center and sun.
  float b = distance(center, sunPosition);
  
  // Default shade
  float c = 0.0;

  // Sun max height
  float maxSun = 150000.;
  float brightness = (sunPosition.y / maxSun);

  if (sunPosition.y > 0.) {
    if (a < b) {
      brightness *= 0.5;
    }
    else {
      brightness *= 0.3;
    }
  }
  else {
    brightness *= 0.1;
  } 
    
  return brightness;
}

void main() 
{
  if (vAmount < 0.01) {
    gl_FragColor = texture2D( sandyTexture, vUV * 50.0 );
    gl_FragColor.a = 0.0;
  }
  else {
    vec4 sandy = (smoothstep(0.01, 0.03, vAmount) - smoothstep(0.05, 0.07, vAmount)) * texture2D( sandyTexture, vUV * 50.0 );
    vec4 grass = (smoothstep(0.05, 0.07, vAmount) - smoothstep(0.40, 0.70, vAmount)) * texture2D( grassTexture, vUV * 50.0 );
    vec4 rocky = (smoothstep(0.50, 0.65, vAmount))                                   * texture2D( rockyTexture, vUV * 25.0 );
    gl_FragColor = sandy + grass + rocky;
    gl_FragColor -= (texture2D( texture, vUV ) * 0.5);
    gl_FragColor += sunshadeIsland();
    gl_FragColor.a = 1.0;
  }
}
