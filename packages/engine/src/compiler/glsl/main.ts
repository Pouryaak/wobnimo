/* The frame: one ray per pixel from a perspective camera, clipped to the
   character's bounding sphere, marched against its distance field. Edges
   are antialiased from how closely a missed ray passed the surface. Below
   the character a soft shadow is marched up from the floor, so anything
   the spec describes casts one, floating or not, and its light can pool
   there. Effect particles go in front of or behind the body, whichever
   is true. The output is premultiplied alpha over the page. */

export const MAIN = /* glsl */ `
vec3 calcNormal(vec3 p) {
  vec3 n = vec3(0.0);
  for (int i = ZERO; i < 4; i++) {
    vec3 e = 0.5773 * (2.0 * vec3(float(((i + 3) >> 1) & 1), float((i >> 1) & 1), float(i & 1)) - 1.0);
    n += e * map(p + 0.0006 * e).x;
  }
  return normalize(n);
}

vec4 over(vec4 top, vec4 under) { return top + under * (1.0 - top.a); }

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
  float pitch = uCamera.w;
  vec3 target = vec3(0.0, uCamera.x, 0.0);
  vec3 ro = target + uCamera.y * vec3(0.0, sin(pitch), cos(pitch));
  vec3 fw = normalize(target - ro);
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(rt, fw);
  vec3 rd = normalize(fw + (uv.x * rt + uv.y * up) * uCamera.z);
  float pixelAngle = 2.0 * uCamera.z / uResolution.y;

  vec4 body = vec4(0.0);
  float hitT = -1.0;
  vec3 oc = ro - uBound.xyz;
  float b = dot(oc, rd);
  float disc = b * b - dot(oc, oc) + uBound.w * uBound.w;
  if (disc > 0.0) {
    float s = sqrt(disc);
    float t = max(-b - s, 0.0);
    float tEnd = -b + s;
    float nearest = 1e9;
    float nearestT = 0.0;
    for (int i = ZERO; i < 140; i++) {
      float d = map(ro + rd * t).x;
      float px = t * pixelAngle;
      if (d < 0.2 * px) { hitT = t; break; }
      float ratio = d / px;
      if (ratio < nearest) { nearest = ratio; nearestT = t; }
      t += d * 0.85;
      if (t > tEnd) break;
    }
    float coverage = hitT > 0.0 ? 1.0 : 1.0 - smoothstep(0.2, 1.0, nearest);
    if (coverage > 0.0) {
      float tt = hitT > 0.0 ? hitT : nearestT;
      vec3 p = ro + rd * tt;
      gPixel = tt * pixelAngle;
      vec3 n = calcNormal(p);
      Material m = getMaterial(map(p).y, p, n);
      vec3 col = pow(aces(shade(m, p, n, -rd) * uExposure), vec3(1.0 / 2.2));
      body = vec4(col * coverage, coverage);
      if (hitT < 0.0) hitT = tt;
    }
  }

  vec4 floorLayer = vec4(0.0);
  if (body.a < 1.0 && rd.y < 0.0) {
    vec3 fp = ro + rd * (-ro.y / rd.y);
    float r = length(fp.xz - uBound.xz);
    float reach = uBound.w * 1.15;
    if (r < reach) {
      float sky = softShadow(fp + vec3(0.0, 0.002, 0.0), vec3(0.1191, 0.9800, 0.1588), 0.02, 3.0, 3.2);
      float contact = 1.0 - smoothstep(0.0, 0.28, map(fp).x);
      float dark = (1.0 - sky) * 0.4 + contact * contact * 0.32;
      dark *= 1.0 - smoothstep(reach * 0.45, reach, r);
      /* a shadow fades as what casts it rises */
      dark *= mix(1.0, 0.5, smoothstep(0.0, 0.45, uLift));
      /* the state's light pooling on the floor */
      vec3 pool = uGlow * uGlowPool * exp(-r * r * 5.0) * (1.0 - dark);
      floorLayer = vec4(uShadow * dark + pool, dark);
    }
  }

  vec4 front = vec4(0.0);
  vec4 back = vec4(0.0);
  float pixel = 2.0 / uResolution.y;
  for (int i = 0; i < uFxCount; i++) {
    vec4 A = uFxA[i];
    vec4 B = uFxB[i];
    vec3 d = A.xyz - ro;
    float z = dot(d, fw);
    if (z < 0.1) continue;
    float scale = 1.0 / (z * uCamera.z);
    vec2 q = (uv - vec2(dot(d, rt), dot(d, up)) * scale) / (A.w * scale);
    if (dot(q, q) > 2.0) continue;
    float cr = cos(B.z), sr = sin(B.z);
    q = mat2(cr, -sr, sr, cr) * q;
    vec2 g = glyph(int(B.x + 0.5), q, pixel / (A.w * scale));
    float a = g.x * B.y;
    if (a < 0.002) continue;
    vec3 col = mix(uFxC[i].rgb, vec3(1.0), clamp(g.y, 0.0, 1.0)) * (1.0 + min(g.y, 0.0));
    vec4 layer = B.w > 0.5 ? vec4(col * a, 0.0) : vec4(col * a, a);
    if (hitT > 0.0 && hitT < length(d)) back = over(layer, back);
    else front = over(layer, front);
  }

  fragColor = over(front, over(body, over(back, floorLayer)));
}
`;
