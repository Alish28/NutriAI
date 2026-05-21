import { useTheme } from '../hooks/useTheme';
import './themeToggle.css';

export default function ThemeToggle({ style = {} }) {
  const { isDark, toggle } = useTheme();
  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={style}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}