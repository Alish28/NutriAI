const db = require('../config/database');

// Get 7-day nutrition trends
exports.getWeeklyTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get last 7 days of data
    const query = `
      SELECT 
        meal_date::date as date,
        COUNT(*) as meal_count,
        COALESCE(SUM(calories), 0) as total_calories,
        COALESCE(SUM(protein), 0) as total_protein,
        COALESCE(SUM(carbs), 0) as total_carbs,
        COALESCE(SUM(fats), 0) as total_fats
      FROM meals
      WHERE user_id = $1 
        AND meal_date >= CURRENT_DATE - INTERVAL '6 days'
        AND meal_date <= CURRENT_DATE
      GROUP BY meal_date::date
      ORDER BY date ASC
    `;
    
    const result = await db.query(query, [userId]);
    
    // Fill in missing days with zeros
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = result.rows.find(row => row.date === dateStr);
      
      last7Days.push({
        date: dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        meal_count: dayData ? parseInt(dayData.meal_count) : 0,
        calories: dayData ? parseFloat(dayData.total_calories) : 0,
        protein: dayData ? parseFloat(dayData.total_protein) : 0,
        carbs: dayData ? parseFloat(dayData.total_carbs) : 0,
        fats: dayData ? parseFloat(dayData.total_fats) : 0
      });
    }
    
    res.json({
      success: true,
      data: {
        trends: last7Days
      }
    });
  } catch (error) {
    console.error('Error fetching weekly trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly trends',
      error: error.message
    });
  }
};

// Get current streak (consecutive days with at least 1 meal logged)
exports.getStreak = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // FIXED: Get dates properly formatted from PostgreSQL
    const query = `
      SELECT DISTINCT meal_date::date as date
      FROM meals
      WHERE user_id = $1 
        AND meal_date >= CURRENT_DATE - INTERVAL '60 days'
      ORDER BY date DESC
    `;
    
    const result = await db.query(query, [userId]);
    
    // FIXED: Convert PostgreSQL dates to strings properly
    const dates = result.rows.map(row => {
      // PostgreSQL returns date as Date object, convert to YYYY-MM-DD string
      const d = new Date(row.date);
      return d.toISOString().split('T')[0];
    });
    
    console.log('DEBUG - Dates from DB:', dates); // For debugging
    
    if (dates.length === 0) {
      return res.json({
        success: true,
        data: {
          currentStreak: 0,
          longestStreak: 0,
          lastLoggedDate: null,
          totalDaysLogged: 0
        }
      });
    }
    
    // FIXED: Get today and yesterday in LOCAL timezone (not UTC)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = today.toISOString().split('T')[0];
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    console.log('DEBUG - Today:', todayStr, 'Yesterday:', yesterdayStr); // For debugging
    
    // Calculate current streak
    let currentStreak = 0;
    
    // Check if user logged today or yesterday
    if (dates.includes(todayStr) || dates.includes(yesterdayStr)) {
      currentStreak = 1;
      
      // Start from the most recent date
      let checkDate = new Date(dates[0]);
      
      for (let i = 1; i < dates.length; i++) {
        // Calculate expected previous date
        const expectedDate = new Date(checkDate);
        expectedDate.setDate(expectedDate.getDate() - 1);
        const expectedStr = expectedDate.toISOString().split('T')[0];
        
        // Check if next date in array matches expected previous date
        if (dates[i] === expectedStr) {
          currentStreak++;
          checkDate = new Date(dates[i]);
        } else {
          break; // Streak broken
        }
      }
    }
    
    // Calculate longest streak
    let longestStreak = 1;
    let tempStreak = 1;
    
    for (let i = 0; i < dates.length - 1; i++) {
      const currentDate = new Date(dates[i]);
      const nextDate = new Date(dates[i + 1]);
      
      // Calculate difference in days
      const diffTime = currentDate - nextDate;
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    
    console.log('DEBUG - Current streak:', currentStreak, 'Longest:', longestStreak); // For debugging
    
    res.json({
      success: true,
      data: {
        currentStreak,
        longestStreak,
        lastLoggedDate: dates[0],
        totalDaysLogged: dates.length
      }
    });
  } catch (error) {
    console.error('Error calculating streak:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate streak',
      error: error.message
    });
  }
};

// Get weekly averages compared to goals
exports.getWeeklyAverages = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get weekly averages
    const query = `
      SELECT 
        COUNT(DISTINCT meal_date::date) as days_logged,
        COALESCE(AVG(daily_totals.calories), 0) as avg_calories,
        COALESCE(AVG(daily_totals.protein), 0) as avg_protein,
        COALESCE(AVG(daily_totals.carbs), 0) as avg_carbs,
        COALESCE(AVG(daily_totals.fats), 0) as avg_fats
      FROM (
        SELECT 
          meal_date::date as date,
          SUM(calories) as calories,
          SUM(protein) as protein,
          SUM(carbs) as carbs,
          SUM(fats) as fats
        FROM meals
        WHERE user_id = $1 
          AND meal_date >= CURRENT_DATE - INTERVAL '6 days'
          AND meal_date <= CURRENT_DATE
        GROUP BY meal_date::date
      ) as daily_totals
    `;
    
    const result = await db.query(query, [userId]);
    const averages = result.rows[0];
    
    // Get user's nutrition goals from profile
    const profileQuery = `
      SELECT age, gender, weight, height, activity_level, health_goals, nutrition_focus
      FROM users
      WHERE id = $1
    `;
    
    const profileResult = await db.query(profileQuery, [userId]);
    const profile = profileResult.rows[0];
    
    // Calculate goals
    let goals = {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fats: 65
    };
    
    // If profile is complete, calculate personalized goals
    if (profile && profile.age && profile.weight && profile.height && profile.gender) {
      // Basic BMR calculation (Mifflin-St Jeor)
      const bmr = profile.gender === 'Male' 
        ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
        : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
      
      const activityMultipliers = {
        'Sedentary': 1.2,
        'Lightly Active': 1.375,
        'Moderately Active': 1.55,
        'Very Active': 1.725,
        'Extremely Active': 1.9
      };
      
      const multiplier = activityMultipliers[profile.activity_level] || 1.2;
      goals.calories = Math.round(bmr * multiplier);
      goals.protein = Math.round(goals.calories * 0.30 / 4);
      goals.carbs = Math.round(goals.calories * 0.40 / 4);
      goals.fats = Math.round(goals.calories * 0.30 / 9);
    }
    
    res.json({
      success: true,
      data: {
        averages: {
          calories: parseFloat(averages.avg_calories).toFixed(0),
          protein: parseFloat(averages.avg_protein).toFixed(1),
          carbs: parseFloat(averages.avg_carbs).toFixed(1),
          fats: parseFloat(averages.avg_fats).toFixed(1)
        },
        goals,
        daysLogged: parseInt(averages.days_logged),
        totalDays: 7,
        percentages: {
          calories: Math.round((averages.avg_calories / goals.calories) * 100),
          protein: Math.round((averages.avg_protein / goals.protein) * 100),
          carbs: Math.round((averages.avg_carbs / goals.carbs) * 100),
          fats: Math.round((averages.avg_fats / goals.fats) * 100)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching weekly averages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly averages',
      error: error.message
    });
  }
};