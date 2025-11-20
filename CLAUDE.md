# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PawLink** is a React Native + Expo mobile application for pet rescue and adoption. The app connects pet owners who have lost pets, people who found stray pets, and potential adopters in a localized, community-based system. The current active branch is `feature/mvp-iteration-1` which contains the completed MVP with 10 core features.

## Project Context

- **Domain**: Pet rescue and adoption platform for the Chinese market
- **Tech Stack**: React Native 0.81.5, Expo ~54.0.23, TypeScript ~5.9.2, SQLite
- **Authentication**: Device-based (no traditional login/signup)
- **Location Services**: GPS + Amap API integration for Chinese addresses
- **Architecture**: Three-layer architecture (Presentation, Business Logic, Data Access)
- **Database**: SQLite with modern async API (NOT legacy Web SQL)

## Commonly Used Commands

### Development Server
```bash
npm start                    # Start Expo development server (default port 8083)
npm run ios                  # Run on iOS simulator
npm run android              # Run on Android emulator
npm run web                  # Run on web browser

# Clear cache when needed
npm run reset-project        # Reset Expo project (clears cache)
expo start --clear          # Clear Metro bundler cache

# Force restart
pkill -9 -f "expo|metro|node"  # Kill all Metro/Expo processes
npm start                   # Restart
```

### Code Quality
```bash
npm run lint                 # Run ESLint with Expo config
```

### Platform-Specific Testing
```bash
# Android
npm run android              # Launch in Android emulator
adb logcat                   # View Android logs

# iOS
npm run ios                  # Launch in iOS simulator
open -a Simulator            # Open iOS Simulator directly

# Web (quick testing)
npm run web                  # Run in Chrome/Safari
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

### OpenSpec Commands (Change Management)
```bash
# List active changes
openspec list

# List specifications
openspec list --specs

# Show change details
openspec show [change-id]

# Validate change (always use --strict)
openspec validate [change-id] --strict

# Archive completed change
openspec archive <change-id> --yes

# Update instruction files
openspec update
```

## OpenSpec Workflow (IMPORTANT)

This project uses **OpenSpec** for spec-driven development. When working on new features or changes:

### When to Create a Proposal

Create a change proposal when:
- Adding new features or functionality
- Making breaking changes (API, schema)
- Changing architecture or patterns
- Optimizing performance (changes behavior)
- Updating security patterns

**DO NOT create proposals for:**
- Bug fixes (restore intended behavior)
- Typos, formatting, comments
- Non-breaking dependency updates
- Configuration changes
- Tests for existing behavior

### Three-Stage Workflow

#### Stage 1: Creating Changes
1. Review `openspec/project.md`, `openspec/list`, and `openspec/list --specs`
2. Choose a unique verb-led `change-id` (kebab-case: `add-feature`, `fix-bug`, etc.)
3. Scaffold files:
   - `openspec/changes/<id>/proposal.md` - Why, what, impact
   - `openspec/changes/<id>/tasks.md` - Implementation checklist
   - `openspec/changes/<id>/design.md` - Technical decisions (optional)
   - `openspec/changes/<id>/specs/<capability>/spec.md` - Delta changes
4. Write spec deltas using `## ADDED|MODIFIED|REMOVED Requirements`
5. Run `openspec validate <id> --strict` and fix issues
6. **Request approval BEFORE implementation**

#### Stage 2: Implementing Changes
1. Read `proposal.md` - Understand what's being built
2. Read `design.md` (if exists) - Review technical decisions
3. Read `tasks.md` - Get implementation checklist
4. Implement tasks sequentially (mark as `[x]` when complete)
5. **Do NOT start until proposal is approved**

#### Stage 3: Archiving Changes
After deployment:
- Move `changes/[name]/` → `changes/archive/YYYY-MM-DD-[name]/`
- Update `specs/` if capabilities changed
- Run `openspec validate --strict`

**More details in `openspec/AGENTS.md`**

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

**Styling**: All components use inline style objects referencing theme colors from `constants/theme.ts`. Color scheme support via React Navigation's `useColorScheme()`.

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
│   │   ├── profile.tsx           # User profile
│   │   └── _layout.tsx           # Tab layout
│   ├── publish.tsx               # Publish pet info
│   ├── chat.tsx                  # Messaging
│   ├── pet-detail.tsx            # Pet detail page
│   ├── select-location.tsx       # Location selection
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
├── constants/
│   └── theme.ts                  # UI theme
└── openspec/                     # OpenSpec change management
    ├── AGENTS.md                 # OpenSpec instructions
    ├── project.md                # Project conventions
    ├── specs/                    # Current specifications
    └── changes/                  # Proposed changes
        ├── active/               # Active changes
        └── archive/              # Completed changes
```

## Key Implementation Details

### Database Initialization
The database is initialized asynchronously in `AppContext.tsx`. All database operations use the modern async/await pattern. See `lib/database.ts:54-83`.

### Location Services
Uses `expo-location` for GPS. See `hooks/use-location.ts`.

### Image Handling
Uses `expo-image-picker` for camera/gallery access. See `hooks/use-image-picker.ts`.

### Maps Integration
The app uses a hybrid approach:
- `react-native-maps` for native map rendering (system default maps)
- `Amap API` for reverse geocoding Chinese addresses
- Handles WGS84 (GPS) to GCJ02 (China) coordinate conversion
- See `components/NativeMapView.tsx` and `config/amap-api-keys.ts`

## Important Files to Know

- `lib/database.ts` - Complete database layer (CRUD operations for all tables)
- `components/NativeMapView.tsx` - Hybrid map component (react-native-maps + Amap API for reverse geocoding)
- `app/_layout.tsx` - Root layout with providers and initialization
- `contexts/AppContext.tsx` - Global app state, user initialization, database setup
- `app/publish.tsx` - Pet information publishing page
- `app/(tabs)/index.tsx` - Home page with map view
- `config/amap-api-keys.ts` - Amap API configuration for reverse geocoding
- `hooks/use-location.ts` - Location services hook
- `openspec/AGENTS.md` - Complete OpenSpec workflow instructions

## Common Issues & Solutions

**SQLite API errors**: Ensure using async API (`openDatabaseAsync`, `prepareAsync`, `executeAsync`) NOT the legacy synchronous API.

**Transaction errors**: Use prepared statements with `prepareAsync()` + `executeAsync()` instead of `db.transaction()`.

**Location getting stuck**: If the app shows "正在获取您的位置" indefinitely, this indicates a location request that's waiting for user interaction. The new `NativeMapView.tsx` implements automatic retry (up to 3 times) to prevent this issue.

**Location permissions**: Ensure proper permission handling in `app.json`:
- iOS: Configure `NSLocationWhenInUseUsageDescription` and `NSLocationAlwaysAndWhenInUseUsageDescription`
- Android: Requires `ACCESS_COARSE_LOCATION` and `ACCESS_FINE_LOCATION` permissions

**Distance calculations**: Implemented in JavaScript (Haversine formula) due to SQLite SQL function limitations.

**Amap API failures**: If reverse geocoding fails, the app will still function with coordinates only. Check `config/amap-api-keys.ts` for valid API key configuration.

**Metro bundler issues**: Clear cache with `expo start --clear` or `npm run reset-project`

**Android build failures**: Check `android/app/build.gradle` and ensure all permissions are declared in `app.json`

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
- `expo-secure-store` ^15.0.7 (device-based authentication)

## Environment

- Node.js >= 18.x required
- iOS Simulator or Android Studio (optional for native testing)
- Web testing available via `npm run web`

## Documentation

- `README.md` - Project overview and quick start (Chinese)
- `BRANCH_STRATEGY.md` - Git workflow and branch management
- `PROJECT_SUMMARY.md` - Location system fix summary
- `openspec/AGENTS.md` - Complete OpenSpec workflow
- `openspec/project.md` - Project conventions and context

## Testing Strategy

### Manual Testing
Since no automated testing framework is set up yet:
1. Use `npm run web` for quick iterations
2. Test on iOS Simulator: `npm run ios`
3. Test on Android Emulator: `npm run android`
4. Clear caches before testing location fixes: `npm run reset-project`

### Location Testing Checklist
- [ ] Location permissions requested correctly
- [ ] GPS coordinates obtained accurately
- [ ] Chinese address display via Amap API
- [ ] Retry mechanism works (3 attempts)
- [ ] Error handling for timeout/denied permissions
- [ ] Manual location selection as fallback

## Coding Style & Conventions

- **TypeScript-first**: All files should be `.ts` or `.tsx`
- **Functional components**: Use React hooks, not class components
- **2-space indentation**
- **Hooks naming**: `useThing` convention
- **Components**: PascalCase naming
- **Routes**: Expo Router segment syntax (`(tabs)/home.tsx`)
- **Inline styles**: Use style objects, reference theme from `constants/theme.ts`
- **Conventional commits**: `feat:`, `fix:`, `refactor:`, `docs:`, `style:`

## Security Considerations

- **API Keys**: Never hardcode API keys; use `config/amap-api-keys.ts` with environment variables
- **Device ID**: Stored securely using `expo-secure-store`
- **Permissions**: Review Android permissions in `app.json` before adding new capabilities
- **Location Data**: Handle responsibly; only request when needed

## Performance Tips

- Use `react-native-maps` for map rendering (native performance)
- Implement image lazy loading for pet photos
- Cache frequently accessed data in AsyncStorage
- Use `React.memo()` for expensive components
- Optimize SQLite queries with prepared statements

## Git Commit Message Format

```
<type>: <description>

[optional detailed explanation]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [Amap API Documentation](https://lbs.amap.com/api)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)

## Troubleshooting

### Development Issues
1. **Metro bundler errors**: `expo start --clear`
2. **iOS build fails**: `cd ios && pod install`
3. **Android build fails**: `cd android && ./gradlew clean`
4. **TypeScript errors**: Check `tsconfig.json` and restart TypeScript server
5. **Location not working**: Verify permissions in `app.json` and test on physical device

### OpenSpec Issues
1. **Validation fails**: Run `openspec validate [change] --strict` for detailed errors
2. **Missing scenarios**: Ensure requirements use `#### Scenario:` format (4 hashtags)
3. **Change conflicts**: Run `openspec list` to see active changes
