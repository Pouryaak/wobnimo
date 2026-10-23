/* The frame: one ray per pixel from a perspective camera, clipped to the
   character's bounding sphere, marched against its distance field. Edges
   are antialiased from how closely a missed ray passed the surface. Below
   the character a soft shadow is marched up from the floor, so anything
   the spec describes casts one, floating or not. The output is
   premultiplied alpha over whatever the page has behind the canvas. */

export const MAIN = /* glsl */ `
vec3 calcNormal(vec3 p) {
  vec3 n = vec3(0.0);
  for (int i = ZERO; i < 4; i++) {
    vec3 e = 0.5773 * (2.0 * vec3(float(((i + 3) >> 1) & 1), float((i >> 1) & 1), float(i & 1)) - 1.0);
    n += e * map(p + 0.0006 * e).x;
  }
  return normalize(n);
}

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
  vec3 oc = ro - uBound.xyz;
  float b = dot(oc, rd);
  float disc = b * b - dot(oc, oc) + uBound.w * uBound.w;
  if (disc > 0.0) {
    float s = sqrt(disc);
    float t = max(-b - s, 0.0);
    float tEnd = -b + s;
    float hitT = -1.0;
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
    }
  }

  vec4 shadow = vec4(0.0);
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
      shadow = vec4(uShadow * dark, dark);
    }
  }
  fragColor = body + shadow * (1.0 - body.a);
}
`;
