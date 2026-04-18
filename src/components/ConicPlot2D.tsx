import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ConicAnalysis } from "../math/conics";
import { conicTitle, sampleConicUV } from "../math/conics";
import { ParabolaDiagram } from "./ParabolaDiagram";

type Props = {
  analysis: ConicAnalysis;
};

function ParabolaPlotPanel() {
  return (
    <div
      className="conic-plot parabola-plot-wrap"
      aria-label="Parabola reference diagram and section name"
    >
      <div className="parabola-plot-title">{conicTitle("parabola")}</div>
      <div className="parabola-plot-svg">
        <ParabolaDiagram />
      </div>
      <p className="parabola-plot-caption">
        Canonical parabola (eccentricity 1). The 3D view shows the true cut in
        the tilted plane.
      </p>
    </div>
  );
}

function ConicCanvasPlot({ analysis }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [tick, setTick] = useState(0);

  const sampled = useMemo(
    () => sampleConicUV(analysis, analysis.kind === "hyperbola" ? 120 : 180),
    [analysis],
  );
  const uv = sampled.uv;

  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => setTick((t) => t + 1));
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, cssW, cssH);

    if (uv.length < 2) return;

    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;
    for (const [u, v] of uv) {
      minU = Math.min(minU, u);
      maxU = Math.max(maxU, u);
      minV = Math.min(minV, v);
      maxV = Math.max(maxV, v);
    }
    const pad = 0.35;
    const du = Math.max(maxU - minU, 0.4) + pad * 2;
    const dv = Math.max(maxV - minV, 0.4) + pad * 2;
    const cx = 0.5 * (minU + maxU);
    const cy = 0.5 * (minV + maxV);

    const scale = 0.9 * Math.min(cssW / du, cssH / dv);
    const ox = cssW / 2;
    const oy = cssH / 2;

    const toX = (u: number) => ox + (u - cx) * scale;
    const toY = (v: number) => oy - (v - cy) * scale;

    ctx.strokeStyle = "#7dd3fc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const strokeOpen = () => {
      const [u0, v0] = uv[0]!;
      ctx.moveTo(toX(u0), toY(v0));
      for (let i = 1; i < uv.length; i++) {
        const [u, v] = uv[i]!;
        ctx.lineTo(toX(u), toY(v));
      }
    };

    if (analysis.kind === "hyperbola") {
      const split = sampled.hyperbolaSplit ?? Math.floor(uv.length / 2);
      const a = uv.slice(0, split);
      const b = uv.slice(split);
      if (a.length) {
        ctx.moveTo(toX(a[0]![0]), toY(a[0]![1]));
        for (let i = 1; i < a.length; i++) {
          ctx.lineTo(toX(a[i]![0]), toY(a[i]![1]));
        }
      }
      if (b.length) {
        ctx.moveTo(toX(b[0]![0]), toY(b[0]![1]));
        for (let i = 1; i < b.length; i++) {
          ctx.lineTo(toX(b[i]![0]), toY(b[i]![1]));
        }
      }
    } else {
      strokeOpen();
      if (analysis.kind === "ellipse" || analysis.kind === "circle") {
        ctx.closePath();
      }
    }
    ctx.stroke();

    ctx.fillStyle = "#f8fafc";
    ctx.font = "600 18px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(conicTitle(analysis.kind), cssW / 2, 26);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText("Section in the cutting plane (u, v)", cssW / 2, cssH - 12);
  }, [analysis, sampled, uv, tick]);

  return (
    <canvas
      ref={ref}
      className="conic-plot"
      width={480}
      height={280}
      aria-label="Two-dimensional view of the conic section"
    />
  );
}

export function ConicPlot2D({ analysis }: Props) {
  if (analysis.kind === "parabola") {
    return <ParabolaPlotPanel />;
  }
  return <ConicCanvasPlot analysis={analysis} />;
}
