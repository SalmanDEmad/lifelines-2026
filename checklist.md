# Lifelines - Implementation Status

## ✅ IMPLEMENTED - Civilian App

| Feature | Status | Notes |
|---------|--------|-------|
| Report rubble with low-res photo | ✅ | Camera integration with compression |
| GPS coordinates capture | ✅ | Location captured with report |
| Category selection (non-language icons) | ✅ | Rubble, Hazard, Blocked Road with icons |
| Local storage until connection | ✅ | SQLite + offline-first sync |
| Zone detection on setup | ✅ | GPS-based zone detection |
| Report submission flow | ✅ | Full create/submit flow |
| Reports list (History tab) | ✅ | With sync status |
| Sync when online | ✅ | Auto-sync with debounce |
| Settings/Setup screen | ✅ | Zone, stats, logout |
| Bilingual (Arabic/English) | ✅ | RTL support |
| User authentication | ✅ | Supabase auth, citizen/NGO roles |
| Push notifications (local) | ✅ | For sync status |
| Map view toggle | ✅ | List/Map toggle (fallback for Expo Go) |

## 🔄 PARTIALLY IMPLEMENTED

| Feature | Status | Notes |
|---------|--------|-------|
| Offline maps | 🔄 | MapLibre installed, fallback view in Expo Go, needs dev build + tile caching |
| Push notifications | 🔄 | Local works, remote needs EAS build |
| Role-based filtering | 🔄 | NGOs see all reports, citizens see own |

---

## 📋 DAY 3 TODO (Feasible Today)

| Feature | Time | Priority |
|---------|------|----------|
| ? category (unknown/unclassified) | 15 min | High |
| Show rubble points from server on map | 45 min | High |
| Click marker → show GPS, hazard, image | 30 min | High |
| Status changes (pending→in-progress→resolved) | 45 min | High |
| "Me" pin on map (persistent) | 15 min | Medium |
| Sync with "download photos" checkbox | 30 min | Medium |
| Refresh map with/without images | 45 min | Medium |
| Moderate/delete reports (NGO) | 45 min | High |
| **Basic NGO web dashboard** | 2 hrs | High |

**Total: ~6-7 hours**

## ⚠️ STRETCH GOALS (If Time Permits)

| Feature | Time |
|---------|------|
| Teams tab (name, phone) | 45 min |
| Full onboarding flow | 1.5 hrs |

## ❌ NOT FEASIBLE TODAY

| Feature | Why |
|---------|-----|
| Offline map tile caching per zone | Infrastructure complexity - needs tile server, storage management |
| Download additional zones in settings | Requires tile caching first |
| Basic low-res map of whole Gaza | Requires tile caching infrastructure |
| Full logistics tab with drag-to-prioritize | Complex UI + real-time sync |
| Send SMS to team with GPS | Needs Twilio/SMS integration, costs $ |

---

## Tech Stack

### Mobile App (Civilian)
- React Native + Expo SDK 54
- Gluestack UI
- Zustand (state management)
- SQLite (local storage)
- Supabase (auth + remote DB)
- MapLibre (offline maps - needs dev build)
- expo-notifications (push notifications)

### Backend
- Express.js
- Supabase PostgreSQL
- JWT authentication

### NGO Dashboard (To Be Built Today)
- React + Vite
- Leaflet for maps
- Supabase for data
