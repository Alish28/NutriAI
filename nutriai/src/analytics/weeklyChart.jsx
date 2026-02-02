import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getWeeklyTrends } from '../services/api';
import './WeeklyChart.css';

export default function WeeklyChart() {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('calories');

  useEffect(() => {
    loadWeeklyTrends();
  }, []);

  const loadWeeklyTrends = async () => {
    try {
      setLoading(true);
      const response = await getWeeklyTrends();
      setTrends(response.data.trends);
    } catch (error) {
      console.error('Error loading weekly trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const metrics = {
    calories: { label: 'Calories', color: '#f59e0b', unit: 'cal' },
    protein: { label: 'Protein', color: '#3b82f6', unit: 'g' },
    carbs: { label: 'Carbs', color: '#10b981', unit: 'g' },
    fats: { label: 'Fats', color: '#8b5cf6', unit: 'g' }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value" style={{ color: metrics[selectedMetric].color }}>
            {payload[0].value.toFixed(1)} {metrics[selectedMetric].unit}
          </p>
          <p className="tooltip-meals">{payload[0].payload.meal_count} meals logged</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="weekly-chart-card">
        <h3>7-Day Nutrition Trends</h3>
        <div className="chart-loading">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="weekly-chart-card">
      <div className="chart-header">
        <h3>📊 7-Day Nutrition Trends</h3>
        <div className="metric-selector">
          {Object.keys(metrics).map(key => (
            <button
              key={key}
              className={`metric-btn ${selectedMetric === key ? 'active' : ''}`}
              onClick={() => setSelectedMetric(key)}
              style={{ 
                borderColor: selectedMetric === key ? metrics[key].color : 'transparent',
                color: selectedMetric === key ? metrics[key].color : '#666'
              }}
            >
              {metrics[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="dayName" 
              tick={{ fontSize: 12, fill: '#666' }}
              stroke="#e0e0e0"
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#666' }}
              stroke="#e0e0e0"
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey={selectedMetric} 
              stroke={metrics[selectedMetric].color}
              strokeWidth={3}
              dot={{ fill: metrics[selectedMetric].color, r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-summary">
        <div className="summary-item">
          <span className="summary-label">Total Days</span>
          <span className="summary-value">7</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Days Logged</span>
          <span className="summary-value">
            {trends.filter(d => d.meal_count > 0).length}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Avg {metrics[selectedMetric].label}</span>
          <span className="summary-value" style={{ color: metrics[selectedMetric].color }}>
            {(trends.reduce((sum, d) => sum + d[selectedMetric], 0) / 7).toFixed(0)}
            <span className="summary-unit">{metrics[selectedMetric].unit}</span>
          </span>
        </div>
      </div>
    </div>
  );
}