# Project Context

## Purpose
PawLink is a React Native + Expo mobile application for pet rescue and adoption. The app helps connect pet owners who have lost their pets, people who have found stray pets, and potential adopters in a localized community-based system. Currently on feature/mvp-iteration-1 with 10 core features implemented.

## Tech Stack
- **Framework**: React Native 0.81.5 with Expo ~54.0.23
- **Routing**: Expo Router ~6.0.14
- **Database**: SQLite with modern async API (expo-sqlite ^16.0.9)
- **Location Services**: expo-location ^19.0.7
- **Maps**: Hybrid implementation using react-native-maps ^1.20.1 + Amap API for reverse geocoding
- **Image Handling**: expo-image-picker ^17.0.8
- **Authentication**: Device-based using expo-secure-store (no traditional login/signup)
- **Language**: TypeScript ~5.9.2

## Project Conventions

### Code Style
- Inline style objects referencing theme colors from `constants/theme.ts`
- Three-layer architecture: Presentation Layer (UI), Business Logic Layer (hooks/contexts), Data Access Layer (database.ts, device.ts)
- Color scheme support via React Navigation's `useColorScheme()`
- Modern async/await pattern for all database operations

### Architecture Patterns
- **Three-Layer Architecture**:
  1. Presentation Layer: `app/` (Expo Router pages), `components/`
  2. Business Logic Layer: `hooks/`, `contexts/`
  3. Data Access Layer: `lib/database.ts`, `lib/device.ts`
- SQLite database with modern async API: `openDatabaseAsync`, `prepareAsync`, `executeAsync` (NOT legacy Web SQL)
- Device-based authentication system (no user accounts/login)
- Hybrid map implementation (react-native-maps + Amap API for Chinese addresses)

### Testing Strategy
- Web testing via `npm run web` for quick iterations
- Native testing with iOS Simulator or Android Studio
- No explicit testing framework documented yet for iteration-1

### Git Workflow
- Active branch: `feature/mvp-iteration-1`
- When ready to merge: checkout main → merge feature/mvp-iteration-1 → push
- Next iteration: checkout -b feature/mvp-iteration-2
- Branch strategy documented in BRANCH_STRATEGY.md

## Domain Context
- **Pet Rescue/Adoption System**: Connects three user types: people who lost pets, people who found pets, potential adopters
- **Location-Based**: Uses GPS for proximity matching
- **Chinese Market**: Tailored for Chinese users with Amap API integration for reverse geocoding
- **Device-Based**: No user registration - uses device ID for identification
- **Community-Focused**: Localized matching within proximity using Haversine distance calculation

## Important Constraints
- Must use modern async SQLite API (NOT legacy synchronous API)
- Location permissions required for core functionality
- Amap API required for accurate Chinese address resolution
- React Native Maps provides system default maps (no Google Maps)
- SQLite lacks advanced SQL functions, so Haversine distance calculation implemented in JavaScript frontend
- No traditional user authentication system (device-based only)

## External Dependencies
- **expo-secure-store**: Device ID storage for authentication
- **expo-location**: GPS location services
- **Amap API**: Chinese maps and reverse geocoding (see `config/amap-api-keys.ts`)
- **react-native-maps**: Native map rendering
- **SQLite Database**: Local data storage with 4 main tables (users, pet_infos, messages, reports)
