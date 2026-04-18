import { useMemo, useState } from "react";
import { ConePlaneScene } from "./components/ConePlaneScene";
import { ConicDescription } from "./components/ConicDescription";
import { ConicPlot2D } from "./components/ConicPlot2D";
import {
  analyzeConic,
  conicTitle,
  thetaForTargetEccentricity,
} from "./math/conics";

const E_MIN = 0;
/** Matches √(1 + c²) for the 60° cone (see `CONE_SLOPE` in `conics.ts`). */
const E_MAX = 2;

export default function App() {
  const [eccentricity, setEccentricity] = useState(0.45);

  const theta = useMemo(
    () => thetaForTargetEccentricity(eccentricity),
    [eccentricity],
  );
  const analysis = useMemo(() => analyzeConic(theta), [theta]);

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
            Drag eccentricity to tilt the plane against the cone. The 2D panel
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
