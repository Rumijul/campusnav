# Knowledge

- 2026-03-24 — In this GSD worktree environment (`.gsd/worktrees/*`) with Node `v25.8.1` + Vite `v7.3.1`, local Vite runtime commands can fail with environment/path-specific errors (`dependency optimization ... reading 'imports'` during `npm run dev:client`, and emitted chunk `fileName` path errors during `npm run build`). For slice execution inside auto-mode worktrees, rely on Vitest verification surfaces for UI logic unless runtime browser UAT is explicitly required in a non-worktree runtime environment.
