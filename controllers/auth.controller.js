const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const crypto = require('crypto');

// get config vars
dotenv.config();

// access config var
process.env.TOKEN_SECRET;

module.exports = {
  authenticateToken : (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);
  
    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
      console.log(err);
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  },

  generateAccessToken : (username) => {
    return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: '4hr' });
  },
  
  generateRandomToken : () => {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    return hashResetToken;
  }
}