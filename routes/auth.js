// routes/auth.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const passport = require('passport');
const User = require('../models/Users'); // Adjust the path
const nodemailer = require('nodemailer')
const authController = require('../controllers/auth.controller');

const jwt = require('jsonwebtoken');

const CLIENT_URL = "http://localhost:3000/"
const router = express.Router();

// Generate a random token for password reset
function generateResetToken() {
    const tokenLength = 20;
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < tokenLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters[randomIndex];
    }
    return token;
}

// Create a nodemailer transporter for sending emails (you should configure this)
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'mythicalxenon12@gmail.com', // Your Gmail email address
        pass: 'etbk qrpp oxox mgpe', // Your Gmail password or an app-specific password
    },
});

// Route to initiate password reset
router.post('/reset-password', async (req, res) => {
    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    const { email } = req.body;
    try {
        // Check if the user exists
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate a reset token and store it in the user's document
        const resetToken = generateResetToken();
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
        await user.save();

        // Send a password reset email to the user
        const mailOptions = {
            to: email,
            from: 'mythicalxenon12@gmail.com', // Your Gmail email address
            subject: 'Password Reset Request',
            text: `You are receiving this email because you (or someone else) has requested a password reset for your account.\n\n
                    Please click on the following link, or paste it into your browser to complete the process:\n\n
                    http://localhost:3000/reset-password/${resetToken}\n\n
                    If you did not request this, please ignore this email and your password will remain unchanged.\n`,
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ message: 'Error sending email' });
            }
            res.status(200).json({ message: 'Password reset email sent',token: resetToken });
        });
    } catch (error) {
        console.error('Error initiating password reset:', error);
        res.status(500).json({ message: 'Error initiating password reset' });
    }
});

router.post('/change-password', async (req, res) => {
    try {
        const { resetPasswordToken, newPassword } = req.body;

        // Find the user by the reset token
        const user = await User.findOne({ resetPasswordToken });

        // Check if the reset token is valid and hasn't expired
        if (!user || user.resetPasswordExpires < Date.now()) {
            return res.status(401).json({ message: 'Invalid or expired reset token' });
        }

        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        // Save the updated user document
        await user.save();

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error resetting password' });
    }
});


router.get('/login/failed', (req, res) => {
    res.status(401).json({
        success:false,
        message:"failure"
    })
})

router.get('/login/success', (req, res) => {
    // console.log(req.user)
    if (req.user) {
        res.status(200).json({
            success:true,
            message:"successfull",
            user:req.user,
            // cookies:req.cookies
        })
    }
})

router.get('/logout', (req, res) => {
    // console.log(req.user,req)
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.redirect(CLIENT_URL);
    });
});


router.get('/google', passport.authenticate("google",{ scope:["profile"] }))

router.get('/google/callback', async (req, res, next) => {
    passport.authenticate('google', async (err, user) => {
      if (err) {
        return res.redirect('/login/failed');
      }
  
      if (!user) {
        // User not found in Google authentication
        return res.redirect('/login/failed');
      }
  
      try {
        // Check if a user with the same email exists in your database
        const existingUser = await User.findOne({ email: user.email });
  
        if (existingUser) {
          // Link the Google account to the existing user
          existingUser.googleId = user.googleId;
          await existingUser.save();
  
          // Authenticate the user and redirect
          req.login(existingUser, (err) => {
            if (err) {
              return res.redirect('/login/failed');
            }
            return res.redirect(CLIENT_URL);
          });
        } else {
          // No user with the same email, create a new account
          const newUser = new User({
            email: user.email,
            googleId: user.googleId,
            displayName: user.displayName,
          });
  
          await newUser.save();
  
          // Authenticate the new user and redirect
          req.login(newUser, (err) => {
            if (err) {
              return res.redirect('/login/failed');
            }
            return res.redirect(CLIENT_URL);
          });
        }
      } catch (error) {
        console.error(error);
        return res.redirect('/login/failed');
      }
    })(req, res, next);
  });

router.get('/facebook', passport.authenticate("facebook",{ scope:["profile"] }))

router.get(
    '/facebook/callback', 
    passport.authenticate("facebook",{
        successRedirect: CLIENT_URL,
        failureRedirect:'/login/failed'
    })
)

// Add this route to your routes/auth.js
router.delete('/delete-account/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if the user exists
        const user = await User.findById(userId);

        if (!user) {
        return res.status(404).json({ message: 'User not found' });
        }

        // Delete the user
        await user.remove();

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'Error deleting account' });
    }
});



router.post('/register', async (req, res) => {
    const { email, password, displayName } = req.body;
    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists:', existingUser);
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create a new user
        const newUser = new User({
            email,
            password,
            displayName
        });

        // Save the new user
        await newUser.save();

        // Log the new user
        console.log('New user registered:', newUser);

        // Respond with success message
        return res.status(200).json({ message: 'User registered and logged in successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
});



// Route to update a user account
router.put('/update-account/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { email, password, displayName } = req.body;

        // Check if the user exists
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the user's information
        user.email = email;
        user.password = password; // You might want to hash the password again here if it's being changed
        user.displayName = displayName;

        // Save the updated user document
        await user.save();

        res.status(200).json({ message: 'Account updated successfully', user });
    } catch (error) {
        console.error('Error updating account:', error);
        res.status(500).json({ message: 'Error updating account' });
    }
});

// Route to delete a user account
router.delete('/delete-account/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if the user exists
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete the user
        await user.deleteOne();

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'Error deleting account' });
    }
});

// routes/auth.js
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Find the user by email
        const user = await User.findOne({ email });

        // Check if the user exists
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Compare passwords using bcrypt
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // If credentials are valid, you can create a session or token for the user here
        // For example, you can generate a JWT token and send it back as a response
        const token = authController.generateAccessToken({ username: email });

        return res.status(200).json({ message: 'Login successful', user, token });

    } catch (error) {
        console.error('Error during login:', error); // Log the error here
        res.status(500).json({ message: 'Error during login' });
    }
});


  // Add this function to users.controller.js
router.post('/getUserByToken',async (req, res) => {
    try {
      const { token } = req.body;

      console.log(token)
      jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {

      console.log(err,user)

        if (err) {
          // If the token is invalid or expired, return an error.
          return res.status(401).json({ message: 'Invalid or expired token', status: 401 });
        }
  
        // If the token is valid, user will contain the decoded token payload.
        res.status(200).json({ user });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
)


// Route to get all user accounts
router.get('/get-all-users', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json({ users });
    } catch (error) {
        console.error('Error getting all users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});




module.exports = router;
