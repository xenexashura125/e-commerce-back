const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    displayName: {
        type: String,
        required: true,
    },
    googleId: String,
    facebookId: String,
    resetPasswordToken: String, // Add a field to store the reset token
    resetPasswordExpires: Date, // Add a field to store the token's expiration date
    // ... other fields you might want to include
});

// Hash the password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(this.password, salt);
        this.password = hashedPassword;
        next();
    } catch (error) {
        return next(error);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        const trimmedCandidatePassword = candidatePassword.trim();
        return await bcrypt.compare(trimmedCandidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};


const User = mongoose.model('email', userSchema);

module.exports = User;
