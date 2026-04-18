/**
 * Right circular cone along +Y: x² + z² = c² y², c = tan(60°).
 * Cutting plane n·x = d with optional small rotations (plane position sliders).
 */

import {
  analyzeQuadraticConic,
  buildPlaneFrame,
  conePlaneQuadratic,
  sampleConicUVGeneral,
  type Quad6,
  type QuadAnalysis,
  type SampledUV,
  uvToWorld,
} from "./planeConic";

export type { SampledUV } from "./planeConic";

export type ConicKind = "circle" | "ellipse" | "parabola" | "hyperbola";

export const CONE_SLOPE = Math.tan((60 * Math.PI) / 180);
export const PLANE_D = 2.25;

/** Max |planeSx|·this (rad): R_y sways normal → world left/right motion of the cut. */
export const PLANE_SWAY_RY = 0.68;
/** Max |planeSy|·this (rad): R_x tilts normal → world up/down motion of the cut. */
export const PLANE_SWAY_RX = 0.55;

export const ECCENTRICITY_MODEL_MAX = Math.sqrt(1 + CONE_SLOPE * CONE_SLOPE);

const PARABOLA_DET_BAND = 2.5e-4;

export type ConicAnalysis = {
  theta: number;
  kind: ConicKind;
  eccentricity: number;
  normal: [number, number, number];
  p0: [number, number, number];
  uHat: [number, number, number];
  vHat: [number, number, number];
  planeSx: number;
  planeSy: number;
  quad: Quad6;
  qa: QuadAnalysis;
  /** Legacy fields used by older code paths; `vCenter` is QA center v (≈ vc). */
  C: number;
  E: number;
  F: number;
  vCenter: number;
  uMean: number;
};

function mergeParabolaKind(kind: ConicKind, disc: number): ConicKind {
  if (kind === "ellipse" && Math.abs(disc) < PARABOLA_DET_BAND) return "parabola";
  return kind;
}

export function analyzeConic(
  theta: number,
  c: number = CONE_SLOPE,
  d: number = PLANE_D,
  planeSx: number = 0,
  planeSy: number = 0,
): ConicAnalysis {
  const { n, p0, uHat, vHat } = buildPlaneFrame(
    theta,
    d,
    planeSx,
    planeSy,
    PLANE_SWAY_RY,
    PLANE_SWAY_RX,
  );
  const quad = conePlaneQuadratic(c, p0, uHat, vHat);
  const qa0 = analyzeQuadraticConic(quad, PARABOLA_DET_BAND);
  const kind = mergeParabolaKind(qa0.kind, qa0.disc);
  const eccentricity = kind === "parabola" ? 1 : qa0.eccentricity;
  const qa: QuadAnalysis = { ...qa0, kind, eccentricity };

  return {
    theta,
    kind,
    eccentricity,
    normal: n,
    p0,
    uHat,
    vHat,
    planeSx,
    planeSy,
    quad,
    qa,
    C: quad.A,
    E: quad.E,
    F: quad.F,
    vCenter: qa.vc,
    uMean: qa.uc,
  };
}

export function eccentricityAtTheta(
  theta: number,
  c: number = CONE_SLOPE,
  d: number = PLANE_D,
  planeSx: number = 0,
  planeSy: number = 0,
): number {
  return analyzeConic(theta, c, d, planeSx, planeSy).eccentricity;
}

export function thetaForTargetEccentricity(
  targetE: number,
  c: number = CONE_SLOPE,
  d: number = PLANE_D,
  planeSx: number = 0,
  planeSy: number = 0,
): number {
  const eCap = Math.sqrt(1 + c * c) - 1e-12;
  const clamped = Math.max(0, Math.min(targetE, eCap));
  const f = (t: number) =>
    eccentricityAtTheta(t, c, d, planeSx, planeSy) - clamped;

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
): SampledUV {
  return sampleConicUVGeneral(analysis.quad, analysis.qa, segments);
}

export function sampleConicWorld(
  analysis: ConicAnalysis,
  segments: number,
): { xyz: Float32Array; hyperbolaSplit?: number } {
  const { uv, hyperbolaSplit } = sampleConicUVGeneral(
    analysis.quad,
    analysis.qa,
    segments,
  );
  const out = new Float32Array(uv.length * 3);
  let o = 0;
  for (const [u, v] of uv) {
    const p = uvToWorld(u, v, analysis.p0, analysis.uHat, analysis.vHat);
    out[o++] = p[0];
    out[o++] = p[1];
    out[o++] = p[2];
  }
  return { xyz: out, hyperbolaSplit };
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
