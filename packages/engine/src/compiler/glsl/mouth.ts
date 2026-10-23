/* A painted cartoon mouth, drawn as one shape: an upper and a lower lip
   that meet at the corners. Closed, the lips coincide and the shape is a
   stroke; as the mouth opens they part into a D, so there is never a line
   drawn across an opening. Round vowels pull the corners in and lift the
   upper lip into an O. */

export const MOUTH = /* glsl */ `
/* q: point in mouth space (x right, y up); w: half width; open: lip
   separation in the same units; round: 0 for "ah"/"ee", 1 for "oo";
   smile: -1..1; crooked: -1..1 tilts and wobbles the line, as when something
   is wrong; t: half the stroke; px: a pixel in mouth units.
   Returns coverage, tongue coverage, and depth inside the mouth (0 at the lips, 1 deep). */
vec3 mouth(vec2 q, float w, float open, float round, float smile, float crooked, float t, float px) {
  float opened = smoothstep(0.0, 0.25 * w, open);
  w *= 1.0 - 0.3 * round * opened;
  open *= 1.0 + 0.1 * round;
  /* an "oo" pushes the lips forward and flattens the smile out of them */
  float bend = smile * 0.55 * (1.0 - 0.7 * round * opened);

  float u = clamp(q.x / w, -1.0, 1.0);
  float bulge = sqrt(max(1.0 - u * u, 0.0));
  float line = bend * w * u * u + crooked * w * (0.22 * u + 0.12 * sin(u * 6.0));
  float upper = line + open * (0.22 + 0.45 * round) * bulge;
  float lower = line - open * bulge;

  /* vertical distances are cheap and exact along y; the slope converts the
     antialiasing width so the steep sides near the corners stay crisp */
  float steep = abs(u) / max(bulge, 0.08);
  float slope = abs(2.0 * bend * u) + abs(crooked) * 0.9 + open / w * steep;
  float aa = px * sqrt(1.0 + min(slope * slope, 36.0));

  /* the lips taper toward the corners once the mouth is open */
  float lip = t * mix(1.0, sqrt(bulge), opened);
  float inside = max(q.y - upper, lower - q.y);
  float body = abs(q.x) <= w ? inside - lip : 1e3;
  /* round caps finish the closed stroke; an open mouth's lips already meet in a point */
  float cap = length(vec2(abs(q.x) - w, q.y - bend * w - crooked * w * (0.22 * sign(q.x) + 0.12 * sin(6.0 * sign(q.x))))) - t;
  float a = max(1.0 - smoothstep(-aa, aa, body), (1.0 - smoothstep(-px, px, cap)) * (1.0 - opened));

  /* a tongue resting on the lower lip, only inside the opening */
  float hole = 1.0 - smoothstep(-aa, aa, inside);
  vec2 tq = vec2(q.x / (w * (0.5 - 0.1 * round)), (q.y + open * 0.78) / max(0.42 * open, 1e-4));
  float tongue = (1.0 - smoothstep(-0.08, 0.08, length(tq) - 1.0)) * hole * smoothstep(0.08, 0.35, open / w);

  float depth = clamp(-inside / max(0.5 * open, 1e-4), 0.0, 1.0) * hole;
  return vec3(a, tongue, depth);
}
`;
