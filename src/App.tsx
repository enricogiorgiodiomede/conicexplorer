import { useMemo, useState } from "react";
import { ConePlaneScene } from "./components/ConePlaneScene";
import { ConicDescription } from "./components/ConicDescription";
import { ConicPlot2D } from "./components/ConicPlot2D";
import {
  analyzeConic,
  conicTitle,
  CONE_SLOPE,
  PLANE_D,
  thetaForTargetEccentricity,
} from "./math/conics";

const E_MIN = 0;
/** Matches √(1 + c²) for the 60° cone (see `CONE_SLOPE` in `conics.ts`). */
const E_MAX = 2;

/** Plane position sliders: −1 (left / down) … 0 … +1 (right / up). */
const PLANE_POS_MIN = -1;
const PLANE_POS_MAX = 1;
const PLANE_POS_STEP = 0.01;

export default function App() {
  const [eccentricity, setEccentricity] = useState(0.45);
  const [planeSx, setPlaneSx] = useState(0);
  const [planeSy, setPlaneSy] = useState(0);

  const theta = useMemo(
    () =>
      thetaForTargetEccentricity(
        eccentricity,
        CONE_SLOPE,
        PLANE_D,
        planeSx,
        planeSy,
      ),
    [eccentricity, planeSx, planeSy],
  );
  const analysis = useMemo(
    () => analyzeConic(theta, CONE_SLOPE, PLANE_D, planeSx, planeSy),
    [theta, planeSx, planeSy],
  );

  const displayE =
    Math.abs(eccentricity - 1) < 0.04 && analysis.kind === "parabola"
      ? 1
      : eccentricity;

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Conic sections</h1>
          <p className="subtitle">
            Drag eccentricity to tilt the plane against the cone. Use the plane
            position sliders to shift the cut left/right and up/down. The 2D panel
            shows the intersection curve in plane coordinates.
          </p>
        </div>
      </header>

      <section className="controls" aria-label="Eccentricity control">
        <label htmlFor="ecc-slider" className="slider-label">
          Eccentricity <span className="mono">{displayE.toFixed(3)}</span>
        </label>
        <input
          id="ecc-slider"
          type="range"
          min={E_MIN}
          max={E_MAX}
          step={0.002}
          value={eccentricity}
          onChange={(e) => setEccentricity(Number(e.target.value))}
        />
        <div className="preset-buttons" role="group" aria-label="Presets">
          <button
            type="button"
            className="preset-btn"
            onClick={() => setEccentricity(0)}
          >
            Circle (e = 0)
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => setEccentricity(1)}
          >
            Parabola (e = 1)
          </button>
        </div>
        <div className="readout">
          <span className="pill">{conicTitle(analysis.kind)}</span>
          <span className="hint">
            Plane tilt θ = {(theta * (180 / Math.PI)).toFixed(2)}° · matched e ≈{" "}
            {analysis.eccentricity.toFixed(3)}
          </span>
        </div>
      </section>

      <section
        className="controls plane-position-controls"
        aria-label="Cutting plane position in world space"
      >
        <label htmlFor="plane-x-slider" className="slider-label">
          Plane position X (left ↔ right){" "}
          <span className="mono">{planeSx.toFixed(2)}</span>
        </label>
        <input
          id="plane-x-slider"
          type="range"
          min={PLANE_POS_MIN}
          max={PLANE_POS_MAX}
          step={PLANE_POS_STEP}
          value={planeSx}
          onChange={(e) => setPlaneSx(Number(e.target.value))}
        />
        <label htmlFor="plane-y-slider" className="slider-label">
          Plane position Y (down ↔ up){" "}
          <span className="mono">{planeSy.toFixed(2)}</span>
        </label>
        <input
          id="plane-y-slider"
          type="range"
          min={PLANE_POS_MIN}
          max={PLANE_POS_MAX}
          step={PLANE_POS_STEP}
          value={planeSy}
          onChange={(e) => setPlaneSy(Number(e.target.value))}
        />
      </section>

      <ConicDescription analysis={analysis} />

      <main className="layout">
        <div className="panel panel-3d">
          <ConePlaneScene analysis={analysis} />
        </div>
        <aside className="panel panel-2d">
          <ConicPlot2D analysis={analysis} />
        </aside>
      </main>
    </div>
  );
}
