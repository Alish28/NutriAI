const bcrypt = require('bcrypt');
const User = require('../models/userModel');

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

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    if (profileData.phone_number) {
      const cleanedPhone = profileData.phone_number.replace(/\s|-/g, '');

      if (!/^(\+977)?9[78]\d{8}$/.test(cleanedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid Nepali mobile number'
        });
      }

      profileData.phone_number = cleanedPhone;
    }

    const arrayFields = [
      'health_goals',
      'dietary_preferences',
      'allergies',
      'preferred_cuisines',
      'nutrition_focus'
    ];

    arrayFields.forEach(field => {
      if (profileData[field] !== undefined) {
        if (typeof profileData[field] === 'string') {
          if (profileData[field].trim() === '') {
            profileData[field] = null;
          } else {
            profileData[field] = profileData[field]
              .split(',')
              .map(s => s.trim())
              .filter(Boolean);

            if (profileData[field].length === 0) {
              profileData[field] = null;
            }
          }
        } else if (Array.isArray(profileData[field])) {
          if (profileData[field].length === 0) {
            profileData[field] = null;
          }
        }
      }
    });

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

    const user = await User.findByEmail(req.user.email);
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

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