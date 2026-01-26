# Lifelines Gaza - Disaster Reporting System

Offline-first mobile app for reporting infrastructure damage (rubble, hazards, blocked roads) in disaster zones. Built for Gaza 2026 with Arabic/English support.

## 🚀 Features

### Mobile App (React Native + Expo)
- ✅ **Offline-first**: Works without internet, syncs when online
- ✅ **Zone detection**: GPS-based zone assignment (Gaza City, Khan Younis, etc.)
- ✅ **Photo capture**: Compressed images (<500KB) stored locally
- ✅ **Categories**: Rubble, hazard, blocked road
- ✅ **Full i18n**: Arabic (RTL) and English
- ✅ **SQLite storage**: All reports saved on-device
- ✅ **Auto-sync**: Reports upload to Supabase when online
- ✅ **Network status**: Visual offline indicator

### Backend (Node.js + Express + Supabase)
- ✅ **REST API**: Simple HTTP endpoints
- ✅ **Supabase PostgreSQL**: Cloud database
- ✅ **Image storage**: Supabase Storage buckets
- ✅ **Real-time sync**: Mobile → Backend → Database

## 📱 Mobile App Setup

### Prerequisites
- Node.js 18+ 
- Expo Go app on your phone (iOS/Android)
- Git

### Installation

```bash
cd rubble-report-mobile
npm install
npx expo start
```

Scan the QR code with Expo Go app to run on your phone.

### Tech Stack
- **Framework**: React Native (Expo SDK 54)
- **UI**: Gluestack UI + NativeWind
- **State**: Zustand
- **Storage**: expo-sqlite
- **i18n**: Custom translation system
- **Network**: @react-native-community/netinfo
- **Camera**: expo-camera + expo-image-manipulator

### File Structure
```
rubble-report-mobile/
├── screens/          # Main screens (Setup, Report, Map)
├── components/       # Reusable RTL-aware components
├── utils/            # Database, i18n, sync manager, zones
├── store/            # Zustand state management
├── locales/          # Arabic/English translations
├── design.ts         # Design system (colors, spacing)
└── App.tsx           # Main navigation
```

## 🔧 Backend Setup

### Prerequisites
- Node.js 18+
- Supabase account (free tier works)

### Installation

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

### Supabase Configuration

1. **Create project** at https://supabase.com
2. **Run SQL schema** (backend/schema.sql) in SQL Editor
3. **Create storage bucket**: 
   - Name: `report-images`
   - Public: Yes
4. **Get credentials** from Project Settings → API:
   - Project URL → `SUPABASE_URL`
   - Anon key → `SUPABASE_ANON_KEY`

### API Endpoints

```
GET  /health                 # Health check
POST /api/reports           # Create report
GET  /api/reports           # List reports (supports ?zone=X&category=Y)
GET  /api/reports/:id       # Get single report
PATCH /api/reports/:id      # Update status
```

## 🌍 Translation System

### Adding New Language

1. Create `locales/XX.json` (e.g., `fr.json`)
2. Copy structure from `locales/en.json`
3. Translate all keys
4. Update `utils/i18n.tsx`:
```typescript
const translations = {
  en: require('../locales/en.json'),
  ar: require('../locales/ar.json'),
  fr: require('../locales/fr.json'), // Add this
};
```

### RTL Support

App automatically switches to RTL layout for Arabic:
- Text aligns right
- UI components mirror (partial - HStack issue with Gluestack)
- Tab bar reverses

## 📊 Database Schema

### Reports Table
```sql
id          UUID PRIMARY KEY
zone        TEXT NOT NULL
category    TEXT (rubble|hazard|blocked_road)
latitude    DECIMAL(10, 8)
longitude   DECIMAL(11, 8)
description TEXT
image_url   TEXT
timestamp   TIMESTAMPTZ
status      TEXT (pending|verified|resolved)
```

## 🔒 Security Notes

**Current setup is for development/hackathon only:**
- Supabase RLS policies allow public read/write
- No authentication required
- API accepts any requests

**For production:**
- Add Supabase Auth
- Implement Row Level Security
- Add API key authentication
- Rate limiting
- Input validation

## 🐛 Known Issues

1. **RTL Layout**: Icons don't flip in Arabic (Gluestack HStack doesn't respect flexDirection override)
2. **Localhost sync**: Mobile app can't reach `localhost` - use computer's local IP (192.168.x.x)
3. **Image size**: Some devices produce >500KB images despite compression

## 📝 Development Workflow

### Making Changes

1. **Mobile**: Edit files → Save → Expo auto-reloads on phone
2. **Backend**: Edit files → nodemon auto-restarts server
3. **Database**: Changes require Supabase dashboard SQL editor

### Testing Sync

1. Turn off WiFi on phone
2. Submit reports (saves locally)
3. Turn WiFi back on
4. Watch console - auto-sync starts
5. Check Supabase dashboard for new reports

## 🚢 Deployment

### Mobile (Production Build)
```bash
cd rubble-report-mobile
eas build --platform android  # or ios
```

### Backend (Railway/Render/Vercel)
```bash
git push origin main  # Auto-deploys on Railway
```

Update mobile app's `syncManager.ts` with production API URL.

## 👥 For Omar (Non-Technical Friend)

See mobile app's README.md for simple setup instructions with screenshots.

## 📄 License

MIT

## 🤝 Contributing

This is a hackathon project. Feel free to fork and improve!

### Priority Improvements
1. Fix RTL HStack layout (replace Gluestack with raw View)
2. Add user authentication
3. NGO dashboard for report management
4. Offline map tiles per zone
5. Push notifications when reports verified

## 📞 Support

Issues? Check console logs:
- Mobile: Shake phone → Show Dev Menu → Debug JS Remotely
- Backend: Check terminal output

---

Built for Lifelines Gaza Hackathon 2026 🇵🇸
