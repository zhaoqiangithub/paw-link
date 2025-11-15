# Repository Guidelines

## Project Structure & Module Organization
PawLink uses Expo Router; screens live under `app/` (for example `(tabs)/`, `publish.tsx`, `chat.tsx`). Shared UI and logic stay in `components/`, `hooks/`, and `contexts/`, while `constants/` centralizes enums and copy. `lib/` hosts integration layers such as `lib/database.ts` for SQLite and `lib/device.ts` for hardware bridges. Native overrides live in `android/` plus `app.json`, long-form notes in `DEVELOPMENT.md`, experiments in `app-example/`, and brand assets under `assets/`.

## Build, Test, and Development Commands
Use npm scripts: `npm start` launches Metro with Expo dev tools, `npm run android | ios | web` target each platform, `npm run lint` applies the Expo ESLint rules, and `npm run reset-project` clears caches via `scripts/reset-project.js` when location services drift. For broken QR builds, restart with `expo start --clear`.

## Coding Style & Naming Conventions
Code is TypeScript-first; keep files `.tsx` unless the module is hook-only. Prefer functional components, React hooks, and 2-space indentation. Name hooks `useThing`, components in PascalCase, and routes with Expo Router segment syntax (`(tabs)/home.tsx`). Run `npm run lint` before committing and funnel platform checks through helpers in `lib/` or `utils/` instead of sprinkling `Platform.OS` guards.

## Testing Guidelines
Automated tests are not yet wired, so follow the manual steps in `TESTING_GUIDE.md`. Always clear caches (`pkill -9 -f "expo|metro|node"` and `npm run reset-project`) before validating fixes to `useLocation`. Validate Android and iOS builds for permission prompts, then confirm web fallbacks in Chrome or Safari. When logging, mirror the ✅/❌ markers used in the guide so QA can match expectations.

## Commit & Pull Request Guidelines
Git history follows Conventional Commits (`feat:`, `refactor:`, `fix:`). Scope each message to one feature or bug and keep body lines under 100 chars. Every PR should describe the user story, attach emulator screenshots for UI edits, link issues or docs, and state exactly which manual tests were run. Request review only after `npm run lint` and smoke tests pass locally.

## Security & Configuration Tips
Do not hardcode API keys; leave `app.json` `googleMaps.apiKey` empty and load secrets via ignored env files. Review Android permission lists when adding device capabilities and document new ones in `README.md`. Reset Expo caches before exporting builds to avoid leaking stale credentials in `.expo`.
