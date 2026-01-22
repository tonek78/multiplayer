require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Twitch API Config
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const REDIRECT_URI = process.env.TWITCH_REDIRECT_URI || 'http://localhost:3000/auth/callback';

let twitchAccessToken = null;

// Middleware to serve static files
// Only serve static files if running standalone (not on Netlify Functions)
if (require.main === module) {
    app.use(express.static(path.join(__dirname, 'public')));
}

// Routers
const apiRouter = express.Router();
const authRouter = express.Router();

// Helper to get Access Token
async function getTwitchAccessToken() {
    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) return null;

    try {
        const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: TWITCH_CLIENT_ID,
                client_secret: TWITCH_CLIENT_SECRET,
                grant_type: 'client_credentials'
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error fetching Twitch token:', error.response?.data || error.message);
        return null;
    }
}

// API Endpoint to get stream info
apiRouter.get('/stream/:user', async (req, res) => {
    const user = req.params.user;

    // Default response
    const defaultData = { online: false, title: 'No Data', game: '', viewers: 0 };

    // Handle YouTube (y:VIDEO_ID)
    if (user.startsWith('y:')) {
        const videoId = user.substring(2);
        try {
            const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const ytRes = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(ytUrl)}&format=json`);
            // ytRes.data contains { title, author_name, author_url, ... }
            return res.json({
                online: true, // Always "active" for metadata purposes
                title: ytRes.data.title,
                game: ytRes.data.author_name, // Map channel/author to game/category slot
                viewers: 0, // YouTube doesn't give live viewers in oembed
                thumbnail: ytRes.data.thumbnail_url,
                avatar: null // No avatar in oembed
            });
        } catch (error) {
            console.error('YouTube oEmbed error:', error.message);
            return res.json({ ...defaultData, title: 'YouTube Video', game: 'Unknown Channel' });
        }
    }

    // Handle Kick (k:USERNAME) - Optional stub for future, pass through for now or basic mock
    if (user.startsWith('k:')) {
        const kickUser = user.substring(2);
        // Kick doesn't have a simple open API for metadata without potential cloudflare issues.
        // For now, return basic info derived from username.
        return res.json({
            online: true,
            title: `${kickUser}'s Stream`,
            game: 'Kick',
            viewers: 0,
            avatar: null
        });
    }

    // Handle Twitch
    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
        return res.json({ ...defaultData, title: 'API Keys Missing' });
    }

    try {
        if (!twitchAccessToken) {
            twitchAccessToken = await getTwitchAccessToken();
        }

        // Fetch user ID and avatar (Users endpoint)
        const userResponse = await axios.get(`https://api.twitch.tv/helix/users?login=${user}`, {
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${twitchAccessToken}`
            }
        });

        const userData = userResponse.data.data[0];
        const avatar = userData ? userData.profile_image_url : null;

        // Fetch stream info
        const streamResponse = await axios.get(`https://api.twitch.tv/helix/streams?user_login=${user}`, {
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${twitchAccessToken}`
            }
        });

        const streamData = streamResponse.data.data[0];

        if (streamData) {
            res.json({
                online: true,
                title: streamData.title,
                game: streamData.game_name,
                viewers: streamData.viewer_count,
                thumbnail: streamData.thumbnail_url.replace('{width}x{height}', '320x180'),
                avatar: avatar
            });
        } else {
            res.json({ ...defaultData, online: false, title: 'Offline', avatar: avatar });
        }

    } catch (error) {
        console.error(`Error fetching data for ${user}:`, error.message);
        // If 401, token might be expired, reset it (simple retry logic could be added)
        if (error.response?.status === 401) twitchAccessToken = null;
        res.json(defaultData);
    }
});

// Auth Routes
// Note: Mounted at /auth locally and /.netlify/functions/api/auth on Netlify
authRouter.get('/twitch', (req, res) => {
    const scope = 'user:read:follows';
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}`;
    res.redirect(authUrl);
});

authRouter.get('/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).send('Error: No code provided');
    }

    try {
        // Exchange code for User Access Token
        const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: TWITCH_CLIENT_ID,
                client_secret: TWITCH_CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI
            }
        });

        const userAccessToken = tokenResponse.data.access_token;

        // Get User ID
        const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${userAccessToken}`
            }
        });

        const userId = userResponse.data.data[0].id;

        // Get Followed Streams (Live only)
        // Note: 'user_id' param is the user *checking* follows (the logged in user)
        const followsResponse = await axios.get(`https://api.twitch.tv/helix/streams/followed?user_id=${userId}`, {
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${userAccessToken}`
            }
        });

        const liveStreams = followsResponse.data.data;

        if (liveStreams.length === 0) {
            return res.redirect('/');
        }

        const streamers = liveStreams.map(s => s.user_login).join('/');
        res.redirect(`/${streamers}`);

    } catch (error) {
        console.error('Auth Error:', error.response ? error.response.data : error.message);
        res.status(500).send('Authentication Failed');
    }
});

// API Endpoint to search channels
apiRouter.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
        return res.json([]); // Fail silently or return mock data
    }

    try {
        if (!twitchAccessToken) {
            twitchAccessToken = await getTwitchAccessToken();
        }

        const response = await axios.get(`https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(query)}&first=5`, {
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${twitchAccessToken}`
            }
        });

        const results = response.data.data.map(ch => ({
            name: ch.display_name,
            login: ch.broadcaster_login, // Use login for embedding
            game: ch.game_name,
            thumbnail: ch.thumbnail_url,
            is_live: ch.is_live
        }));

        res.json(results);
    } catch (error) {
        console.error('Search error:', error.message);
        if (error.response?.status === 401) twitchAccessToken = null;
        res.json([]);
    }
});

// API Endpoint to get batch stream info
apiRouter.get('/streams', async (req, res) => {
    const usersParam = req.query.users;
    if (!usersParam) return res.json({});

    const users = usersParam.split(',');
    const results = {};
    const twitchUsers = [];

    // 1. Separate by platform
    for (const user of users) {
        if (user.startsWith('y:')) {
            // YouTube: Assume online (video available) or fetch meta if needed. 
            // For batch/saved groups, just showing as "Online" (available) is fine for now.
            results[user] = { online: true, type: 'youtube' };
        } else if (user.startsWith('k:')) {
            // Kick: Mock online
            results[user] = { online: true, type: 'kick' };
        } else {
            twitchUsers.push(user);
            results[user] = { online: false, type: 'twitch' }; // Default offline
        }
    }

    // 2. Fetch Twitch Data in Batch
    if (twitchUsers.length > 0 && TWITCH_CLIENT_ID && TWITCH_CLIENT_SECRET) {
        try {
            if (!twitchAccessToken) {
                twitchAccessToken = await getTwitchAccessToken();
            }

            // Helix allows multiple user_login params (up to 100)
            // user_login=user1&user_login=user2...
            const queryString = twitchUsers.map(u => `user_login=${encodeURIComponent(u)}`).join('&');

            const streamResponse = await axios.get(`https://api.twitch.tv/helix/streams?${queryString}`, {
                headers: {
                    'Client-ID': TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${twitchAccessToken}`
                }
            });

            const liveStreams = streamResponse.data.data;

            // Map live streams to results
            liveStreams.forEach(stream => {
                const login = stream.user_login.toLowerCase();
                if (results[login]) {
                    results[login].online = true;
                    // We could add more data here if the frontend needs it (viewers, game)
                    results[login].viewers = stream.viewer_count;
                    results[login].game = stream.game_name;
                }
            });

        } catch (error) {
            console.error('Batch Twitch Error:', error.message);
            if (error.response?.status === 401) twitchAccessToken = null;
        }
    }

    res.json(results);
});

// Configure Routes
// Local
app.use('/api', apiRouter);
app.use('/auth', authRouter);

// Netlify
app.use('/.netlify/functions/api', apiRouter);
app.use('/.netlify/functions/api/auth', authRouter);


// SPA Fallback: Serve index.html for any other route
// Only use this fallback if running standalone. Netlify handles SPA rewrites via netlify.toml
if (require.main === module) {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
}

// Export app for Netlify
module.exports = app;

// Only listen if run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}
