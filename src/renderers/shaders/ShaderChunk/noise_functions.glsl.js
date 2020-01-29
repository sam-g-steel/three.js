export default /* glsl */`
// Gold Noise ©2015 dcerisano@standard3d.com
// - based on the Golden Ratio
// - uniform normalized distribution
// - fastest static noise generator function (also runs at low precision)
float noise1(vec2 xy, float seed){
    float PHI = 1.61803398874989484820459;  // Φ = Golden Ratio   
    return fract(tan(distance(xy*PHI, xy)*seed)*xy.x);
}

vec3 noise3(vec2 xy, float seed){
    return vec3(
        noise1(xy, seed  +2.25),
        noise1(xy, seed  +5.125),
        noise1(xy, seed  +21.7518)
    );
}
`;