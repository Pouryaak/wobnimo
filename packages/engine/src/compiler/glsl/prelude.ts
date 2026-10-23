/* Distance functions and blend operators every character can use. Mostly
   Inigo Quilez's exact SDFs (iquilezles.org/articles/distfunctions). */

export const PRELUDE = /* glsl */ `
float sdSphere(vec3 p, float r) { return length(p) - r; }

float sdEllipsoid(vec3 p, vec3 r) {
  float k0 = length(p / r);
  float k1 = length(p / (r * r));
  return k0 * (k0 - 1.0) / max(k1, 1e-6);
}

float sdRoundBox(vec3 p, vec3 b, float r) {
  vec3 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

float sdRoundCone(vec3 p, vec3 a, vec3 b, float r1, float r2) {
  vec3 ba = b - a;
  float l2 = dot(ba, ba);
  float rr = r1 - r2;
  float a2 = l2 - rr * rr;
  float il2 = 1.0 / l2;
  vec3 pa = p - a;
  float y = dot(pa, ba);
  float z = y - l2;
  vec3 xv = pa * l2 - ba * y;
  float x2 = dot(xv, xv);
  float y2 = y * y * l2;
  float z2 = z * z * l2;
  float k = sign(rr) * rr * rr * x2;
  if (sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
  if (sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
  return (sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}

/* along y, with rounded rims */
float sdCylinder(vec3 p, float r, float h, float rr) {
  vec2 d = vec2(length(p.xz) - r + rr, abs(p.y) - h + rr);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - rr;
}

float sdRoundRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

/* a rounded-rectangle ring in the xy plane, extruded along z: gaskets, bezels */
float sdFrame(vec3 p, vec2 b, float corner, float w, float depth) {
  float ring = abs(sdRoundRect(p.xy, b, corner)) - w;
  vec2 e = vec2(ring, abs(p.z) - depth);
  return min(max(e.x, e.y), 0.0) + length(max(e, 0.0));
}

float sdPlate(vec3 p, vec2 b, float corner, float depth) {
  vec2 e = vec2(sdRoundRect(p.xy, b, corner), abs(p.z) - depth);
  return min(max(e.x, e.y), 0.0) + length(max(e, 0.0));
}

float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

float smax(float a, float b, float k) { return -smin(-a, -b, k); }

/* union that keeps the material of whichever surface is nearer */
void opAdd(inout vec2 r, float d, float id, float k) {
  float m = d < r.x ? id : r.y;
  r.x = k > 0.0 ? smin(r.x, d, k) : min(r.x, d);
  r.y = m;
}

void opSub(inout vec2 r, float d, float k) {
  r.x = k > 0.0 ? smax(r.x, -d, k) : max(r.x, -d);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
`;
