/**
 * Cone x² + z² = c² y² (Y up) with plane n·x = d and patch p = p0 + u û + v v̂.
 */

export type Vec3 = [number, number, number];

export function dot3(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross3(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function normalize3(v: Vec3): Vec3 {
  const L = Math.hypot(v[0], v[1], v[2]);
  if (L < 1e-15) return [0, 1, 0];
  return [v[0] / L, v[1] / L, v[2] / L];
}

/** Apply R_y(angle) to vector. */
function rotY(v: Vec3, ang: number): Vec3 {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return [c * v[0] + s * v[2], v[1], -s * v[0] + c * v[2]];
}

/** Apply R_x(angle) to vector. */
function rotX(v: Vec3, ang: number): Vec3 {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return [v[0], c * v[1] - s * v[2], s * v[1] + c * v[2]];
}

/** planeSx, planeSy ∈ [-1,1]: small rotations after θ so the cut moves in world X / Y sense. */
export function buildPlaneFrame(
  theta: number,
  d: number,
  planeSx: number,
  planeSy: number,
  maxRy: number,
  maxRx: number,
): { n: Vec3; p0: Vec3; uHat: Vec3; vHat: Vec3 } {
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const n0: Vec3 = [0, ct, st];
  const n1 = rotY(n0, planeSx * maxRy);
  const n = normalize3(rotX(n1, planeSy * maxRx));
  const p0: Vec3 = [n[0] * d, n[1] * d, n[2] * d];
  const up: Vec3 = [0, 1, 0];
  let u0 = cross3(up, n);
  if (Math.hypot(u0[0], u0[1], u0[2]) < 1e-6) {
    u0 = cross3([1, 0, 0], n);
  }
  const uHat = normalize3(u0);
  const vHat = normalize3(cross3(n, uHat));
  return { n, p0, uHat, vHat };
}

export type Quad6 = {
  A: number;
  B: number;
  G: number;
  D: number;
  E: number;
  F: number;
};

export function conePlaneQuadratic(
  c: number,
  p0: Vec3,
  uHat: Vec3,
  vHat: Vec3,
): Quad6 {
  const [rx, ry, rz] = p0;
  const [ux, uy, uz] = uHat;
  const [vx, vy, vz] = vHat;
  const c2 = c * c;
  const A = ux * ux + uz * uz - c2 * uy * uy;
  const B = vx * vx + vz * vz - c2 * vy * vy;
  const G = 2 * (ux * vx + uz * vz - c2 * uy * vy);
  const D = 2 * (rx * ux + rz * uz - c2 * ry * uy);
  const E = 2 * (rx * vx + rz * vz - c2 * ry * vy);
  const F = rx * rx + rz * rz - c2 * ry * ry;
  return { A, B, G, D, E, F };
}

export type QuadAnalysis = {
  kind: "circle" | "ellipse" | "parabola" | "hyperbola";
  eccentricity: number;
  disc: number;
  uc: number;
  vc: number;
  Fc: number;
  lam1: number;
  lam2: number;
  phi: number;
};

const EPS = 1e-10;

function sym2Eigen(A: number, h: number, B: number): { lam1: number; lam2: number; phi: number } {
  const tr = A + B;
  const det = A * B - h * h;
  const disc = Math.max(0, (tr * tr) / 4 - det);
  const gap = Math.sqrt(disc);
  const lam1 = tr / 2 + gap;
  const lam2 = tr / 2 - gap;
  let phi = 0;
  if (Math.abs(h) > 1e-14 || Math.abs(A - B) > 1e-14) {
    phi = 0.5 * Math.atan2(2 * h, A - B);
  }
  return { lam1, lam2, phi };
}

export function analyzeQuadraticConic(q: Quad6, parabolaDetBand: number): QuadAnalysis {
  const { A, B, G, D, E, F } = q;
  const h = G / 2;
  const detM = A * B - h * h;

  if (Math.abs(detM) < parabolaDetBand) {
    return {
      kind: "parabola",
      eccentricity: 1,
      disc: detM,
      uc: 0,
      vc: 0,
      Fc: F,
      lam1: A,
      lam2: B,
      phi: 0,
    };
  }

  const detC = 4 * A * B - G * G;
  if (Math.abs(detC) < 1e-14) {
    return {
      kind: "parabola",
      eccentricity: 1,
      disc: detM,
      uc: 0,
      vc: 0,
      Fc: F,
      lam1: A,
      lam2: B,
      phi: 0,
    };
  }

  const uc = (-2 * B * D + G * E) / detC;
  const vc = (-2 * A * E + G * D) / detC;
  const Fc =
    A * uc * uc + B * vc * vc + G * uc * vc + D * uc + E * vc + F;

  const { lam1, lam2, phi } = sym2Eigen(A, h, B);

  if (Math.abs(lam1) < EPS || Math.abs(lam2) < EPS) {
    return {
      kind: "parabola",
      eccentricity: 1,
      disc: detM,
      uc,
      vc,
      Fc,
      lam1,
      lam2,
      phi,
    };
  }

  const prod = lam1 * lam2;

  if (prod > EPS) {
    const bothPos = lam1 > 0 && lam2 > 0;
    const bothNeg = lam1 < 0 && lam2 < 0;
    let ap2: number;
    let bp2: number;
    if (bothPos) {
      if (Fc >= -EPS) {
        return {
          kind: "ellipse",
          eccentricity: 0,
          disc: detM,
          uc,
          vc,
          Fc,
          lam1,
          lam2,
          phi,
        };
      }
      ap2 = -Fc / lam1;
      bp2 = -Fc / lam2;
    } else if (bothNeg) {
      if (Fc <= EPS) {
        return {
          kind: "ellipse",
          eccentricity: 0,
          disc: detM,
          uc,
          vc,
          Fc,
          lam1,
          lam2,
          phi,
        };
      }
      ap2 = Fc / (-lam1);
      bp2 = Fc / (-lam2);
    } else {
      return {
        kind: "parabola",
        eccentricity: 1,
        disc: detM,
        uc,
        vc,
        Fc,
        lam1,
        lam2,
        phi,
      };
    }
    if (ap2 <= EPS || bp2 <= EPS) {
      return {
        kind: "ellipse",
        eccentricity: 0,
        disc: detM,
        uc,
        vc,
        Fc,
        lam1,
        lam2,
        phi,
      };
    }
    const am = Math.max(ap2, bp2);
    const bm = Math.min(ap2, bp2);
    const e = Math.sqrt(Math.max(0, Math.min(1, 1 - bm / am)));
    const kind: "circle" | "ellipse" = e < 1e-3 ? "circle" : "ellipse";
    return {
      kind,
      eccentricity: e,
      disc: detM,
      uc,
      vc,
      Fc,
      lam1,
      lam2,
      phi,
    };
  }

  if (prod < -EPS) {
    let a2: number;
    let b2: number;
    if (Fc === 0) {
      return {
        kind: "hyperbola",
        eccentricity: Math.SQRT2,
        disc: detM,
        uc,
        vc,
        Fc,
        lam1,
        lam2,
        phi,
      };
    }
    if (lam1 > 0 && lam2 < 0) {
      if (lam1 * Fc < 0) {
        a2 = -Fc / lam1;
        b2 = Fc / lam2;
      } else {
        a2 = Fc / lam1;
        b2 = -Fc / lam2;
      }
    } else if (lam1 < 0 && lam2 > 0) {
      if (lam2 * Fc < 0) {
        a2 = -Fc / lam2;
        b2 = Fc / lam1;
      } else {
        a2 = Fc / lam2;
        b2 = -Fc / lam1;
      }
    } else {
      a2 = Math.abs(Fc / lam1);
      b2 = Math.abs(Fc / lam2);
    }
    const ta2 = Math.max(Math.abs(a2), Math.abs(b2));
    const tb2 = Math.min(Math.abs(a2), Math.abs(b2));
    if (tb2 < EPS || ta2 < EPS) {
      return {
        kind: "hyperbola",
        eccentricity: 1.05,
        disc: detM,
        uc,
        vc,
        Fc,
        lam1,
        lam2,
        phi,
      };
    }
    const e = Math.sqrt(1 + tb2 / ta2);
    return {
      kind: "hyperbola",
      eccentricity: e,
      disc: detM,
      uc,
      vc,
      Fc,
      lam1,
      lam2,
      phi,
    };
  }

  return {
    kind: "parabola",
    eccentricity: 1,
    disc: detM,
    uc,
    vc,
    Fc,
    lam1,
    lam2,
    phi,
  };
}

/** p = p0 + u û + v v̂ */
export function uvToWorld(
  u: number,
  v: number,
  p0: Vec3,
  uHat: Vec3,
  vHat: Vec3,
): Vec3 {
  return [
    p0[0] + u * uHat[0] + v * vHat[0],
    p0[1] + u * uHat[1] + v * vHat[1],
    p0[2] + u * uHat[2] + v * vHat[2],
  ];
}

export type SampledUV = {
  uv: [number, number][];
  /** For hyperbola: index where the second branch starts in `uv`. */
  hyperbolaSplit?: number;
};

/** Semi-axis squares in the (φ-rotated) principal frame; `null` if not a positive ellipse. */
function ellipseSemiAxesSquared(qa: QuadAnalysis): { ax2: number; ay2: number } | null {
  const { lam1, lam2, Fc } = qa;
  if (lam1 * lam2 <= 0) return null;
  if (lam1 > 0 && lam2 > 0) {
    if (Fc >= -1e-14) return null;
    const ax2 = -Fc / lam1;
    const ay2 = -Fc / lam2;
    if (ax2 <= 1e-14 || ay2 <= 1e-14) return null;
    return { ax2, ay2 };
  }
  if (lam1 < 0 && lam2 < 0) {
    if (Fc <= 1e-14) return null;
    const ax2 = Fc / -lam1;
    const ay2 = Fc / -lam2;
    if (ax2 <= 1e-14 || ay2 <= 1e-14) return null;
    return { ax2, ay2 };
  }
  return null;
}

/** Sample A u² + B v² + G u v + D u + E v + F = 0 by scanning u and solving for v. */
export function sampleConicUVGeneral(
  q: Quad6,
  qa: QuadAnalysis,
  segments: number,
): SampledUV {
  const { A, B, G, D, E, F } = q;
  const { kind } = qa;
  const uMax = 4.2;
  const du = (2 * uMax) / segments;

  if (kind === "ellipse" || kind === "circle") {
    const axes = ellipseSemiAxesSquared(qa);
    if (axes) {
      const ax = Math.sqrt(axes.ax2);
      const ay = Math.sqrt(axes.ay2);
      const { uc, vc, phi } = qa;
      const c = Math.cos(phi);
      const s = Math.sin(phi);
      const n = Math.max(32, segments);
      const uv: [number, number][] = [];
      for (let k = 0; k < n; k++) {
        const t = (2 * Math.PI * k) / n;
        const xp = ax * Math.cos(t);
        const yp = ay * Math.sin(t);
        uv.push([uc + xp * c - yp * s, vc + xp * s + yp * c]);
      }
      return { uv };
    }
    const roots: [number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const u = -uMax + i * du;
      const a2 = B;
      const a1 = G * u + E;
      const a0 = A * u * u + D * u + F;
      if (Math.abs(a2) < 1e-12) {
        if (Math.abs(a1) > 1e-12) roots.push([u, -a0 / a1]);
        continue;
      }
      const disc = a1 * a1 - 4 * a2 * a0;
      if (disc < -1e-6) continue;
      const sd = Math.sqrt(Math.max(0, disc));
      const v1 = (-a1 + sd) / (2 * a2);
      const v2 = (-a1 - sd) / (2 * a2);
      if (disc < 1e-10) roots.push([u, v1]);
      else {
        roots.push([u, v1]);
        roots.push([u, v2]);
      }
    }
    if (roots.length < 8) return { uv: roots };
    const centU = roots.reduce((acc, p) => acc + p[0], 0) / roots.length;
    const centV = roots.reduce((acc, p) => acc + p[1], 0) / roots.length;
    const sorted = [...roots].sort((a, b) => {
      const ta = Math.atan2(a[1] - centV, a[0] - centU);
      const tb = Math.atan2(b[1] - centV, b[0] - centU);
      return ta - tb;
    });
    return { uv: sorted };
  }

  if (kind === "hyperbola") {
    const hi: [number, number][] = [];
    const lo: [number, number][] = [];
    const discEps = -1e-11;
    for (let i = 0; i <= segments; i++) {
      const u = -uMax + i * du;
      const a2 = B;
      const a1 = G * u + E;
      const a0 = A * u * u + D * u + F;
      if (Math.abs(a2) < 1e-12) continue;
      const disc = a1 * a1 - 4 * a2 * a0;
      if (disc < discEps) continue;
      const sd = Math.sqrt(Math.max(0, disc));
      const v1 = (-a1 + sd) / (2 * a2);
      const v2 = (-a1 - sd) / (2 * a2);
      const vmax = Math.max(v1, v2);
      const vmin = Math.min(v1, v2);
      hi.push([u, vmax]);
      lo.push([u, vmin]);
    }
    const uv = [...hi, ...lo];
    return { uv, hyperbolaSplit: hi.length };
  }

  const pts: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const u = -uMax + (2 * uMax * i) / segments;
    const a2 = B;
    const a1 = G * u + E;
    const a0 = A * u * u + D * u + F;
    if (Math.abs(a2) < 1e-12) {
      if (Math.abs(a1) > 1e-12) pts.push([u, -a0 / a1]);
      continue;
    }
    const disc = a1 * a1 - 4 * a2 * a0;
    if (disc < -1e-6) continue;
    const s = Math.sqrt(Math.max(0, disc));
    pts.push([u, (-a1 + s) / (2 * a2)]);
  }
  return { uv: pts };
}
