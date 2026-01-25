# Gaza Disaster Reporting App

Yo Omar, here's how ya gonna get this running on your laptop.

## What you need

- Node.js (LTS version) → https://nodejs.org
- Expo Go app on your phone  
  Android → Google Play  
  iPhone → App Store

## First-time setup

1. Install Git from https://git-scm.com/download/win (just keep clicking Next)

2. Open Command Prompt (search "cmd" in Windows start menu)

3. Navigate to where you want the project (like Desktop):

```bash
cd Desktop
```

4. Clone this project:

```bash
git clone https://github.com/SalmanDEmad/lifelines-2026.git
```

5. Go into the project folder:

```bash
cd lifelines-2026
```

6. Install dependencies:

```bash
npm install
```

Takes a couple minutes the first time.

## Starting the app

1. In the same terminal run:

```bash
npx expo start
```

2. It'll show a QR code
3. Open Expo Go on your phone and scan it  
   - iPhone: use the regular camera app  
   - Android: scan from inside Expo Go

App should appear on your phone after a few seconds.

## Common fixes

- Metro bundler stuck? Press `r` in terminal to reload  
- Phone not connecting? Make sure both are on the same Wi-Fi  
- Still not loading? Press `c` to clear cache, then restart

## What the app does

It's for reporting damage, rubble and hazards in Gaza. You can:

- Submit reports with photos  
- Mark blocked roads or dangerous areas  
- View reports on a map  
- Works offline (syncs when you have connection)  
- Arabic + English support

## Folder overview

- `screens/`       → Report, Map, Settings  
- `locales/`       → en.json and ar.json translations  
- `design.ts`      → colors, spacing, design tokens  
- `App.tsx`        → main app entry + navigation

Hit me up if it throws an error or doesn't work.