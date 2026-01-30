# Amal: Analytic and Logistic Software for disaster/hazard/rubble reporting for civilians, NGOs, journalists and academics

A disaster reporting system that actually works offline. Built for Gaza. Works anywhere.

---

## 1. Overview

### 1.1 The Problem

People in conflict zones need to report rubble, hazards, blocked roads. They don't have reliable internet. They don't have time to create accounts. They need something that works when everything else doesn't.

Most disaster apps assume connectivity. Ours assumes the opposite.

### 1.2 What This Is

Two things:

1. **Mobile App** — React Native. Reports go to local SQLite first. Syncs when it can. Works in Arabic with full RTL. No login required.

2. **NGO Dashboard** — React. See all reports on a map. Prioritize. Dispatch teams. Export to CSV/PDF. Analytics by region.

Both talk to Supabase. The mobile app doesn't need a backend server. It syncs directly.

### 1.3 Supported Regions

Eight conflict zones supported out of the box:

| Region | Notes |
|--------|-------|
| Palestine | Gaza Strip boundary-aware — coordinates never fall inside Israel |
| Sudan | — |
| Yemen | — |
| Syria | — |
| Ukraine | — |
| Afghanistan | — |
| Lebanon | — |
| Somalia | — |

Adding more is trivial. Edit `utils/zones.ts`.

---

## 2. Mobile App

### 2.1 Features

- **Offline-first**: SQLite stores everything locally. Reports queue until you have signal.
- **Photo capture**: Compressed to ~500KB. Location randomized within your zone for privacy.
- **Categories**: Rubble, Hazard, Blocked Road. Each has subcategories.
- **Hazard subcategories**: UXO, Structural Risk, Electrical, Chemical/Gas, Contaminated Water, Medical Emergency.
- **Notifications**: Alerts you when sync completes. Warns you when hazards are reported within 2 miles.
- **No login**: Device gets an ID. That's it.

### 2.2 Tech Stack

```
React Native (Expo SDK 54)
Gluestack UI + NativeWind
Zustand for state
expo-sqlite for local storage
MapLibre GL for maps
Supabase for backend
```

### 2.3 Running the App

```bash
cd rubble-report-mobile
npm install
npx expo start
```

Scan the QR with Expo Go.

### 2.4 Building APK

```bash
npm install -g eas-cli
eas build --platform android --profile preview
```

Takes about 15 minutes. You'll get a download link.

---

## 3. NGO Dashboard

### 3.1 Features

- **Map view**: All reports plotted. Filter by region. Clustering for performance.
- **Status management**: Pending → In Progress → Resolved.
- **Logistics**: Drag to reorder priority. Dispatch teams with one click.
- **Teams**: Add field workers with phone numbers. SMS-ready.
- **Analytics**: Charts by category, status, region. Time series. Hazard breakdowns.
- **Export**: CSV and PDF. One click.

### 3.2 Running the Dashboard

```bash
cd ngo-dashboard
npm install
npm run dev
```

Opens at `http://localhost:3002`

Demo login: `ngo@amal.app` / `demo1234`

### 3.3 Tech Stack

```
React 18 + Vite
react-leaflet for maps
Recharts for analytics
Supercluster for marker clustering
jsPDF for exports
Supabase Auth
```

---

## 4. Notifications

### 4.1 Sync Alerts

When your queued reports finally upload, you get a notification. Works in background. Device-specific — won't leak to other phones.

### 4.2 Hazard Proximity Alerts

New hazard reported within 2 miles? You get alerted. Radius is configurable. Intensity-based — UXO gets a 5-mile radius, contaminated water gets 1 mile.

This uses Supabase Realtime. The app subscribes to the `reports` table filtered by `category=hazard`. When a new row appears, it calculates distance and fires a local notification if you're in range.

Works in Expo Go.

---

## 5. Offline Maps

### 5.1 How It Works

Tiles download during onboarding. Cached to device using `expo-file-system`. Four zoom levels per region. ~500 tiles, ~10MB.

The code is in `utils/offlineMapCache.ts`. Downloads happen in batches of 5 to not hammer the tile server.

### 5.2 Current Limitation

The WebView map doesn't read from local cache yet. The tiles are there. Integration is TODO.

---

## 6. Photo Upload

### 6.1 How It Works

Photos go to Supabase Storage. Bucket is `report-photos`. Each report gets a folder. Multiple photos per report supported.

The upload code is in `utils/photoUpload.ts`. Uses base64 encoding because React Native.

### 6.2 Current Limitation

`syncManager.ts` doesn't call the upload function yet. The photo URI is stored locally but not synced. Integration is TODO.

---

## 7. Database

### 7.1 Schema

Supabase PostgreSQL. Three tables:

```sql
reports (id, zone, category, subcategory, latitude, longitude, description, image_url, timestamp, status, user_id)
user_profiles (id, phone, role, push_token)
teams (id, name, phone)
device_tokens (push_token, device_id, region, latitude, longitude, notification_radius_miles)
```

### 7.2 Setup

Run the SQL files in `backend/` to set up:

| File | Purpose |
|------|---------|
| `schema.sql` | Core tables |
| `push-notifications-schema.sql` | Device tokens and hazard queue |
| `storage-setup.sql` | Photo bucket |

---

## 8. File Structure

### 8.1 Mobile App

```
rubble-report-mobile/
├── screens/           # OnboardingScreen, ReportScreen, MapScreen, SettingsScreen
├── components/        # OfflineMap, index.tsx (Gluestack exports)
├── utils/
│   ├── database.ts         # SQLite schema and queries
│   ├── syncManager.ts      # Supabase sync with retry
│   ├── notifications.ts    # Push/local notifications, hazard alerts
│   ├── offlineMapCache.ts  # Tile downloading and caching
│   ├── photoUpload.ts      # Supabase Storage upload
│   ├── realtimeSync.ts     # Supabase Realtime subscriptions
│   ├── zones.ts            # Region definitions with bounds
│   ├── geospatial.ts       # Gaza polygon, point-in-polygon
│   └── i18n.tsx            # Translation system
├── locales/           # en.json, ar.json
├── store/             # Zustand stores
└── App.tsx
```

### 8.2 Dashboard

```
ngo-dashboard/
├── src/
│   ├── pages/
│   │   ├── Dashboard.jsx    # Map, stats, export buttons
│   │   ├── Analytics.jsx    # Charts and graphs
│   │   ├── Reports.jsx      # Report list
│   │   ├── Logistics.jsx    # Drag-to-reorder, dispatch
│   │   ├── Teams.jsx        # Team management
│   │   └── Login.jsx
│   ├── components/          # Sidebar, Header
│   └── lib/
│       ├── supabase.js      # API functions
│       ├── export.js        # CSV/PDF generation
│       └── emoji.js         # Twemoji helpers
└── index.html
```

---

## 9. Feature Status

### 9.1 Implemented Features

| Feature | Implemented | Tested |
|---------|-------------|--------|
| Offline SQLite storage | [x] | [x] |
| Supabase sync with retry | [x] | [x] |
| Photo capture + compression | [x] | [ ] |
| Random coordinates for privacy | [x] | [ ] |
| Gaza boundary polygon check | [x] | [ ] |
| Arabic/English i18n | [x] | [ ] |
| RTL layout | [x] | [ ] |
| Hazard subcategories | [x] | [ ] |
| Local sync notifications | [x] | [ ] |
| Hazard proximity alerts | [x] | [ ] |
| Device token registration | [x] | [ ] |
| Offline tile caching infra | [x] | [ ] |
| Dashboard with map | [x] | [ ] |
| Report status management | [x] | [ ] |
| Drag-to-reorder logistics | [x] | [ ] |
| SMS dispatch modal | [x] | [ ] |
| Team management | [x] | [ ] |
| Analytics page with charts | [x] | [ ] |
| CSV export | [x] | [ ] |
| PDF export | [x] | [ ] |
| Map marker clustering | [x] | [ ] |
| Realtime sync utilities | [x] | [ ] |
| Consensus/voting system | [x] | [x] |
| Vote statistics display | [x] | [x] |
| NGO voting dashboard | [x] | [ ] |
| Rate limiting per IP | [x] | [ ] |

### 9.2 In Progress / Not Yet Implemented

| Feature | Implemented | Tested | Notes |
|---------|-------------|--------|-------|
| Photo sync to Supabase | [ ] | [ ] | Code exists, not wired into syncManager |
| Offline map display | [ ] | [ ] | Tiles cached but WebView doesn't use them |
| Server-side push | [ ] | [ ] | Needs Expo EAS build + Edge Function |
| Full map clustering integration | [ ] | [ ] | Supercluster ready, not rendering clusters |
| Report verification workflow | [ ] | [ ] | Auto-verify based on vote consensus |
| Heatmap visualization | [ ] | [ ] | Would be nice |
| Email alerts for critical hazards | [ ] | [ ] | Would be nice |
| Vote filtering in reports list | [ ] | [ ] | Show only high-confidence reports |
| Weighted voting system | [ ] | [ ] | Verified users get more weight |

---

## 9.3 Voting System API Reference

The consensus/voting system allows users to verify report accuracy through voting.

### Database Schema

```sql
report_votes (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT CHECK (vote_type IN ('accurate', 'inaccurate', 'unclear')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, user_id)
)

report_vote_stats (VIEW)
  - report_id
  - total_votes
  - accurate_votes
  - inaccurate_votes
  - unclear_votes
  - accuracy_percentage
```

### API Functions (NGO Dashboard - `ngo-dashboard/src/lib/supabase.js`)

**`votingApi.getVoteStats(reportId)`**
- Fetches vote statistics for a report
- Returns: `{ reportId, totalVotes, accurateVotes, inaccurateVotes, unclearVotes, accuracyPercentage }`
- No authentication required

**`votingApi.submitVote(reportId, voteType)`**
- Submit or update a vote on a report
- Parameters: `reportId` (string), `voteType` ('accurate'|'inaccurate'|'unclear')
- Returns: vote object with timestamp
- Requires authentication

**`votingApi.deleteVote(reportId)`**
- Remove user's vote from a report
- Requires authentication
- User can only delete their own vote

**`votingApi.getUserVote(reportId)`**
- Get current user's vote on a report (if voted)
- Returns: `{ vote_type, created_at }` or `null`
- Requires authentication

### Mobile App Integration

The mobile app (`rubble-report-mobile/screens/MapScreen.tsx`) includes:
- Vote statistics display in report modal
- Vote submission buttons (✓ Accurate, ✗ Inaccurate, ? Unclear)
- Real-time vote stats synchronization with Supabase
- User's current vote highlighting

### NGO Dashboard Integration

The NGO dashboard (`ngo-dashboard/src/pages/Reports.jsx`) shows:
- Community Consensus section in report modal
- Accuracy percentage bar
- Vote breakdown grid with Twemoji icons (✅❌❓)
- Vote counts per category

### Voting Emojis (Twemoji)

Located in `ngo-dashboard/src/lib/emoji.js`:
```javascript
export const VOTE_EMOJIS = {
  accurate: '✅',      // Green checkmark
  inaccurate: '❌',    // Red X
  unclear: '❓',       // Question mark
};
```

---

## 10. Running Everything

### 10.1 Development Setup

Three terminals:

```bash
# Terminal 1 - Mobile
cd rubble-report-mobile && npx expo start

# Terminal 2 - Dashboard  
cd ngo-dashboard && npm run dev

# Terminal 3 - Backend (optional)
cd backend && npm run dev
```

Mobile syncs directly to Supabase. The backend is only needed if you want custom API logic.

---

## 11. Security

### 11.1 Production Checklist

This is hackathon code. For production:

| Task | Done |
|------|------|
| Enable RLS on all Supabase tables | [ ] |
| Validate inputs server-side | [ ] |
| Rate limit the API | [x] |
| Don't commit credentials | [ ] |
| Set up proper CORS | [ ] |
| Audit auth events | [ ] |

### 11.2 Rate Limiting

Rate limiting is implemented in `backend/index.js` (lines 24-43):

- **Global limiter**: 100 requests per IP per 15 minutes
- **Report limiter**: 10 reports per IP per minute
- **Vote limiter**: 30 votes per IP per minute

To enable in production:
1. `npm install express-rate-limit` in backend directory
2. Uncomment lines 24-43 in `backend/index.js`
3. Uncomment rate limiter middleware applications
4. Restart backend server

---

## 12. License

MIT. Built for Lifelines 2026.
