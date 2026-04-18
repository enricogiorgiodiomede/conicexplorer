/**
 * Classic textbook-style parabola with axis and directrix hints (decorative).
 */
export function ParabolaDiagram() {
  const w = 320;
  const h = 220;
  const cx = w / 2;
  const bottom = h - 28;
  const a = 0.0042;
  const steps = 48;
  const xMin = 18;
  const xMax = w - 18;

  let d = "";
  for (let i = 0; i <= steps; i++) {
    const x = xMin + ((xMax - xMin) * i) / steps;
    const y = bottom - a * (x - cx) ** 2;
    d += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }

  return (
    <svg
      className="parabola-diagram"
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <defs>
        <linearGradient id="parabolaStroke" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>
      </defs>

      <line
        x1={cx}
        y1={12}
        x2={cx}
        y2={bottom + 6}
        stroke="#475569"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      <line
        x1={10}
        y1={bottom}
        x2={w - 10}
        y2={bottom}
        stroke="#475569"
        strokeWidth={1}
      />

      <path
        d={d}
        fill="none"
        stroke="url(#parabolaStroke)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx={cx} cy={bottom} r={3.5} fill="#f8fafc" />

      <text
        x={cx + 8}
        y={22}
        fill="#94a3b8"
        fontSize={11}
        fontFamily="system-ui, sans-serif"
      >
        symmetry axis
      </text>
      <text
        x={w - 92}
        y={bottom - 6}
        fill="#94a3b8"
        fontSize={11}
        fontFamily="system-ui, sans-serif"
      >
        tangent at vertex
      </text>
    </svg>
  );
}
