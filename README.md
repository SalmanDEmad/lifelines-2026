# Lifelines Gaza - Disaster Reporting System

Offline-first mobile app + NGO dashboard for reporting and managing infrastructure damage (rubble, hazards, blocked roads) in disaster zones. Built for Gaza 2026 with Arabic/English support.

## 🚀 Features

### Mobile App (React Native + Expo)
- ✅ **Offline-first**: Works without internet, syncs when online
- ✅ **Zone detection**: GPS-based zone assignment (Gaza City, Khan Younis, etc.)
- ✅ **Photo capture**: Compressed images with safety warnings
- ✅ **Categories**: Rubble (with subcategories), Hazard, Blocked Road
- ✅ **Rubble Types**: UXOs, Chemicals, Human Remains, Recyclable Concrete
- ✅ **Full i18n**: Arabic (RTL) and English
- ✅ **SQLite storage**: All reports saved on-device
- ✅ **Auto-sync**: Reports upload to Supabase when online
- ✅ **6-Step Onboarding**: Language, description, location, map download, sync settings
- ✅ **Offline Maps**: MapLibre with fallback for Expo Go
- ✅ **Push Notifications**: Local notifications for sync status

### NGO Dashboard (React + Vite)
- ✅ **Web-based**: Runs on any browser at `localhost:3002`
- ✅ **Report Management**: View, approve, reject, delete reports
- ✅ **Logistics Tab**: Drag-to-prioritize incident list
- ✅ **Team Management**: Add team members with phone numbers
- ✅ **Team Dispatch**: Send GPS coordinates to field teams (SMS ready)
- ✅ **Interactive Map**: Leaflet-based report visualization
- ✅ **Real-time Data**: Connected to Supabase

### Backend (Supabase)
- ✅ **PostgreSQL Database**: Cloud-hosted with RLS policies
- ✅ **Authentication**: User signup/login with roles (civilian, NGO)
- ✅ **Image Storage**: Supabase Storage buckets
- ✅ **Real-time Sync**: Mobile ↔ Dashboard

## 📱 Mobile App Setup

### Prerequisites
- Node.js 18+ 
- Expo Go app on your phone (iOS/Android)

### Installation

```bash
cd rubble-report-mobile
npm install
npx expo start
```

Scan the QR code with Expo Go app.

### Building APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Build APK (takes ~15 minutes)
eas build --platform android --profile preview
```

### Tech Stack
- **Framework**: React Native (Expo SDK 54)
- **UI**: Gluestack UI + NativeWind
- **State**: Zustand
- **Storage**: expo-sqlite
- **Maps**: MapLibre (requires dev build)
- **Auth**: Supabase Auth
- **i18n**: Custom translation system

### File Structure
```
rubble-report-mobile/
├── screens/          # Onboarding, Report, Map, Login, Signup, Settings
├── components/       # OfflineMap, RTL-aware UI components
├── context/          # AuthContext, RTLContext
├── utils/            # Database, i18n, sync, notifications
├── store/            # Zustand state management
├── locales/          # Arabic/English translations
├── design.ts         # Design system (colors, spacing, icons)
└── App.tsx           # Main navigation with tab bar
```

## 🖥️ NGO Dashboard Setup

### Installation

```bash
cd ngo-dashboard
npm install
npm run dev
```

Open http://localhost:3002

### Demo Login
- **Email**: `ngo@lifelines.app`
- **Password**: `demo1234`

Click "Create Demo Account" button first if it doesn't exist.

### Dashboard Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Overview stats, map with all reports |
| **Reports** | List view, status changes (pending/in-progress/resolved), delete |
| **Logistics** | Drag to prioritize, select team, dispatch with GPS |
| **Teams** | Add/remove field team members with phone numbers |

### Tech Stack
- **Framework**: React 18 + Vite
- **Routing**: react-router-dom
- **Maps**: Leaflet + react-leaflet
- **Icons**: lucide-react
- **Auth**: Supabase Auth

## 🗄️ Database Setup (Supabase)

### 1. Create Project
Go to https://supabase.com and create a new project.

### 2. Run SQL Schema

```sql
-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  description TEXT,
  image_url TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  phone TEXT,
  role TEXT DEFAULT 'civilian',
  push_token TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Get Credentials
From Project Settings → API, update in code:
- `rubble-report-mobile/utils/supabase.ts`
- `ngo-dashboard/src/lib/supabase.js`

## 📊 Categories

### Main Categories
| ID | Label | Color |
|----|-------|-------|
| `rubble` | Rubble | Orange |
| `hazard` | Hazard | Red |
| `blocked_road` | Blocked Road | Blue |

### Rubble Subcategories
| ID | Label | Description |
|----|-------|-------------|
| `uxos` | UXOs | Unexploded ordnance - DANGER |
| `chemicals` | Chemicals | Hazardous materials |
| `human_remains` | Human Remains | Requires special handling |
| `recyclable_concrete` | Recyclable Concrete | Safe for processing |

## 🌍 Translation System

### Supported Languages
- **English** (default)
- **Arabic** (RTL support)

### Adding New Language
1. Create `locales/XX.json`
2. Copy structure from `locales/en.json`
3. Translate all keys
4. Update `utils/i18n.tsx`

## 🔒 Security Notes

**Current setup is for hackathon/demo only.**

For production:
- Implement proper RLS policies
- Add rate limiting
- Secure API endpoints
- Input validation

## 🚢 Deployment

### Mobile App
```bash
eas build --platform android --profile production
```

### NGO Dashboard
```bash
cd ngo-dashboard
npm run build
# Deploy dist/ folder to Vercel/Netlify
```

## 🐛 Known Issues

1. **MapLibre**: Requires dev build, shows fallback in Expo Go
2. **Push Notifications**: Full functionality requires dev build
3. **RTL Icons**: Some icons don't flip in Arabic mode

## 📄 License

MIT

---

Built for Lifelines Gaza Hackathon 2026 🇵🇸
