export default /* glsl */`

#define INFINITY         1000000.0

// From https://github.com/erichlof/THREE.js-PathTracing-Renderer/blob/gh-pages/js/pathTracingCommon.js
float triangleIntersect( vec3 v0, vec3 v1, vec3 v2, vec3 r_origin, vec3 r_direction )
{
    vec3 edge1 = v1 - v0;
    vec3 edge2 = v2 - v0;
    vec3 pvec = cross(r_direction, edge2);
    float det = 1.0 / dot(edge1, pvec);
    // comment out the following line if double-sided triangles are wanted, or
    // uncomment the following line if back-face culling is desired (single-sided triangles)
    //if (det <= 0.0) return INFINITY;
    vec3 tvec = r_origin - v0;
    float u = dot(tvec, pvec) * det;
    if (u < 0.0 || u > 1.0)
        return INFINITY;
    vec3 qvec = cross(tvec, edge1);
    float v = dot(r_direction, qvec) * det;
    if (v < 0.0 || u + v > 1.0)
        return INFINITY;
    return dot(edge2, qvec) * det;
}
    
bool rayLeafCollision(in AABB node, vec3 start, vec3 dir){
    bool collision = false;
    int leafPointer = 0;
    do{
        if(leafPointer==2){
            loadAABBtris(node, bvhTexture);
        }
    
        int triIndex = node.tris[leafPointer];
        if(triIndex == 0) break;
        
        // Fetch triangle
        int triTextureIndex = triIndex * 3;
        vec3 p1 = texelFetch(triTexture, pixelIndexToUV(triTextureIndex  ), 0).rgb;
        vec3 p2 = texelFetch(triTexture, pixelIndexToUV(triTextureIndex+1), 0).rgb;
        vec3 p3 = texelFetch(triTexture, pixelIndexToUV(triTextureIndex+2), 0).rgb;
        
        float distance = triangleIntersect(p1, p2, p3, start, dir);
        collision = distance < INFINITY && distance > 0.00125;
        
    }while(++leafPointer < 6 && !collision);
    
    return collision;
}

bool rayTrisCollision(vec3 start, vec3 dir){
    bool collision = false;
    int leafPointer = 0;
    do{

        // Fetch triangle
        int triTextureIndex = leafPointer++ * 3;
        vec3 p1 = texelFetch(triTexture, ivec2(triTextureIndex % 512, 0 ), 0).rgb;
        vec3 p2 = texelFetch(triTexture, ivec2((triTextureIndex + 1) % 512, 0 ), 0).rgb;
        vec3 p3 = texelFetch(triTexture, ivec2((triTextureIndex + 2) % 512, 0 ), 0).rgb;

        float distance = triangleIntersect(p1, p2, p3, start, dir);
        collision = distance < INFINITY && distance > 0.00007;
        // collision = triangleIntersect(vec3(0, 0, 5), vec3(-2.5, 5, 0), vec3(2.5, 5, 0), start, dir) < INFINITY;

    }while(leafPointer < 100 && !collision);

    return collision;
}

// Test to see if a ray collides with a triangle in the bvh
// TODO: add the ability to set a cutoff distance
float testRay(vec3 start, vec3 dir){
    // AABB Stack
    int aabbStack[16]; aabbStack[0] = 0;
    int aabbStackPointer = 0;
    float result = 0.0;
    float collisionTests = 0.0;
    vec3 invRayDir = vec3(1) / dir;
    
    do{
        // Test current node
        AABB node = fetchAABB(aabbStack[aabbStackPointer], bvhTexture);
        bool collision = intersectAABB_Fast(start, dir, invRayDir, node);
        collisionTests++;
        
        if(collision) {
            if(node.left > 0){
                // Push child nodes onto the stack
                aabbStack[aabbStackPointer] = node.left; // 
                aabbStackPointer++;
                aabbStack[aabbStackPointer] = node.right; //
            }else{
                // loadAABBtris(node, bvhTexture);
                bool leafHit = rayLeafCollision(node, start, dir);
                if(leafHit){
                    return 1.0;
                }else{
                    // Pop the stack
                    aabbStackPointer--;
                }
            }
        }else{
            // Pop the stack
            aabbStackPointer--;
        }
        
    }while( aabbStackPointer >= 0 && aabbStackPointer < 16);
      
    // return collisionTests/50.0;
    return 0.0;
    // return float(aabbStackPointer)/40.0;
}
`
;