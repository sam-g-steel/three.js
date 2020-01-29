export default /* glsl */`
ivec2 pixelIndexToUV(int index){
    return ivec2( index % 512, index / 512);
}

// 
struct AABB {
    int id;    // AABB ID
    vec3 min; 
    vec3 max; 
    int left;  // left partition's AABB ID
    int right; // right partition's AABB ID
    
    // Each AABB can have as much as 6 triangles referenced inside it
    int[6] tris;
};

// 
AABB fetchAABB(int index, sampler2D sampler) {
    float pixSize = 0.001953125; // 1/512
    AABB result;
    vec4 a = texelFetch(sampler, pixelIndexToUV(index*3), 0);
    vec4 b = texelFetch(sampler, pixelIndexToUV(index*3+1), 0);
    
    result.id = index;
    
    // If this voxel has more voxels...
    if(b.b < 0.0 && b.a < 0.0){
        result.left = -int(b.b);
        result.right = -int(b.a);
    }
    // Otherwise it has triangles
    else{
        result.tris[0] = int(b.b);
        result.tris[1] = int(b.a);
    }
    
    result.min = a.rgb;
    result.max = vec3(a.a, b.rg);
    return result;
}

// 
void loadAABBtris(inout AABB node, sampler2D sampler) {
    vec4 a = texelFetch(sampler, pixelIndexToUV(node.id*3+2), 0);
    node.tris[2] = int(a.r);
    node.tris[3] = int(a.g);
    node.tris[4] = int(a.b);
    node.tris[5] = int(a.a);
}

// adapted from intersectCube in https://github.com/evanw/webgl-path-tracing/blob/master/webgl-path-tracing.js
// and from https://gist.github.com/DomNomNom/46bb1ce47f68d255fd5d

// Compute the near and far intersections of the cube (stored in the x and y components) using the slab method
// no intersection means vec.x > vec.y (really tNear > tFar)

bool intersectAABB(vec3 rayOrigin, vec3 rayDir, AABB box) {
    vec3 invRayDir = vec3(1) / rayDir;
    vec3 tMin = (box.min - rayOrigin) * invRayDir;
    vec3 tMax = (box.max - rayOrigin) * invRayDir;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    
    return tNear < tFar;
}

bool intersectAABB_Fast(vec3 rayOrigin, vec3 rayDir, vec3 invRayDir, AABB box) {
    vec3 tMin = (box.min - rayOrigin) * invRayDir;
    vec3 tMax = (box.max - rayOrigin) * invRayDir;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    
    return tNear < tFar;
}

`;