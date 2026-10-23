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
  float closeTop = max(blink * 0.48, uFaceA.y * 0.42);
  float closeBottom = max(blink * 0.48, uFaceA.z * 0.4);
  float v = 0.0;
  for (int i = 0; i < 2; i++) {
    float side = i == 0 ? -1.0 : 1.0;
    float cx = side * 4.5 + g.x;
    float top = 3.5 + g.y - 4.0 * closeTop;
    float bottom = -0.5 + g.y + 4.0 * closeBottom;
    float h = max((top - bottom) * 0.5, 0.32);
    float d = sdBox2(c - vec2(cx, (top + bottom) * 0.5), vec2(1.5, h)) - 0.15;
    v = max(v, lit(d, soft));
  }
  return v;
}

float faceZ(vec2 c, vec2 at, float s, float soft) {
  vec2 p = (c - at) / s;
  float d = min(min(sdSegment(p, vec2(-1, 1), vec2(1, 1)), sdSegment(p, vec2(1, 1), vec2(-1, -1))), sdSegment(p, vec2(-1, -1), vec2(1, -1)));
  return lit(d * s - 0.32, soft);
}

float faceFor(float state, vec2 c, float t, float soft) {
  float v = 0.0;
  if (state < 0.5) {
    /* idle */
    v = faceEyes(c, soft);
  } else if (state < 1.5) {
    /* thinking: heavy-lidded eyes looking up, three dots pulsing in turn */
    v = faceEyes(c, soft);
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float pulse = 0.5 + 0.5 * sin(t * 4.2 - fi * 1.1);
      float d = length(c - vec2(-2.4 + fi * 2.4, -4.4)) - 0.62;
      v = max(v, lit(d, soft) * (0.25 + 0.75 * pulse * pulse));
    }
  } else if (state < 2.5) {
    /* listening: alert eyes over a live equaliser */
    v = faceEyes(c, soft);
    for (int i = 0; i < 7; i++) {
      float fi = float(i);
      float level = abs(sin(t * (5.0 + fi * 1.3) + fi * 1.7)) * (0.55 + 0.45 * sin(t * 2.3 + fi));
      float d = sdBox2(c - vec2(-4.5 + fi * 1.5, -4.6), vec2(0.42, 0.45 + 1.6 * level));
      v = max(v, lit(d, soft) * 0.9);
    }
  } else if (state < 3.5) {
    /* speaking: a mouth that moves with the words */
    v = faceEyes(c, soft);
    float talk = uFaceB.x;
    float d = sdBox2(c - vec2(0.0, -4.4), vec2(2.4 - talk * 0.7, 0.3 + talk * 1.5)) - 0.25;
    v = max(v, lit(d, soft));
  } else if (state < 4.5) {
    /* sleeping: closed eyes and rising z's */
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
  } else {
    /* happy: ^ ^ and a smile */
    for (int i = 0; i < 2; i++) {
      float cx = i == 0 ? -4.5 : 4.5;
      float d = min(sdSegment(c, vec2(cx - 1.7, 0.4), vec2(cx, 2.2)), sdSegment(c, vec2(cx, 2.2), vec2(cx + 1.7, 0.4))) - 0.5;
      v = max(v, lit(d, soft));
    }
    float d = min(min(sdSegment(c, vec2(-3.0, -3.0), vec2(-1.3, -4.6)), sdSegment(c, vec2(-1.3, -4.6), vec2(1.3, -4.6))), sdSegment(c, vec2(1.3, -4.6), vec2(3.0, -3.0))) - 0.45;
    v = max(v, lit(d, soft));
  }
  return v;
}

/* the face at c, cross-faded from the previous state and glitched on a switch */
float face(vec2 c, float soft) {
  float glitch = uFaceC.w;
  float row = floor(c.y);
  float tick = floor(uTime * 24.0);
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
