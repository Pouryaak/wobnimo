/* Effect particles, drawn as little 2D distance-field glyphs that face the
   camera from their place in the world. A glyph returns its coverage and
   a highlight; the caller composites it in front of or behind the body
   depending on which is nearer. */

export const PARTICLES = /* glsl */ `
float fxSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

float fxDot2(vec2 v) { return dot(v, v); }

float fxHeart(vec2 p) {
  p.x = abs(p.x);
  if (p.y + p.x > 1.0) return sqrt(fxDot2(p - vec2(0.25, 0.75))) - sqrt(2.0) / 4.0;
  return sqrt(min(fxDot2(p - vec2(0.0, 1.0)), fxDot2(p - 0.5 * max(p.x + p.y, 0.0)))) * sign(p.x - p.y);
}

float fxTeardrop(vec2 p, float r1, float r2, float h) {
  p.x = abs(p.x);
  float b = (r1 - r2) / h;
  float a = sqrt(1.0 - b * b);
  float k = dot(p, vec2(-b, a));
  if (k < 0.0) return length(p) - r1;
  if (k > a * h) return length(p - vec2(0.0, h)) - r2;
  return dot(p, vec2(a, b)) - r1;
}

float fxStar(vec2 p, float r, float rf) {
  const vec2 k1 = vec2(0.809016994375, -0.587785252292);
  const vec2 k2 = vec2(-k1.x, k1.y);
  p.x = abs(p.x);
  p -= 2.0 * max(dot(k1, p), 0.0) * k1;
  p -= 2.0 * max(dot(k2, p), 0.0) * k2;
  p.x = abs(p.x);
  p.y -= r;
  vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0.0, 1.0);
  float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
  return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}

float fxTriangle(vec2 p, float r) {
  const float k = 1.7320508;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

/* an exclamation mark, tapering toward its dot */
float fxExclaim(vec2 p) {
  float bar = fxSegment(p, vec2(0.0, -0.2), vec2(0.0, 0.8)) - mix(0.11, 0.19, clamp((p.y + 0.2), 0.0, 1.0));
  return min(bar, length(p - vec2(0.0, -0.66)) - 0.15);
}

/* coverage, highlight */
vec2 glyph(int g, vec2 p, float px) {
  float d = 1e9;
  float light = 0.0;
  float soft = 0.0;
  if (g == 0) {
    d = min(min(fxSegment(p, vec2(-0.6, 0.6), vec2(0.6, 0.6)), fxSegment(p, vec2(0.6, 0.6), vec2(-0.6, -0.6))), fxSegment(p, vec2(-0.6, -0.6), vec2(0.6, -0.6))) - 0.16;
  } else if (g == 1) {
    float ring = abs(length(p) - 0.82) - 0.07;
    float shine = length(p - vec2(-0.32, 0.36)) - 0.17;
    d = min(ring, shine);
    light = 1.0 - smoothstep(-px, px, shine);
    soft = 0.14 * (1.0 - smoothstep(0.75, 0.82, length(p)));
  } else if (g == 2) {
    vec2 q = abs(p);
    d = (sqrt(q.x) + sqrt(q.y) - 0.92) * 0.45;
    light = 1.0 - smoothstep(0.0, 0.35, length(p));
  } else if (g == 3) {
    d = fxHeart(p * 0.56 + vec2(0.0, 0.5)) / 0.56;
    light = (1.0 - smoothstep(-px, px, length(p - vec2(-0.38, 0.38)) - 0.13)) * 0.8;
  } else if (g == 4) {
    vec2 h = p - vec2(-0.28, -0.55);
    float head = (length(mat2(0.92, 0.39, -0.39, 0.92) * h / vec2(0.32, 0.23)) - 1.0) * 0.23;
    float stem = fxSegment(p, vec2(0.02, -0.5), vec2(0.02, 0.78)) - 0.07;
    float flag = fxSegment(p, vec2(0.02, 0.78), vec2(0.42, 0.36)) - 0.09;
    d = min(head, min(stem, flag));
  } else if (g == 5) {
    vec2 c = p - vec2(-1.1, 0.0);
    float a = atan(c.y, c.x);
    d = max(abs(length(c) - 1.45) - 0.1, (abs(a) - 0.48) * 1.45);
  } else if (g == 6) {
    float r = length(p);
    return vec2((1.0 - smoothstep(0.15, 1.0, r)) * 0.75, 0.25 + 0.35 * p.y);
  } else if (g == 7) {
    d = abs(length(p) - 0.84) - 0.06;
  } else if (g == 8) {
    d = fxTeardrop(p + vec2(0.0, 0.35), 0.55, 0.06, 1.05);
    light = (1.0 - smoothstep(-px, px, length(p - vec2(-0.2, -0.2)) - 0.12)) * 0.9;
  } else if (g == 9) {
    d = fxSegment(p, vec2(-1.0, 0.0), vec2(1.0, 0.0)) - 0.12 * (1.0 - abs(p.x) * 0.7);
    light = 0.6;
  } else if (g == 10) {
    float r = length(p);
    return vec2(exp(-r * r * 5.0), 1.0 - smoothstep(0.0, 0.3, r));
  } else if (g == 11) {
    d = (length(p / vec2(0.3, 0.95)) - 1.0) * 0.3;
    light = -0.35 * (1.0 - smoothstep(0.0, 0.05 + px, abs(p.x + 0.04 * p.y)));
  } else if (g == 13) {
    d = fxExclaim(p);
    light = 0.3 * (1.0 - smoothstep(-px, px, fxSegment(p, vec2(-0.05, 0.1), vec2(-0.05, 0.7)) - 0.035));
  } else if (g == 14) {
    d = fxTriangle(p - vec2(0.0, -0.12), 0.82) - 0.14;
    /* a white mark on the coloured sign */
    light = 1.0 - smoothstep(-px, px, fxExclaim((p - vec2(0.0, -0.08)) / 0.52) * 0.52);
  } else if (g == 15) {
    vec2 q = abs(p) - vec2(0.32, 0.78);
    d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.06;
    light = 0.35 * step(0.0, p.x);
  } else if (g == 16) {
    float c = min(min(length(p - vec2(-0.48, -0.08)) - 0.4, length(p - vec2(0.08, 0.18)) - 0.55), length(p - vec2(0.56, -0.1)) - 0.36);
    d = max(c, -p.y - 0.44);
    light = 0.45 * smoothstep(-0.2, 0.7, p.y) - 0.25 * (1.0 - smoothstep(-0.45, -0.1, p.y));
  } else if (g == 17) {
    d = fxStar(p, 0.92, 0.46) - 0.06;
    light = 0.5 * (1.0 - smoothstep(0.0, 0.45, length(p - vec2(-0.12, 0.18))));
  } else if (g == 18) {
    float r = length(p);
    float teeth = 0.66 + 0.2 * smoothstep(-0.25, 0.25, cos(atan(p.y, p.x) * 8.0));
    d = max(r - teeth, 0.26 - r);
    light = 0.3 * (1.0 - smoothstep(0.3, 0.7, length(p - vec2(-0.2, 0.25))));
  } else {
    d = length(p) - 0.9;
    light = 0.35 * (1.0 - smoothstep(0.0, 0.6, length(p - vec2(-0.3, 0.35))));
  }
  return vec2(max(1.0 - smoothstep(-px, px, d), soft), light);
}
`;
