# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Interactive **conic section** explorer: right circular cone (60°) cut by a plane, with eccentricity control and target-eccentricity ↔ plane-tilt solving.
- **Plane position** sliders (X / Y) to shift the cut in world space, wired through the same cone–plane analysis as the 3D view and the 2D section plot.
- **3D** view (`@react-three/fiber`, `@react-three/drei`): double cone, translucent cutting plane, intersection polyline, orbit controls.
- **2D** panel: section curve in cutting-plane coordinates \((u, v)\) with conic labeling; parabola mode shows a reference diagram.
- Core **math** module: general plane frame, implicit quadratic intersection, conic classification, UV/world sampling, hyperbola two-branch ordering.

### Fixed

- **Ellipse** rendering: avoid polar-sorting of scan samples (which drew spurious chords); use **parametric** sampling from the centered eigenbasis when possible.
- **Hyperbola** rendering: use the branch split index from the **same** sample as the drawn points (not a fixed low segment count from analysis), removing the chord between arms and related gaps.
- Relaxed hyperbola discriminant handling slightly so near-degenerate samples are less likely to drop out.

## [0.0.0] - 2026-04-18

### Added

- Initial **conicexplorer** scaffold: Vite, React 19, TypeScript, Three.js.
