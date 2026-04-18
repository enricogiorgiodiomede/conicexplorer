# Conic sections visualizer

Interactive browser app that shows how a **right circular double cone** intersects a **tilted plane** as you change the target **eccentricity** of the section. A large **3D** view shows the cone, plane, and intersection curve; a smaller **2D** panel plots the conic in the plane’s coordinates and labels it (circle, ellipse, parabola, or hyperbola).

**License:** [MIT](LICENSE). **Changelog:** [CHANGELOG.md](CHANGELOG.md).

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended) with **npm**

## Setup

```bash
npm install
```

## Scripts

| Command       | Description                          |
| ------------- | ------------------------------------ |
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Typecheck and production build to `dist/` |
| `npm run preview` | Serve the production build locally |

After `npm run dev`, open the URL shown in the terminal (usually `http://localhost:5173`).

## Usage

- Drag the **eccentricity** slider. The app solves for the plane tilt so the true eccentricity of the intersection matches the slider (within numerical tolerance).
- **Orbit** the 3D view with the mouse: drag to rotate, scroll to zoom, right-drag to pan (depending on platform).

## Project layout

- `src/App.tsx` — layout, slider state, wiring panels
- `src/components/ConePlaneScene.tsx` — React Three Fiber scene (cone, plane, intersection polyline, orbit controls)
- `src/components/ConicPlot2D.tsx` — 2D canvas plot and conic title
- `src/math/conics.ts` — cone–plane model, classification, eccentricity, sampling

## Stack

[Vite](https://vitejs.dev/), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Three.js](https://threejs.org/), [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction), [@react-three/drei](https://github.com/pmndrs/drei).

## GitHub

Remote repository: [github.com/enricogiorgiodiomede/conicexplorer](https://github.com/enricogiorgiodiomede/conicexplorer).

From the project folder, with [Git](https://git-scm.com/) installed and your GitHub account authenticated ([HTTPS](https://docs.github.com/en/get-started/git-basics/about-remote-repositories) or [SSH](https://docs.github.com/en/authentication/connecting-with-ssh)):

```bash
git init
git add .
git commit -m "Initial commit: interactive conic sections visualizer"
git branch -M main
git remote add origin https://github.com/enricogiorgiodiomede/conicexplorer.git
git push -u origin main
```

If `git init` was already run and `origin` exists, use `git remote set-url origin https://github.com/enricogiorgiodiomede/conicexplorer.git` instead of `git remote add`, then `git push -u origin main`.

On Windows, if `npm` fails in PowerShell, use `npm.cmd` (see [execution policy](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies)).
