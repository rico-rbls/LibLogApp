# Directive: Desktop Phase 9 - Monorepo Architecture

## Objective
Establish and enforce a strict Monorepo architecture using NPM Workspaces. The system is divided into isolated applications (`apps/desktop`, `apps/mobile`) and shared logic (`packages/shared`).

## Context & Architecture
* **Root:** `/` (Contains directives, execution scripts, and workspace config).
* **Desktop App:** `/apps/desktop/` (Vite + React + TypeScript + Tailwind).
* **Mobile App:** `/apps/mobile/` (Expo - Currently paused).

## Execution Rules for AI (Self-Annealing)
1. **Context Awareness:** Whenever instructed to build, modify, or debug a component for the Librarian Dashboard, you MUST operate exclusively within the `/apps/desktop/` directory.
2. **Terminal Commands:** When running installations, specify the workspace (e.g., `npm install lucide-react -w apps/desktop`).
3. **No Bleeding:** Do not attempt to wire up the mobile app until explicitly commanded by the Lead Programmer.