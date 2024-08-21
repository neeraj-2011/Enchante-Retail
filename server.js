const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient } = require('mongodb');
const path = require('path');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitLabStrategy = require('passport-gitlab2').Strategy; // Import GitLab strategy
const session = require('express-session');
const cookieParser = require('cookie-parser');
require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// MongoDB connection URI
const mongoURI = 'mongodb+srv://geddamamulya06:Amulya06@cluster0.wj6kvlc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(mongoURI);

// Passport configuration for Google
passport.use(new GoogleStrategy({
  clientID: '13687418787-7358dnhl757gq9j5tvhvbiju2f4b622t.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: "http://localhost:3000/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    await client.connect();
    const database = client.db('data');
    const collection = database.collection('userDetails');
    let user = await collection.findOne({ googleId: profile.id });

    if (!user) {
      // If the user does not exist, create a new user
      user = {
        googleId: profile.id,
        username: profile.displayName,
        email: profile.emails[0].value,
        role: 'user'
      };
      await collection.insertOne(user);
    }

    done(null, user);
  } catch (err) {
    done(err, null);
  } finally {
    await client.close();
  }
}));

// Passport configuration for GitLab
passport.use(new GitLabStrategy({
  clientID: '4a493762f30ffd35804f938ed01edcaf5547a5d14b288334cbd747e681d0c65a',
  clientSecret: 'gloas-c8e0bd56f09b96e334cf0dc1649e03c753be2f840ef9fbe9a21236351df751f8',
  callbackURL: "https://enchante-elegance.netlify.app/",
  scope: ['read_user']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    await client.connect();
    const database = client.db('data');
    const collection = database.collection('userDetails');
    let user = await collection.findOne({ gitlabId: profile.id });
    
    if (!user) {
      // If the user does not exist, create a new user
      user = {
        gitlabId: profile.id,
        username: profile.username,
        email: profile.emails[0].value,
        role: 'user'
      };
      await collection.insertOne(user);
    }

    done(null, user);
  } catch (err) {
    done(err, null);
  } finally {
    await client.close();
  }
}));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    await client.connect();
    const database = client.db('data');
    const collection = database.collection('userDetails');
    const user = await collection.findOne({ _id: id });
    done(null, user);
  } catch (err) {
    done(err, null);
  } finally {
    await client.close();
  }
});

app.use(session({
  secret: '684980a139520ad9a01ce0379680e83f86e87c65fbe952877f7aa75effc623992ba89bc1f6ae3be7c63849b863e5d299f239d4bc16045acf49055487a2191686',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from the "public" directory
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html on the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/welcome.html'));
});

// Google OAuth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
 
  if (req.user.email === 'neerajsanka@gmail.com'|| req.user.email==='swapnareddychinni12@gmail.com') {
    res.redirect('/admin.html');
  } else {
    res.redirect('/welcome.html');
  }
});

// GitLab OAuth routes
app.get('/auth/gitlab', passport.authenticate('gitlab'));

app.get('/auth/gitlab/callback', passport.authenticate('gitlab', { failureRedirect: '/' }), (req, res) => {
  // Successful authentication, redirect to welcome page
  const token = jwt.sign({ username: req.user.username }, '2004@', { expiresIn: '1h' });
  localStorage.setItem('isLogin',JSON.stringify(true))
  res.cookie('token', token, { httpOnly: true, sameSite: 'strict' });
  res.redirect('/welcome.html');
});

// Login rout
// Login rout
app.post('/login', async (req, res) => {
  const { username, password, role } = req.body;

  try {
      await client.connect();
      const database = client.db('data');
      const collection = database.collection('userDetails');

      // Static credentials check
      if (role === 'admin' && username === 'RIYA' && password === '123') {
          const token = jwt.sign({ username }, '2004@', { expiresIn: '1h' });
          res.cookie('token', token, { httpOnly: true, sameSite: 'strict' });
          return res.status(200).json({ message: 'Login successful', role: 'admin', redirectUrl: '/admin.html' });
      } else if (role === 'user' && username === 'Raj' && password === '123') {
          const token = jwt.sign({ username }, '2004@', { expiresIn: '1h' });
          res.cookie('token', token, { httpOnly: true, sameSite: 'strict' });
          return res.status(200).json({ message: 'Login successful', role: 'user', redirectUrl: '/welcome.html' });
      } else {
          res.status(401).json({ error: 'Invalid username, password, or role' });
      }
  } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
  } finally {
      await client.close();
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(403).json({ error: 'A token is required for authentication' });
  }
  try {
    const decoded = jwt.verify(token, '2004@');
    req.user = decoded;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  return next();
};

// Protected route (example)
app.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Route to check the stored token
app.get('/check-token', (req, res) => {
  const token = req.cookies.token;
  if (token) {
    res.json({ token });
  } else {
    res.status(404).json({ error: 'Token not found' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
