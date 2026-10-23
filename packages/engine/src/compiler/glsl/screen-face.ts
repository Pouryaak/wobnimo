/* An LED-matrix face for characters with a screen. Each state is a small
   2D distance field in LED cells (origin at the centre of the face, +y
   up); the matrix samples it once per LED for the crisp dots and again,
   softly, at the exact point for the bloom around them. A state switch
   cross-fades the two faces under a short glitch. */

export const SCREEN_FACE = /* glsl */ `
float sdBox2(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float fxStarLed(vec2 p, float r, float rf) {
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

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

/* how lit a shape is at distance d: 1 inside, falling off over soft */
float lit(float d, float soft) { return 1.0 - smoothstep(-0.35, soft, d); }

float faceEyes(vec2 c, float soft) {
  vec2 g = vec2(uFaceB.y * 2.2, uFaceB.z * 1.4);
  float blink = uFaceA.x;
  float v = 0.0;
  for (int i = 0; i < 2; i++) {
    float side = i == 0 ? -1.0 : 1.0;
    float lid = clamp(uFaceA.y + uFaceD.w * side * 0.4, 0.0, 1.0);
    float closeTop = max(blink * 0.48, lid * 0.42);
    float closeBottom = max(blink * 0.48, uFaceA.z * 0.4);
    float cx = side * 4.5 + g.x;
    float top = 3.5 + 0.8 * uFaceD.z + g.y - 4.0 * closeTop;
    float bottom = -0.5 - 0.5 * uFaceD.z + g.y + 4.0 * closeBottom;
    float h = max((top - bottom) * 0.5, 0.32);
    float d = sdBox2(c - vec2(cx, (top + bottom) * 0.5), vec2(1.5 + 0.3 * uFaceD.z, h)) - 0.15;
    v = max(v, lit(d, soft));
  }
  return v;
}

/* a mouth of two lips, like the painted ones: open is in LED rows */
float faceMouth(vec2 c, float open, float round, float smile, float soft) {
  float opened = smoothstep(0.0, 0.8, open);
  float w = 3.4 - 1.4 * round * opened;
  vec2 m = c - vec2(0.0, -3.7 + 0.25 * open);
  float u = clamp(m.x / w, -1.0, 1.0);
  float bulge = sqrt(max(1.0 - u * u, 0.0));
  float line = smile * 0.9 * u * u;
  float inside = max(m.y - line - open * (0.2 + 0.45 * round) * bulge, line - open * bulge - m.y);
  float body = abs(m.x) <= w ? inside : 1e3;
  float rim = min(abs(body), length(vec2(abs(m.x) - w, m.y - smile * 0.9))) - 0.42;
  return max(lit(rim, soft), lit(body, soft) * 0.12 * opened);
}

float faceZ(vec2 c, vec2 at, float s, float soft) {
  vec2 p = (c - at) / s;
  float d = min(min(sdSegment(p, vec2(-1, 1), vec2(1, 1)), sdSegment(p, vec2(1, 1), vec2(-1, -1))), sdSegment(p, vec2(-1, -1), vec2(1, -1)));
  return lit(d * s - 0.32, soft);
}

bool is(float state, float id) { return abs(state - id) < 0.5; }

float faceFor(float state, vec2 c, float t, float soft) {
  float v = 0.0;
  if (is(state, E_THINKING)) {
    /* heavy-lidded eyes looking up, three dots pulsing in turn */
    v = faceEyes(c, soft);
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float pulse = 0.5 + 0.5 * sin(t * 4.2 - fi * 1.1);
      float d = length(c - vec2(-2.4 + fi * 2.4, -4.4)) - 0.62;
      v = max(v, lit(d, soft) * (0.25 + 0.75 * pulse * pulse));
    }
  } else if (is(state, E_LISTENING)) {
    /* alert eyes over a live equaliser */
    v = faceEyes(c, soft);
    for (int i = 0; i < 7; i++) {
      float fi = float(i);
      float level = abs(sin(t * (5.0 + fi * 1.3) + fi * 1.7)) * (0.55 + 0.45 * sin(t * 2.3 + fi));
      float d = sdBox2(c - vec2(-4.5 + fi * 1.5, -4.6), vec2(0.42, 0.45 + 1.6 * level));
      v = max(v, lit(d, soft) * 0.9);
    }
  } else if (is(state, E_SPEAKING)) {
    /* the same two-lip mouth as the painted faces; closed, the lips meet in one bar */
    v = max(faceEyes(c, soft), faceMouth(c, uFaceB.x * 3.4, uFaceD.y, 0.0, soft));
  } else if (is(state, E_SLEEPING)) {
    /* closed eyes and rising z's */
    for (int i = 0; i < 2; i++) {
      float cx = i == 0 ? -4.5 : 4.5;
      float d = min(sdSegment(c, vec2(cx - 1.6, 1.4), vec2(cx, 0.6)), sdSegment(c, vec2(cx, 0.6), vec2(cx + 1.6, 1.4))) - 0.38;
      v = max(v, lit(d, soft));
    }
    for (int i = 0; i < 3; i++) {
      float k = fract(t * 0.22 + float(i) / 3.0);
      float fade = smoothstep(0.0, 0.15, k) * (1.0 - smoothstep(0.7, 1.0, k));
      v = max(v, faceZ(c, vec2(7.6 + k * 3.2, 1.2 + k * 5.0), 0.5 + k * 0.55, soft) * fade);
    }
  } else if (is(state, E_WORKING)) {
    /* narrowed eyes over a progress bar that fills, empties and fills again */
    v = faceEyes(c, soft);
    float rim = abs(sdBox2(c - vec2(0.0, -4.6), vec2(4.6, 0.95))) - 0.3;
    float fill = fract(t * 0.3) * 8.4;
    float bar = sdBox2(c - vec2(-4.2 + fill * 0.5, -4.6), vec2(fill * 0.5, 0.35));
    v = max(v, max(lit(rim, soft) * 0.55, lit(bar, soft)));
  } else if (is(state, E_ERROR)) {
    /* X eyes and a zigzag mouth */
    for (int i = 0; i < 2; i++) {
      vec2 e = c - vec2(i == 0 ? -4.5 : 4.5, 1.5);
      float d = min(sdSegment(e, vec2(-1.5, -1.5), vec2(1.5, 1.5)), sdSegment(e, vec2(-1.5, 1.5), vec2(1.5, -1.5))) - 0.42;
      v = max(v, lit(d, soft));
    }
    float zig = 1e3;
    for (int i = 0; i < 4; i++) {
      float x0 = -3.6 + float(i) * 1.8;
      zig = min(zig, sdSegment(c, vec2(x0, -4.6 + (i % 2 == 0 ? 0.6 : -0.6)), vec2(x0 + 1.8, -4.6 + (i % 2 == 0 ? -0.6 : 0.6))));
    }
    v = max(v, lit(zig - 0.4, soft));
  } else if (is(state, E_SURPRISED)) {
    /* round eyes with pinned pupils, and a little "o" */
    for (int i = 0; i < 2; i++) {
      vec2 e = c - vec2(i == 0 ? -4.5 : 4.5, 1.4);
      float ring = abs(length(e) - 2.0) - 0.42;
      v = max(v, max(lit(ring, soft), lit(length(e) - 0.62, soft)));
    }
    v = max(v, lit(abs(length(c - vec2(0.0, -4.7)) - 1.05) - 0.4, soft));
  } else if (is(state, E_CELEBRATING)) {
    /* star eyes that throb, and a wide open grin */
    float throb = 1.0 + 0.12 * sin(t * 9.0);
    for (int i = 0; i < 2; i++) {
      vec2 e = (c - vec2(i == 0 ? -4.5 : 4.5, 1.6)) / throb;
      v = max(v, lit(fxStarLed(e, 2.2, 0.48) * throb - 0.1, soft));
    }
    v = max(v, faceMouth(c - vec2(0.0, 0.6), 2.6, 0.0, 0.7, soft));
  } else if (is(state, E_SAD)) {
    /* eyes cut away at the outer top, a frown, and a tear now and then */
    for (int i = 0; i < 2; i++) {
      float side = i == 0 ? -1.0 : 1.0;
      float cx = side * 4.5;
      float box = sdBox2(c - vec2(cx, 1.0), vec2(1.5, 1.6)) - 0.15;
      float slope = (c.y - 1.9) + 0.55 * (c.x - cx) * side;
      v = max(v, lit(max(box, slope), soft));
    }
    float frown = max(abs(length(c - vec2(0.0, -7.2)) - 2.6) - 0.4, -(c.y + 5.4));
    v = max(v, lit(frown, soft));
    float k = fract(t * 0.35);
    float tear = length((c - vec2(-5.4, -0.6 - k * 5.0)) / vec2(0.8, 1.0)) - 0.6;
    v = max(v, lit(tear, soft) * smoothstep(0.0, 0.1, k) * (1.0 - smoothstep(0.6, 0.9, k)));
  } else if (is(state, E_HAPPY)) {
    /* ^ ^ and a smile */
    for (int i = 0; i < 2; i++) {
      float cx = i == 0 ? -4.5 : 4.5;
      float d = min(sdSegment(c, vec2(cx - 1.7, 0.4), vec2(cx, 2.2)), sdSegment(c, vec2(cx, 2.2), vec2(cx + 1.7, 0.4))) - 0.5;
      v = max(v, lit(d, soft));
    }
    float d = min(min(sdSegment(c, vec2(-3.0, -3.0), vec2(-1.3, -4.6)), sdSegment(c, vec2(-1.3, -4.6), vec2(1.3, -4.6))), sdSegment(c, vec2(1.3, -4.6), vec2(3.0, -3.0))) - 0.45;
    v = max(v, lit(d, soft));
  } else {
    v = faceEyes(c, soft);
  }
  return v;
}

/* the face at c, cross-faded from the previous state and glitched on a switch */
float face(vec2 c, float soft) {
  float row = floor(c.y);
  float tick = floor(uTime * 24.0);
  /* an error keeps glitching now and then */
  float glitch = max(uFaceC.w, is(uFaceC.x, E_ERROR) ? 0.6 * step(0.86, hash12(vec2(floor(uTime * 8.0), 7.7))) : 0.0);
  c.x += (hash12(vec2(row, tick)) - 0.5) * 7.0 * glitch * step(0.6, hash12(vec2(row * 1.7, tick)));
  float now = faceFor(uFaceC.x, c, uFaceD.x, soft);
  float before = faceFor(uFaceC.y, c, uFaceD.x, soft);
  float v = mix(before, now, uFaceC.z);
  return v * (1.0 - glitch * 0.45 * hash12(vec2(tick, 3.1)));
}

/* the emitted light of the matrix at a point on the screen (screen-local, in units) */
vec3 screenLight(vec2 q, vec3 color, float cell, vec2 extent, float corner) {
  vec2 c = q / cell;
  vec2 cellCentre = floor(c) + 0.5;
  vec2 f = fract(c) - 0.5;
  /* round LEDs, averaged out when one is smaller than a couple of pixels */
  float dotMask = 1.0 - smoothstep(0.26, 0.4, length(f));
  float footprint = gPixel / cell;
  dotMask = mix(dotMask, 0.5, smoothstep(0.18, 0.45, footprint));
  float led = face(cellCentre, 0.25);
  float glow = face(c, 1.6);
  float edge = smoothstep(0.0, 0.05, -sdRoundRect(q, extent, corner));
  /* a faint glare across the glass */
  float glare = 0.025 * smoothstep(0.1, 0.0, abs(q.x * 0.7 + q.y - extent.y * 0.35));
  vec3 lit = color * (led * dotMask * 2.1 + glow * 0.2) + glare + vec3(0.012, 0.016, 0.03) * dotMask;
  return lit * edge;
}
`;
