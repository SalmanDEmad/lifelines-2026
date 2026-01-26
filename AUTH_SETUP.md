# Authentication Setup Guide

## Current Status

### ✅ What's Already Configured

1. **Mobile App (React Native + Supabase)**
   - Supabase client configured in `utils/supabase.ts`
   - AuthContext with signUp/signIn/signOut functions
   - Login and Signup screens with language toggle
   - Session persistence using AsyncStorage
   - Auto-refresh tokens enabled

2. **Backend (Express + Supabase)**
   - Auth middleware to verify JWT tokens
   - User role checks before operations
   - Reports include user_id on creation

3. **Database Schema**
   - SQL file ready: `backend/auth-schema.sql`
   - Defines user_profiles table with RLS policies
   - Updates reports table with user_id foreign key

---

## ⚠️ Required Setup Steps

### Step 1: Run Database Schema in Supabase

**IMPORTANT: You MUST run the SQL file in Supabase SQL Editor first!**

1. Go to https://supabase.com/dashboard/project/niwiwfngnejwqlulcuin
2. Click "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy and paste the contents of `backend/auth-schema.sql`
5. Click "Run" or press Ctrl+Enter
6. Verify success message appears

**What this creates:**
- `user_profiles` table to store user data (id, email, name, role, zone)
- RLS policies so users can only access their own data
- Updates `reports` table to link reports to users
- Policies so citizens see only their reports, NGOs see all

---

### Step 2: Configure Supabase Email Settings

**For Expo Go (Development):**

Supabase sends email verification by default, but with Expo Go you need to:

#### Option A: Disable Email Confirmation (Development Only)
1. Go to Supabase Dashboard → Authentication → Settings
2. Under "Email Auth" section
3. **DISABLE** "Confirm email"
4. Click Save

This allows immediate login without email verification - ONLY for development!

#### Option B: Use Email Verification (Production-ready)
1. Keep "Confirm email" enabled
2. Configure custom SMTP (optional) or use Supabase's default
3. Users must click confirmation link in email before first login
4. **Problem with Expo Go:** Deep links don't work properly
5. **Solution:** Use custom development build or wait for email confirmation

**Recommended for your hackathon:** Use Option A (disable email confirmation) for now.

---

### Step 3: Test the Flow

1. **Start Backend:**
   ```bash
   cd backend
   node index.js
   ```

2. **Start Mobile App:**
   ```bash
   cd rubble-report-mobile
   npx expo start
   ```

3. **Test Signup:**
   - Open app in Expo Go
   - Tap "Sign Up"
   - Fill in: name, email, password, select role (citizen/ngo)
   - Submit
   - If email confirmation disabled → logged in immediately
   - If email confirmation enabled → check email for link

4. **Test Login:**
   - After signup, logout (add button in SettingsScreen if needed)
   - Enter same email/password
   - Should login and see main app

5. **Test Report Creation:**
   - Create a report with photo
   - Check if user_id is saved
   - For NGO: should see all reports
   - For citizen: should see only own reports

---

## How Email Verification Works with Expo Go

### The Challenge:
- Supabase sends email with confirmation link: `https://niwiwfngnejwqlulcuin.supabase.co/auth/v1/verify?token=xxx&type=signup`
- This link needs to deep link back to your app
- Expo Go doesn't support custom URL schemes properly
- User clicks link → opens in browser → can't redirect back to app

### Solutions:

#### Option 1: Disable Email Confirmation (Quick Fix)
```
Dashboard → Authentication → Settings → Email Auth → Confirm email: OFF
```
- Users can login immediately after signup
- No email verification required
- **Use for development/hackathon only**

#### Option 2: Custom Development Build (Proper Fix)
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure development build
cd rubble-report-mobile
eas build:configure

# Create development build
eas build --profile development --platform android
```
- Supports custom URL schemes
- Email links deep link back to app
- Takes ~20 minutes to build

#### Option 3: Email Confirmation Without Deep Links
- Keep email confirmation enabled
- User signs up → receives email
- User clicks link in email (opens browser)
- Link confirms account (shows success page)
- User manually returns to app and logs in
- **Works but poor UX**

---

## Current Configuration

**Supabase Project:**
- URL: `https://niwiwfngnejwqlulcuin.supabase.co`
- Anon Key: `sb_publishable_2Tbbi5zeRDl02pz0mOCeXg_U9CynWGz`

**Auth Flow:**
1. User signs up → Supabase creates auth.users entry
2. App creates user_profiles entry with role
3. Supabase returns session with JWT token
4. Token stored in AsyncStorage (persists across app restarts)
5. All API requests include `Authorization: Bearer <token>`
6. Backend verifies token and checks user role

**Session Management:**
- Auto-refresh: Tokens refresh automatically before expiry
- Persistence: Session survives app restarts
- Storage: AsyncStorage (encrypted on device)

---

## Quick Start (Recommended)

1. **Disable email confirmation in Supabase:**
   - Dashboard → Authentication → Settings → Email Auth → Confirm email: OFF

2. **Run SQL schema:**
   - Copy `backend/auth-schema.sql` → Supabase SQL Editor → Run

3. **Test signup:**
   - Open app → Sign Up → Fill form → Submit
   - Should login immediately without email verification

4. **Test report filtering:**
   - Sign up as citizen → create report → see only your report
   - Sign up as NGO → see all reports (if any exist)

---

## Troubleshooting

### "Error: relation 'user_profiles' does not exist"
→ You haven't run the SQL schema. Go to Supabase SQL Editor and run `auth-schema.sql`

### "User already registered" 
→ Email already exists. Use different email or check Supabase Dashboard → Authentication → Users

### "Invalid login credentials"
→ Wrong email/password OR user not confirmed (if email confirmation enabled)

### "No auth token available, skipping sync"
→ User not logged in. Check AuthContext.session is not null

### Reports not appearing in MapScreen
→ Check user_id filtering logic. NGOs see all, citizens see only their own.

### Backend returns 401 Unauthorized
→ Check sync manager includes Authorization header with JWT token

---

## Security Notes

**Current setup is for DEVELOPMENT/HACKATHON:**
- Anon key is public (safe - it's meant to be)
- Email confirmation disabled (not production-ready)
- RLS policies protect data (good!)
- JWT tokens have short expiry (good!)

**For production:**
- Enable email confirmation
- Use custom SMTP provider
- Add rate limiting
- Enable MFA (multi-factor auth)
- Use Supabase Row Level Security (already configured!)
- Consider custom development build for better deep linking

---

## Next Steps After Auth Works

1. **Add logout button** to SettingsScreen
2. **Test role-based filtering** (citizen vs NGO views)
3. **Implement offline maps** with MapLibre + OSM tiles
4. **Add push notifications** with expo-notifications
5. **Create NGO dashboard** with report status updates

