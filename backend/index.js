const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // For base64 images

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// COMMENTED OUT: Rate Limiting Middleware
// Uncomment to enable rate limiting for production
// This prevents abuse from single IP addresses by limiting requests per time window
/*
const rateLimit = require('express-rate-limit');

// Rate limiter configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Specific rate limiters for different endpoints
const reportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // Limit each IP to 10 reports per minute
  message: 'Too many reports submitted, please try again later.',
});

const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 30, // Limit each IP to 30 votes per minute
  message: 'Too many votes submitted, please try again later.',
});

// Apply global rate limiter to all routes
app.use(limiter);

// Apply specific rate limiters to endpoints (uncomment when enabled)
// app.post('/api/reports', reportLimiter, authenticateUser, async (req, res) => { ... });
// app.post('/api/reports/:id/vote', voteLimiter, authenticateUser, async (req, res) => { ... });
*/

// Auth middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user role from user_profiles
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ error: 'Failed to get user profile' });
    }

    req.user = user;
    req.userRole = profile.role;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// POST /api/reports - Create new report (requires auth)
app.post('/api/reports', authenticateUser, async (req, res) => {
  try {
    const { zone, category, latitude, longitude, description, imageBase64, timestamp } = req.body;

    console.log('Received report:', { zone, category, latitude, longitude, hasImage: !!imageBase64, userId: req.user.id });

    // Upload image to Supabase storage if provided
    let imageUrl = null;
    if (imageBase64) {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const buffer = Buffer.from(imageBase64, 'base64');

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('report-images')
        .upload(fileName, buffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('Image upload error:', uploadError);
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('report-images')
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
    }

    // Insert report into database
    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          zone,
          category,
          latitude,
          longitude,
          description,
          image_url: imageUrl,
          timestamp: new Date(timestamp).toISOString(),
          status: 'pending',
          user_id: req.user.id,
        },
      ])
      .select();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('Report saved successfully:', data[0].id);
    res.status(201).json({ success: true, report: data[0] });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports - Get all reports
app.get('/api/reports', async (req, res) => {
  try {
    const { zone, category, status } = req.query;

    let query = supabase.from('reports').select('*');

    if (zone) query = query.eq('zone', zone);
    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);

    const { data, error } = await query.order('timestamp', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, reports: data });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/:id - Get single report
app.get('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ success: true, report: data });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/reports/:id - Update report status
app.patch('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'verified', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data, error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, report: data[0] });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/reports/:id/vote - Submit or update a vote on a report accuracy
app.post('/api/reports/:id/vote', authenticateUser, async (req, res) => {
  try {
    const { id: reportId } = req.params;
    const { voteType } = req.body;
    const userId = req.user.id;

    // Validate vote type
    if (!['accurate', 'inaccurate', 'unclear'].includes(voteType)) {
      return res.status(400).json({ error: 'Invalid vote type. Must be one of: accurate, inaccurate, unclear' });
    }

    // Check if report exists
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Upsert vote (insert or update if user already voted)
    const { data: vote, error: voteError } = await supabase
      .from('report_votes')
      .upsert(
        {
          report_id: reportId,
          user_id: userId,
          vote_type: voteType,
        },
        { onConflict: 'report_id,user_id' }
      )
      .select();

    if (voteError) {
      console.error('Vote submission error:', voteError);
      return res.status(500).json({ error: voteError.message });
    }

    console.log(`Vote submitted: User ${userId} voted ${voteType} on report ${reportId}`);
    res.status(201).json({ success: true, vote: vote[0] });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/:id/votes - Get vote statistics for a report
app.get('/api/reports/:id/votes', async (req, res) => {
  try {
    const { id: reportId } = req.params;

    // Get all votes for the report
    const { data: votes, error: votesError } = await supabase
      .from('report_votes')
      .select('vote_type')
      .eq('report_id', reportId);

    if (votesError) {
      console.error('Database error:', votesError);
      return res.status(500).json({ error: votesError.message });
    }

    // Calculate statistics
    const totalVotes = votes.length;
    const accurateVotes = votes.filter(v => v.vote_type === 'accurate').length;
    const inaccurateVotes = votes.filter(v => v.vote_type === 'inaccurate').length;
    const unclearVotes = votes.filter(v => v.vote_type === 'unclear').length;

    const accuracyPercentage = totalVotes > 0 
      ? Math.round((accurateVotes / totalVotes) * 100) 
      : 0;

    res.json({
      success: true,
      stats: {
        reportId,
        totalVotes,
        accurateVotes,
        inaccurateVotes,
        unclearVotes,
        accuracyPercentage,
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/:id/user-vote - Get current user's vote on a report
app.get('/api/reports/:id/user-vote', authenticateUser, async (req, res) => {
  try {
    const { id: reportId } = req.params;
    const userId = req.user.id;

    const { data: vote, error: voteError } = await supabase
      .from('report_votes')
      .select('vote_type, created_at')
      .eq('report_id', reportId)
      .eq('user_id', userId)
      .single();

    if (voteError && voteError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected if user hasn't voted
      console.error('Database error:', voteError);
      return res.status(500).json({ error: voteError.message });
    }

    res.json({
      success: true,
      vote: vote || null, // null if user hasn't voted
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/reports/:id/vote - Delete a user's vote on a report
app.delete('/api/reports/:id/vote', authenticateUser, async (req, res) => {
  try {
    const { id: reportId } = req.params;
    const userId = req.user.id;

    const { data, error: deleteError } = await supabase
      .from('report_votes')
      .delete()
      .eq('report_id', reportId)
      .eq('user_id', userId)
      .select();

    if (deleteError) {
      console.error('Vote deletion error:', deleteError);
      return res.status(500).json({ error: deleteError.message });
    }

    console.log(`Vote deleted: User ${userId} removed their vote from report ${reportId}`);
    res.json({ success: true, message: 'Vote deleted successfully' });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Setup demo accounts endpoint
app.post('/api/setup-demo', async (req, res) => {
  try {
    const demoAccounts = [
      { email: 'ngo@demo.com', password: 'demo1234', name: 'NGO Demo User', phone: '+970591234567', role: 'ngo', zone: 'Gaza City' },
      { email: 'citizen@demo.com', password: 'demo1234', name: 'Demo Citizen', phone: '+970597654321', role: 'citizen', zone: 'Gaza City' }
    ];

    const results = [];

    for (const account of demoAccounts) {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
      });

      if (authError) {
        // User might already exist
        results.push({ email: account.email, status: 'exists or error', error: authError.message });
        continue;
      }

      // Create user profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            email: account.email,
            name: account.name,
            phone: account.phone,
            role: account.role,
            zone: account.zone
          });

        if (profileError) {
          results.push({ email: account.email, status: 'auth created, profile failed', error: profileError.message });
        } else {
          results.push({ email: account.email, status: 'created', role: account.role });
        }
      }
    }

    res.json({ 
      message: 'Demo accounts setup complete',
      accounts: results,
      credentials: {
        ngo: { email: 'ngo@demo.com', password: 'demo1234' },
        citizen: { email: 'citizen@demo.com', password: 'demo1234' }
      }
    });

  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 API endpoint: http://localhost:${PORT}/api/reports`);
  console.log(`🗳️  Voting endpoints:`);
  console.log(`   POST /api/reports/:id/vote - Submit/update vote`);
  console.log(`   GET /api/reports/:id/votes - Get vote statistics`);
  console.log(`   GET /api/reports/:id/user-vote - Get your vote`);
  console.log(`   DELETE /api/reports/:id/vote - Delete your vote`);
  console.log(`🔧 Demo setup: POST http://localhost:${PORT}/api/setup-demo`);
});
