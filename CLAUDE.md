<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PawLink** is a React Native + Expo mobile application for pet rescue and adoption. The current active branch is `feature/mvp-iteration-1` which contains the completed MVP with 10 core features.

## Commonly Used Commands

### Development Server
```bash
npm start                    # Start Expo development server (default port 8083)
npm run ios                  # Run on iOS simulator
npm run android              # Run on Android emulator
npm run web                  # Run on web browser
```

### Code Quality
```bash
npm run lint                 # Run ESLint
npm run reset-project        # Reset Expo project (clears cache)
```

### Git Workflow
```bash
# Current active branch
git checkout feature/mvp-iteration-1

# When ready to merge to main
git checkout main
git merge feature/mvp-iteration-1
git push origin main

# Start new iteration
git checkout -b feature/mvp-iteration-2
```

## Code Architecture

### Three-Layer Architecture

The codebase follows a clean three-layer architecture:

1. **Presentation Layer** (UI)
   - `app/` - Expo Router pages and layouts
   - `components/` - Reusable UI components

2. **Business Logic Layer**
   - `hooks/` - Custom React hooks (location, image picker)
   - `contexts/` - React Context providers (AppContext, MessageContext)

3. **Data Access Layer**
   - `lib/database.ts` - SQLite database operations (modern async API)
   - `lib/device.ts` - Device ID management

### Key Technical Decisions

**Database**: Uses SQLite with modern async API (`openDatabaseAsync`, `prepareAsync`, `executeAsync`) - NOT the legacy Web SQL API. See `lib/database.ts:71`.

**User System**: Simplified device-based authentication using `expo-secure-store` for device ID. No traditional login/signup - see `lib/device.ts`.

**Location Permissions**: Configured in `app.json`:
- iOS: Uses `infoPlist` with `NSLocationWhenInUseUsageDescription` and `NSLocationAlwaysAndWhenInUseUsageDescription` for Chinese user-friendly permission prompts
- Android: Requires `ACCESS_COARSE_LOCATION` and `ACCESS_FINE_LOCATION` permissions

**Maps**: Hybrid approach using `react-native-maps` for native map rendering (system default maps) with `Amap API` for reverse geocoding. See `components/NativeMapView.tsx`. This provides better performance while maintaining accurate Chinese address support.

**Distance Calculation**: Implemented in JavaScript frontend (Haversine formula) rather than SQL - see `lib/database.ts:406`.

### Database Schema

The SQLite database has 4 main tables:
- `users` - User information (device-based)
- `pet_infos` - Pet rescue/adoption information
- `messages` - Private messages between users
- `reports` - Content reports

See `lib/database.ts:86-156` for complete table definitions.

## Project Structure

```
pawlink/
├── app/                          # Expo Router pages
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx             # Home (map view)
│   │   ├── explore.tsx           # Search/browse
│   │   └── _layout.tsx           # Tab layout
│   ├── publish.tsx               # Publish pet info
│   ├── chat.tsx                  # Messaging
│   └── _layout.tsx               # Root layout
├── components/                   # Reusable components
│   ├── MapView.tsx               # Map container (uses NativeMapView)
│   ├── NativeMapView.tsx         # Hybrid map component (react-native-maps + Amap API)
│   ├── SearchFilters.tsx         # Search filters
│   ├── PetInfoCard.tsx           # Pet info card
│   ├── ContactActions.tsx        # Contact options
│   └── ReportModal.tsx           # Reporting
├── hooks/                        # Custom hooks
│   ├── use-location.ts           # Location services
│   └── use-image-picker.ts       # Image selection
├── lib/                          # Core libraries
│   ├── database.ts               # SQLite operations
│   └── device.ts                 # Device ID
├── contexts/                     # State management
│   ├── AppContext.tsx            # Global state
│   └── MessageContext.tsx        # Message state
├── config/                       # Configuration
│   └── amap-api-keys.ts          # Amap API keys for reverse geocoding
└── constants/
    └── theme.ts                  # UI theme
```

## Key Implementation Details

### Database Initialization
The database is initialized asynchronously in `AppContext.tsx`. All database operations use the modern async/await pattern. See `lib/database.ts:54-83`.

### Location Services
Uses `expo-location` for GPS. See `hooks/use-location.ts`.

### Image Handling
Uses `expo-image-picker` for camera/gallery access. See `hooks/use-image-picker.ts`.

### Styling
All components use inline style objects referencing theme colors from `constants/theme.ts`. Color scheme support via React Navigation's `useColorScheme()`.

## Important Files to Know

- `lib/database.ts` - Complete database layer (CRUD operations for all tables)
- `components/NativeMapView.tsx` - Hybrid map component (react-native-maps + Amap API for reverse geocoding)
- `app/_layout.tsx` - Root layout with providers and initialization
- `contexts/AppContext.tsx` - Global app state, user initialization, database setup
- `app/publish.tsx` - Pet information publishing page
- `app/(tabs)/index.tsx` - Home page with map view
- `config/amap-api-keys.ts` - Amap API configuration for reverse geocoding

## Common Issues & Solutions

**SQLite API errors**: Ensure using async API (`openDatabaseAsync`, `prepareAsync`, `executeAsync`) NOT the legacy synchronous API.

**Transaction errors**: Use prepared statements with `prepareAsync()` + `executeAsync()` instead of `db.transaction()`.

**Location getting stuck**: If the app shows "正在获取您的位置" indefinitely, this indicates a location request that's waiting for user interaction. The new `NativeMapView.tsx` implements automatic retry (up to 3 times) to prevent this issue.

**Location permissions**: Ensure proper permission handling in `app.json`:
- iOS: Configure `NSLocationWhenInUseUsageDescription` and `NSLocationAlwaysAndWhenInUseUsageDescription`
- Android: Requires `ACCESS_COARSE_LOCATION` and `ACCESS_FINE_LOCATION` permissions

**Distance calculations**: Implemented in JavaScript (Haversine formula) due to SQLite SQL function limitations.

**Amap API failures**: If reverse geocoding fails, the app will still function with coordinates only. Check `config/amap-api-keys.ts` for valid API key configuration.

## Current Branch Status

**Active branch**: `feature/mvp-iteration-1` (completed MVP)
- All 10 core features implemented
- Development server runs on port 8083
- Ready for testing and merge to main

**Next iteration**: `feature/mvp-iteration-2` (planned)
- Pet detail pages
- User profile center
- Push notifications
- Payment/crowdfunding
- AI image recognition

## Documentation

- `README.md` - Project overview and quick start
- `DEVELOPMENT.md` - Detailed technical documentation (architecture, database schema, known issues)
- `BRANCH_STRATEGY.md` - Git workflow and branch management
- `NATIVE_MAP_IMPLEMENTATION.md` - Comprehensive guide to the hybrid map implementation (react-native-maps + Amap API)
- `QUICK_START_GUIDE.md` - Quick testing guide for the new map implementation
- `MAP_FEATURES.md` - Legacy documentation of AmapWebView implementation (for reference)

## Dependencies

Key packages:
- `expo` ~54.0.23
- `react-native` 0.81.5
- `expo-router` ~6.0.14
- `expo-sqlite` ^16.0.9
- `expo-location` ^19.0.7
- `expo-image-picker` ^17.0.8
- `react-native-maps` ^1.20.1 (hybrid map implementation with system default maps)
- `typescript` ~5.9.2

## Environment

- Node.js >= 18.x required
- iOS Simulator or Android Studio (optional for native testing)
- Web testing available via `npm run web`
