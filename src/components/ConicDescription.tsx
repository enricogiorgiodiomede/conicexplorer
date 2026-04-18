import type { ConicAnalysis } from "../math/conics";

type Props = {
  analysis: ConicAnalysis;
};

/**
 * Educational blurb keyed by `analysis.kind` (already derived from eccentricity
 * and the cone–plane model: circle, ellipse 0<e<1, parabola e≈1, hyperbola e>1).
 */
export function ConicDescription({ analysis }: Props) {
  const { kind } = analysis;

  return (
    <section
      className="conic-desc"
      aria-label={`About the ${kind}`}
      aria-live="polite"
    >
      {kind === "circle" && (
        <>
          <h2 className="conic-desc-title">Circle (e = 0)</h2>
          <p className="conic-desc-lead">
            The set of points at a fixed distance from a center — a special ellipse
            with equal semi-axes.
          </p>
          <p className="conic-eq">x² + y² = r²</p>
          <p className="conic-desc-keys">Key elements:</p>
          <ul>
            <li>Center and radius r</li>
            <li>Eccentricity e = 0 (degenerate focus pair at the center)</li>
          </ul>
        </>
      )}

      {kind === "ellipse" && (
        <>
          <h2 className="conic-desc-title">Ellipse (0 &lt; e &lt; 1)</h2>
          <p className="conic-desc-lead">
            A closed curve: the sum of the distances from any point on the curve to
            two fixed foci is constant.
          </p>
          <p className="conic-eq">x²/a² + y²/b² = 1 &nbsp;(a &gt; b &gt; 0)</p>
          <p className="conic-desc-keys">Key elements:</p>
          <ul>
            <li>Semi-major axis a, semi-minor axis b</li>
            <li>
              Eccentricity e = √(1 − b²/a²); focal distance c = ae from center
            </li>
            <li>Two foci on the major axis; pair of directrices</li>
          </ul>
        </>
      )}

      {kind === "parabola" && (
        <>
          <h2 className="conic-desc-title">Parabola (e = 1)</h2>
          <p className="conic-desc-lead">
            The graph of a quadratic in x (a ≠ 0); equivalently, the set of points
            equidistant from a fixed focus and a fixed directrix line.
          </p>
          <p className="conic-eq">y = ax² + bx + c, &nbsp;a ≠ 0</p>
          <p className="conic-desc-keys">Key elements:</p>
          <ul>
            <li>
              Vertical axis of symmetry x = −b/(2a); vertex at (−b/(2a), c −
              b²/(4a))
            </li>
            <li>Opens upward if a &gt; 0, downward if a &lt; 0</li>
            <li>Eccentricity e = 1 for conic sections; one focus and one directrix</li>
          </ul>
        </>
      )}

      {kind === "hyperbola" && (
        <>
          <h2 className="conic-desc-title">Hyperbola (e &gt; 1)</h2>
          <p className="conic-desc-lead">
            Two open branches: the absolute difference of distances from any
            point on a branch to two fixed foci is constant.
          </p>
          <p className="conic-eq">x²/a² − y²/b² = 1</p>
          <p className="conic-desc-keys">Key elements:</p>
          <ul>
            <li>Transverse semi-axis a, conjugate semi-axis b</li>
            <li>
              Eccentricity e = √(1 + b²/a²); foci at (±ae, 0) for this orientation
            </li>
            <li>Asymptotes y = ±(b/a)x; two branches and two directrices</li>
          </ul>
        </>
      )}
    </section>
  );
}
