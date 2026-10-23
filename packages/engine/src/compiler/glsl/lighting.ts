/* The studio every character is lit in: a key from the upper left, a cool
   fill, a sky dome, a softbox overhead and the key's window caught in a
   clear coat's reflection, a back light rimming the silhouette, light
   scattered under translucent skins, and a filmic tone curve. All in
   linear light. Shadows and occlusion are marched against the same
   distance field the surface comes from, so every shape gets them free. */

export const LIGHTING = /* glsl */ `
const vec3 KEY = vec3(-0.4485, 0.6997, 0.5562);
const vec3 FILL = vec3(0.8521, -0.1504, 0.5013);
const vec3 BACK = vec3(0.5529, 0.5529, -0.6233);

struct Material {
  vec3 albedo;
  float f0;
  float spec;
  float shininess;
  float metal;
  float rim;
  float sheen;
  float sss;
  vec3 sssColor;
  vec3 emit;
  float gloss;
};

Material material(vec3 albedo) {
  return Material(albedo, 0.04, 0.5, 40.0, 0.0, 0.5, 0.0, 0.0, vec3(0.0), vec3(0.0), 0.3);
}

/* the studio as seen in a reflection along r; gloss tightens the edges of the lights */
vec3 environment(vec3 r, float gloss) {
  float up = r.y;
  float horizon = 0.05 + 0.12 * smoothstep(-0.25, 0.3, up);
  float softbox = 1.1 * smoothstep(mix(0.42, 0.66, gloss), mix(0.78, 0.7, gloss), up) * smoothstep(-0.9, mix(-0.2, -0.75, gloss), r.z - 0.6 * abs(r.x));
  float window = 2.6 * smoothstep(mix(0.86, 0.95, gloss), mix(0.97, 0.965, gloss), dot(r, KEY));
  float strip = 0.5 * smoothstep(0.6, 0.85, -r.x) * smoothstep(-0.35, 0.05, up) * (1.0 - smoothstep(0.2, 0.5, up));
  float floorBounce = 0.06 * smoothstep(0.0, -0.6, up);
  return vec3(0.97, 0.99, 1.04) * (horizon + softbox + window + strip) + vec3(1.0, 0.92, 0.85) * floorBounce;
}

float softShadow(vec3 ro, vec3 rd, float tmin, float tmax, float k) {
  float res = 1.0;
  float t = tmin;
  for (int i = ZERO; i < 32; i++) {
    float h = map(ro + rd * t).x;
    res = min(res, k * h / t);
    t += clamp(h, 0.012, 0.2);
    if (res < 0.002 || t > tmax) break;
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res);
}

float ambientOcclusion(vec3 p, vec3 n) {
  float occ = 0.0, sca = 1.0;
  for (int i = ZERO; i < 5; i++) {
    float h = 0.012 + 0.12 * float(i) / 4.0;
    occ += (h - map(p + h * n).x) * sca;
    sca *= 0.85;
  }
  return clamp(1.0 - 2.2 * occ, 0.0, 1.0);
}

/* 0 where the body is thick behind the surface, 1 where light gets through */
float thinness(vec3 p, vec3 n) {
  float s = 0.0;
  for (int i = ZERO; i < 3; i++) {
    float h = 0.05 + 0.09 * float(i);
    s += clamp((map(p - n * h).x + h) / h, 0.0, 1.0);
  }
  return s / 3.0;
}

vec3 shade(Material m, vec3 p, vec3 n, vec3 v) {
  vec3 key = KEY;
  float sh = softShadow(p + n * 0.004, key, 0.01, 2.5, 9.0);
  float ao = ambientOcclusion(p, n);

  float ndl = dot(n, key);
  /* a little wrap so the terminator is soft, like a moulded part */
  float keyLight = max(0.0, (ndl + 0.12) / 1.12) * sh;
  float fill = max(0.0, dot(n, FILL));
  float sky = 0.5 + 0.5 * n.y;
  float ndv = max(0.0, dot(n, v));
  float fres = m.f0 + (1.0 - m.f0) * pow(1.0 - ndv, 5.0);
  vec3 r = reflect(-v, n);
  float specOcc = mix(ao, 1.0, 0.35) * mix(sh, 1.0, 0.6);
  vec3 env = environment(r, m.gloss) * fres * specOcc;
  float hi = m.spec * pow(max(0.0, dot(n, normalize(key + v))), m.shininess) * sh;
  float back = max(0.0, dot(n, BACK));
  float rim = m.rim * back * back * pow(1.0 - ndv, 1.6);
  float bounce = 0.1 * max(0.0, -n.y);

  float diffuse = (0.06 + 0.12 * sky) * ao + 1.2 * keyLight + 0.16 * fill * ao + bounce * ao;
  vec3 tint = vec3(1.0 - m.metal) + m.metal * m.albedo * 2.2;
  vec3 col = m.albedo * diffuse * (1.0 - fres * 0.6);
  col += (env + hi) * tint;
  col += rim * vec3(0.62, 0.78, 1.0) * (0.35 + m.albedo);
  /* velvet: fibres catch light at grazing angles */
  col += m.sheen * pow(1.0 - ndv, 2.5) * (0.4 + 0.6 * keyLight) * (m.albedo * 0.7 + 0.3);

  if (m.sss > 0.0) {
    float th = thinness(p, n);
    float through = pow(clamp(dot(v, -key) * 0.5 + 0.5, 0.0, 1.0), 2.0);
    col += m.sssColor * m.sss * (0.18 + 0.55 * th + 0.4 * through * th) * (0.55 + 0.45 * ao);
  }
  return col + m.emit;
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
`;
