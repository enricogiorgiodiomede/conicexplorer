/**
 * Right circular cone along +Y: x^2 + z^2 = c^2 y^2, c = tan(α).
 * Apex half-angle α = 60° so c = √3 and the hyperbola limit gives e_max = √(1+c²) = 2.
 * Cutting plane: y cos(theta) + z sin(theta) = d (unit normal (0, cos θ, sin θ)).
 * Plane coordinates: point = p0 + u ex + v eV, p0 = d n.
 */

export type ConicKind = "circle" | "ellipse" | "parabola" | "hyperbola";

/** tan(60°) = √3 — steeper cone so the eccentricity slider can reach e = 2. */
export const CONE_SLOPE = Math.tan((60 * Math.PI) / 180);
export const PLANE_D = 2.25;

/**
 * Largest eccentricity this cone + plane setup can reach: hyperbola limit as
 * θ → π/2, where |C| → c² and (for this parameterization) e → √(1 + c²).
 * Values above this cannot change θ — the slider should stop here.
 */
export const ECCENTRICITY_MODEL_MAX = Math.sqrt(1 + CONE_SLOPE * CONE_SLOPE);

const EPS = 1e-9;

/**
 * Discriminant-style coefficient C = cos²θ − c²sin²θ is 0 at a true parabolic cut.
 * Bisection never hits that exactly, so |C| is tiny positive while the section is
 * still numerically an "ellipse" with e ≈ 1 (degenerate / looks like a line in u,v).
 * Treat this band as parabolic so UI and e=1 preset match geometry.
 */
const PARABOLA_C_MAX = 1e-3;

export type ConicAnalysis = {
  theta: number;
  kind: ConicKind;
  /** Eccentricity of the section (0 circle, 1 parabola, >1 hyperbola). */
  eccentricity: number;
  /** Plane normal (unit). */
  normal: [number, number, number];
  /** Point on plane (closest to origin). */
  p0: [number, number, number];
  /** Orthonormal basis in plane: u along +X, v = n × u. */
  uHat: [number, number, number];
  vHat: [number, number, number];
  /** Quadratic in plane coords (u,v): u^2 + C v^2 + E v + F = 0 */
  C: number;
  E: number;
  F: number;
  /** Center in (u,v) after completing square in v (only meaningful when C != 0). */
  vCenter: number;
  /** Affine shift for plotting centered conic. */
  uMean: number;
};

function coeffs(theta: number, c: number, d: number) {
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const C = ct * ct - c * c * st * st;
  const E = 2 * d * st * ct * (1 + c * c);
  const F = d * d * (st * st - c * c * ct * ct);
  const n: [number, number, number] = [0, ct, st];
  const p0: [number, number, number] = [0, d * ct, d * st];
  const uHat: [number, number, number] = [1, 0, 0];
  const vHat: [number, number, number] = [0, -st, ct];
  return { C, E, F, n, p0, uHat, vHat, ct, st };
}

function uvToWorld(
  u: number,
  v: number,
  p0: [number, number, number],
  uHat: [number, number, number],
  vHat: [number, number, number],
): [number, number, number] {
  return [
    p0[0] + u * uHat[0] + v * vHat[0],
    p0[1] + u * uHat[1] + v * vHat[1],
    p0[2] + u * uHat[2] + v * vHat[2],
  ];
}

export function analyzeConic(
  theta: number,
  c: number = CONE_SLOPE,
  d: number = PLANE_D,
): ConicAnalysis {
  const { C, E, F, n, p0, uHat, vHat } = coeffs(theta, c, d);

  // Parabolic transition lives at C = 0 (between ellipse C>0 and hyperbola C<0).
  // Only widen on the ellipse side (C ≥ 0) so we do not label hyperbolas as parabolas.
  if (C >= 0 && C <= PARABOLA_C_MAX) {
    // Parabola: u^2 + E v + F = 0
    return {
      theta,
      kind: "parabola",
      eccentricity: 1,
      normal: n,
      p0,
      uHat,
      vHat,
      C,
      E,
      F,
      vCenter: 0,
      uMean: 0,
    };
  }

  const vCenter = -E / (2 * C);
  const K = (E * E) / (4 * C) - F;

  if (C > 0) {
    if (K <= EPS) {
      // Degenerate / near vertex — treat as very skinny ellipse limit
      return {
        theta,
        kind: "ellipse",
        eccentricity: 0,
        normal: n,
        p0,
        uHat,
        vHat,
        C,
        E,
        F,
        vCenter,
        uMean: 0,
      };
    }
    const a2 = K;
    const b2 = K / C;
    const am = Math.max(a2, b2);
    const bm = Math.min(a2, b2);
    const ratio = bm / am;
    const e = Math.sqrt(Math.max(0, Math.min(1, 1 - ratio)));
    const kind: ConicKind = e < 1e-3 ? "circle" : "ellipse";
    return {
      theta,
      kind,
      eccentricity: e,
      normal: n,
      p0,
      uHat,
      vHat,
      C,
      E,
      F,
      vCenter,
      uMean: 0,
    };
  }

  // Hyperbola: C < 0  =>  U^2 - |C| V^2 = K,  V = v - vCenter,  U = u
  const absC = -C;
  if (Math.abs(K) < EPS) {
    return {
      theta,
      kind: "hyperbola",
      eccentricity: Math.sqrt(1 + absC),
      normal: n,
      p0,
      uHat,
      vHat,
      C,
      E,
      F,
      vCenter,
      uMean: 0,
    };
  }

  let a2: number;
  let b2: number;
  if (K > 0) {
    // U^2 / K - V^2 / (K / |C|) = 1
    a2 = K;
    b2 = K / absC;
  } else {
    // |C| V^2 - U^2 = -K  =>  V^2 / ((-K)/|C|) - U^2 / (-K) = 1
    a2 = -K / absC;
    b2 = -K;
  }
  const e = Math.sqrt(1 + b2 / a2);
  return {
    theta,
    kind: "hyperbola",
    eccentricity: e,
    normal: n,
    p0,
    uHat,
    vHat,
    C,
    E,
    F,
    vCenter,
    uMean: 0,
  };
}

export function eccentricityAtTheta(
  theta: number,
  c: number = CONE_SLOPE,
  d: number = PLANE_D,
): number {
  return analyzeConic(theta, c, d).eccentricity;
}

/**
 * Find theta such that eccentricity(theta) ~= targetE (monotone in theta for this setup).
 */
export function thetaForTargetEccentricity(
  targetE: number,
  c: number = CONE_SLOPE,
  d: number = PLANE_D,
): number {
  const eCap = Math.sqrt(1 + c * c) - 1e-12;
  const clamped = Math.max(0, Math.min(targetE, eCap));
  const f = (t: number) => eccentricityAtTheta(t, c, d) - clamped;

  if (clamped <= 1e-6) return 0;

  let lo = 0;
  let hi = 1.35;
  let flo = f(lo);
  let fhi = f(hi);
  let guard = 0;
  while (fhi < 0 && hi < Math.PI / 2 - 0.04 && guard < 60) {
    hi += 0.03;
    fhi = f(hi);
    guard++;
  }

  if (fhi <= 0) return hi;
  if (flo >= 0) return 0;

  for (let i = 0; i < 90; i++) {
    const mid = 0.5 * (lo + hi);
    const fm = f(mid);
    if (Math.abs(fm) < 1e-6) return mid;
    if (fm * flo < 0) {
      hi = mid;
      fhi = fm;
    } else {
      lo = mid;
      flo = fm;
    }
  }
  return 0.5 * (lo + hi);
}

export function sampleConicUV(
  analysis: ConicAnalysis,
  segments: number,
): [number, number][] {
  const { C, E, F, kind } = analysis;
  const vC = analysis.vCenter;
  const pts: [number, number][] = [];

  if (kind === "parabola" || (C >= 0 && C <= PARABOLA_C_MAX)) {
    const uMax = 3.2;
    for (let i = 0; i <= segments; i++) {
      const u = -uMax + (2 * uMax * i) / segments;
      if (Math.abs(E) < EPS) continue;
      const v = -(u * u + F) / E;
      pts.push([u, v]);
    }
    return pts;
  }

  if (kind === "ellipse" || kind === "circle") {
    const K = (E * E) / (4 * C) - F;
    if (K <= EPS) return pts;
    const a = Math.sqrt(K);
    const b = Math.sqrt(K / C);
    for (let i = 0; i <= segments; i++) {
      const t = (2 * Math.PI * i) / segments;
      const uc = a * Math.cos(t);
      const vc = b * Math.sin(t);
      pts.push([uc, vc + vC]);
    }
    return pts;
  }

  // Hyperbola — two branches; same K as in analyzeConic
  const absC = -C;
  const K = (E * E) / (4 * C) - F;
  const half = Math.max(8, Math.floor(segments / 2));
  const tMax = 2.35;

  if (K > 0) {
    const a = Math.sqrt(K);
    const b = Math.sqrt(K / absC);
    for (let i = -half; i <= half; i++) {
      const t = (i / half) * tMax;
      const uc = a * Math.cosh(t);
      const vc = b * Math.sinh(t);
      pts.push([uc, vc + vC]);
    }
    for (let i = -half; i <= half; i++) {
      const t = (i / half) * tMax;
      const uc = -a * Math.cosh(t);
      const vc = b * Math.sinh(t);
      pts.push([uc, vc + vC]);
    }
  } else {
    const a = Math.sqrt(-K / absC);
    const b = Math.sqrt(-K);
    for (let i = -half; i <= half; i++) {
      const t = (i / half) * tMax;
      const vc = a * Math.cosh(t);
      const uc = b * Math.sinh(t);
      pts.push([uc, vc + vC]);
    }
    for (let i = -half; i <= half; i++) {
      const t = (i / half) * tMax;
      const vc = -a * Math.cosh(t);
      const uc = b * Math.sinh(t);
      pts.push([uc, vc + vC]);
    }
  }

  return pts;
}

export function sampleConicWorld(
  analysis: ConicAnalysis,
  segments: number,
): Float32Array {
  const uv = sampleConicUV(analysis, segments);
  const out = new Float32Array(uv.length * 3);
  let o = 0;
  for (const [u, v] of uv) {
    const p = uvToWorld(u, v, analysis.p0, analysis.uHat, analysis.vHat);
    out[o++] = p[0];
    out[o++] = p[1];
    out[o++] = p[2];
  }
  return out;
}

export function conicTitle(kind: ConicKind): string {
  switch (kind) {
    case "circle":
      return "Circle";
    case "ellipse":
      return "Ellipse";
    case "parabola":
      return "Parabola (e = 1)";
    case "hyperbola":
      return "Hyperbola";
  }
}
