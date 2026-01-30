# Consensus & Voting System Implementation

## Overview
A community consensus/voting system has been added to allow users to verify report accuracy. Users can vote on whether reports are accurate, inaccurate, or unclear. Statistics are aggregated and displayed to provide confidence levels for reports.

## Features Implemented

### 1. Database Schema (`backend/schema.sql`)
New tables and views added for the voting system:

#### `report_votes` Table
- Stores individual user votes on report accuracy
- Fields:
  - `id`: UUID primary key
  - `report_id`: References the report being voted on (cascades on delete)
  - `user_id`: The user submitting the vote
  - `vote_type`: One of 'accurate', 'inaccurate', 'unclear'
  - `created_at`: Timestamp of vote submission
  - Unique constraint: Prevents duplicate votes from same user on same report

#### `report_vote_stats` View
- Auto-calculated view that aggregates vote statistics per report
- Calculates:
  - Total votes count
  - Accurate votes count
  - Inaccurate votes count
  - Unclear votes count
  - Accuracy percentage (accurate votes / total votes * 100)

#### Security
- Row Level Security (RLS) enabled on `report_votes` table
- Anyone can read votes
- Anyone can insert votes
- Users can only update/delete their own votes

#### Indexes
- `idx_report_votes_report_id`: Fast lookup by report
- `idx_report_votes_user_id`: Fast lookup by user
- `idx_report_votes_created_at`: Fast lookup by date for analytics

### 2. Backend API Endpoints (`backend/index.js`)

#### POST `/api/reports/:id/vote`
**Submit or update a vote on report accuracy**
- Requires authentication
- Body: `{ voteType: 'accurate' | 'inaccurate' | 'unclear' }`
- Uses upsert to allow users to change their vote
- Returns the vote record

Example:
```bash
curl -X POST http://localhost:3001/api/reports/abc123/vote \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "voteType": "accurate" }'
```

#### GET `/api/reports/:id/votes`
**Get vote statistics for a report**
- No authentication required
- Returns aggregated vote statistics including total votes and accuracy percentage
- Used for displaying consensus statistics to users

Example:
```bash
curl http://localhost:3001/api/reports/abc123/votes
```

Response:
```json
{
  "success": true,
  "stats": {
    "reportId": "abc123",
    "totalVotes": 15,
    "accurateVotes": 12,
    "inaccurateVotes": 2,
    "unclearVotes": 1,
    "accuracyPercentage": 80
  }
}
```

#### GET `/api/reports/:id/user-vote`
**Get current user's vote on a report**
- Requires authentication
- Returns the user's vote if they've voted, null otherwise
- Used to show which button should be highlighted in the UI

Example:
```bash
curl http://localhost:3001/api/reports/abc123/user-vote \
  -H "Authorization: Bearer TOKEN"
```

#### DELETE `/api/reports/:id/vote`
**Remove a user's vote from a report**
- Requires authentication
- User can only delete their own vote
- Returns success message

Example:
```bash
curl -X DELETE http://localhost:3001/api/reports/abc123/vote \
  -H "Authorization: Bearer TOKEN"
```

### 3. Mobile App UI (`rubble-report-mobile/screens/MapScreen.tsx`)

#### New State Variables
- `voteStats`: Stores aggregated vote statistics for the selected report
- `userVote`: Tracks the current user's vote on the selected report
- `votingLoading`: Loading state for vote operations

#### New Functions
- `loadVoteStats(reportId)`: Fetches vote statistics from the backend
- `submitVote(voteType)`: Submits/updates user's vote

#### Voting UI in Report Modal
When a user opens a report modal, they see:

1. **Community Consensus Section**
   - Shows total number of votes
   - Displays accuracy percentage with visual progress bar (green)
   - Vote breakdown showing counts for each vote type:
     - ✓ Accurate (green)
     - ✗ Inaccurate (red)
     - ? Unclear (orange)

2. **Voting Buttons**
   - Three buttons: "✓ Accurate", "✗ Inaccurate", "? Unclear"
   - Buttons highlight in their respective colors when selected
   - Pressing a button submits/updates the vote
   - Disabled during loading

3. **Features**
   - Users can change their vote by clicking a different button
   - Immediate UI feedback showing their vote is registered
   - Loading state prevents double submissions
   - Error handling with user alerts

#### Color Scheme
- Accurate votes: Green (#10B981)
- Inaccurate votes: Red (#EF4444)
- Unclear votes: Orange (#F59E0B)

## Rate Limiting (Commented Out)

Rate limiting middleware has been added but is commented out for development. This prevents abuse from single IP addresses.

### Location: `backend/index.js` (Lines 24-43)

The commented code includes:
1. **Global Rate Limiter**: 15-minute window, 100 requests per IP
2. **Report Limiter**: 1-minute window, 10 reports per IP
3. **Vote Limiter**: 1-minute window, 30 votes per IP

To enable in production:
1. Install `express-rate-limit`: `npm install express-rate-limit`
2. Uncomment the rate limiting section
3. Uncomment the middleware applications on the endpoints
4. Restart the server

Example usage after enabling:
```javascript
// Global limiter
app.use(limiter);

// Specific limiters
app.post('/api/reports', reportLimiter, authenticateUser, async (req, res) => { ... });
app.post('/api/reports/:id/vote', voteLimiter, authenticateUser, async (req, res) => { ... });
```

## Data Flow

### Voting Flow
1. User opens a report in the modal
2. `loadVoteStats()` is called to fetch vote statistics
3. Vote statistics are displayed with accuracy percentage and breakdown
4. User clicks one of the three voting buttons
5. `submitVote()` sends the vote to the backend
6. Backend stores the vote in `report_votes` table
7. Vote is upserted (update if exists, insert if new)
8. Vote statistics are reloaded and displayed
9. User sees their vote highlighted in the UI

### Backend Vote Processing
1. POST to `/api/reports/:id/vote` with `voteType`
2. Backend verifies user is authenticated
3. Backend checks report exists
4. Backend upserts vote into `report_votes` table
5. Returns saved vote record
6. Frontend updates UI to reflect the vote

### Statistics Calculation
1. GET `/api/reports/:id/votes` retrieves all votes for report
2. Backend queries all votes for the report
3. Calculates counts and percentages
4. Returns stats object with totals and accuracy percentage
5. Frontend displays in the UI

## Testing

### Mock Data
Currently, the mobile app uses mock vote data for demonstration:
```javascript
// Mock voting stats for demonstration
setVoteStats({
  totalVotes: Math.floor(Math.random() * 20) + 1,
  accurateVotes: Math.floor(Math.random() * 15),
  inaccurateVotes: Math.floor(Math.random() * 5),
  unclearVotes: Math.floor(Math.random() * 3),
  accuracyPercentage: Math.floor(Math.random() * 30) + 60,
});
```

To test with real backend:
1. Uncomment the API call in `loadVoteStats()`
2. Provide the backend URL
3. Ensure backend is running
4. Test voting on reports

### API Testing
Use curl to test the endpoints:

```bash
# Get vote statistics
curl http://localhost:3001/api/reports/abc123/votes

# Submit a vote (requires authentication token)
curl -X POST http://localhost:3001/api/reports/abc123/vote \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "voteType": "accurate" }'

# Get your vote
curl http://localhost:3001/api/reports/abc123/user-vote \
  -H "Authorization: Bearer TOKEN"

# Delete your vote
curl -X DELETE http://localhost:3001/api/reports/abc123/vote \
  -H "Authorization: Bearer TOKEN"
```

## Next Steps

### To Connect Frontend to Backend
1. Uncomment API calls in `MapScreen.tsx`:
   - `loadVoteStats()` function
   - `submitVote()` function
2. Add backend API URL configuration
3. Ensure authentication tokens are properly passed
4. Test voting flow end-to-end

### To Enable Rate Limiting
1. Install `express-rate-limit` package
2. Uncomment rate limiting section in `backend/index.js`
3. Configure limits based on requirements
4. Restart backend server

### To Enhance the System
- Add voting history/leaderboards
- Implement confidence scoring based on vote counts
- Add vote filtering to show only high-confidence reports
- Create reports that flag inaccurate entries
- Add admin tools to review disputed reports
- Implement weighted voting (verified users have more weight)

## Files Modified

1. **`backend/schema.sql`**
   - Added `report_votes` table
   - Added `report_vote_stats` view
   - Added RLS policies and indexes

2. **`backend/index.js`**
   - Added commented rate limiting middleware
   - Added 5 new API endpoints for voting
   - Updated server startup logs

3. **`rubble-report-mobile/screens/MapScreen.tsx`**
   - Added voting state variables
   - Added `loadVoteStats()` and `submitVote()` functions
   - Added voting UI section to report modal
   - Added useEffect to load votes when modal opens

## Security Considerations

- All vote endpoints validate vote types (accurate, inaccurate, unclear)
- User ID comes from authenticated token, cannot be spoofed
- RLS policies prevent users from updating/deleting other users' votes
- Rate limiting prevents spam (when enabled)
- Database constraints enforce data integrity

## Performance Notes

- Vote stats are loaded on-demand when report is selected
- Indexes on `report_id` and `user_id` enable fast queries
- View aggregation is computed at query time (can be materialized in future)
- No N+1 queries - stats are fetched in single query per report

