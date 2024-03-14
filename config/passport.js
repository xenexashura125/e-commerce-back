// config/passport.js
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
// const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/Users'); // Adjust the path



passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          console.log(profile)
            // Create a new user if not found
            user = new User({
                googleId: profile.id,
                displayName:profile.displayName,
                email:`dummy${profile.id}`,
                password:'dummy',
                facebookId:'dummy'
                // email: profile.emails[0].value,
                // ... other relevant fields
            });
            await user.save();
        }

        done(null, user);
    } catch (error) {
        done(error);
    }
}));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: '/auth/facebook/callback',
  }, 
  async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ facebookId: profile.id });

        if (!user) {
            // Create a new user if not found
            user = new User({
                facebookId: profile.id,
                email: profile.emails[0].value,
                // ... other relevant fields
            });
            await user.save();
        }

        done(null, user);
    } catch (error) {
        done(error);
    }
}));

passport.serializeUser((user,done) => {
    done(null, user);
})

passport.deserializeUser((user,done) => {
    done(null, user);
})