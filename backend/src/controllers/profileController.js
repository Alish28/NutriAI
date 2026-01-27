const bcrypt = require('bcrypt');
const User = require('../models/UserModel');

// Get full user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.getFullProfile(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    // Convert string arrays from frontend to PostgreSQL arrays
    if (profileData.health_goals && typeof profileData.health_goals === 'string') {
      profileData.health_goals = profileData.health_goals.split(',').map(s => s.trim());
    }
    if (profileData.dietary_preferences && typeof profileData.dietary_preferences === 'string') {
      profileData.dietary_preferences = profileData.dietary_preferences.split(',').map(s => s.trim());
    }
    if (profileData.allergies && typeof profileData.allergies === 'string') {
      profileData.allergies = profileData.allergies.split(',').map(s => s.trim());
    }
    if (profileData.preferred_cuisines && typeof profileData.preferred_cuisines === 'string') {
      profileData.preferred_cuisines = profileData.preferred_cuisines.split(',').map(s => s.trim());
    }
    if (profileData.nutrition_focus && typeof profileData.nutrition_focus === 'string') {
      profileData.nutrition_focus = profileData.nutrition_focus.split(',').map(s => s.trim());
    }

    const updatedUser = await User.updateProfile(userId, profileData);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Verify current password
    const user = await User.findByEmail(req.user.email);
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await User.updatePassword(userId, password_hash);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: error.message
    });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your password to confirm account deletion'
      });
    }

    // Verify password
    const user = await User.findByEmail(req.user.email);
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    await User.delete(userId);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: error.message
    });
  }
};

// Export user data (GDPR compliance)
exports.exportData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.getFullProfile(userId);
    
    res.status(200).json({
      success: true,
      message: 'User data exported successfully',
      data: user
    });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting data',
      error: error.message
    });
  }
};