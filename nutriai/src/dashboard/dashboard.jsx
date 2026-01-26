import { useState, useEffect } from "react";
import { logout } from "../services/api";
import "./dashboard.css";
import MealSidebar from "../meal-sidebar/mealsidebar.jsx";

export default function Dashboard({ onLogout, onOpenProfile }) {
  const [isMealSidebarOpen, setIsMealSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Load user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    logout();
    if (onLogout) onLogout();
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="dashboard-page">
      {/* Top navigation */}
      <header className="dash-header">
        <div className="dash-logo">
          <span className="logo-mark">🍽</span>
          <span className="logo-text">NutriAI</span>
        </div>

        <div className="dash-search">
          <input placeholder="Search..." />
        </div>

        <div className="dash-header-right">
          <button
            className="icon-btn add-meal-btn"
            onClick={() => setIsMealSidebarOpen(true)}
            title="Add Meal"
          >
            ➕ Add Meal
          </button>
          <button className="icon-btn">🔔</button>
          <button className="icon-btn">⚙️</button>

          <button
            className="avatar-btn"
            onClick={onOpenProfile}
            title={user?.full_name || "User"}
          >
            {user ? getInitials(user.full_name) : "U"}
          </button>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Welcome */}
      {user && (
        <div
          style={{
            padding: "16px 24px",
            background: "#fff",
            borderBottom: "1px solid #ececec",
          }}
        >
          <h2 style={{ fontSize: "20px", margin: 0 }}>
            Welcome back, {user.full_name}! 👋
          </h2>
          <p style={{ fontSize: "14px", color: "#777", margin: "4px 0 0 0" }}>
            {user.email}
          </p>
        </div>
      )}

      {/* Main scrollable content */}
      <main className="dash-main">
        {/* Left column: meal plan */}
        <section className="card meal-plan-card">
          <h2 className="card-title">Personalized Meal Plan</h2>

          <div className="todays-meals">
            <h3>Today's Meals</h3>
            <p><strong>Breakfast:</strong> Oatmeal with berries</p>
            <p><strong>Lunch:</strong> Quinoa salad</p>
            <p><strong>Dinner:</strong> Baked salmon with roasted vegetables</p>
          </div>

          <div className="weekly-overview">
            <h3>Weekly Overview</h3>

            <div className="weekly-table">
              <div className="weekly-row weekly-row-head">
                <span>Day</span>
                <span>Breakfast</span>
                <span>Lunch</span>
                <span>Dinner</span>
              </div>

              {[
                ["Monday", "Oatmeal with berries", "Quinoa salad", "Baked salmon with roasted vegetables"],
                ["Tuesday", "Scrambled eggs", "Lentil soup", "Chicken stir-fry with brown rice"],
                ["Wednesday", "Yogurt parfait", "Tuna sandwich", "Vegetarian lasagna"],
                ["Thursday", "Smoothie bowl", "Chicken Caesar wrap", "Beef stew with sweet potatoes"],
                ["Friday", "Whole wheat toast", "Leftover lasagna", "Homemade pizza with whole wheat crust"],
                ["Saturday", "Pancakes with fruit", "Sushi rolls", "Grilled chicken with corn on the cob"],
                ["Sunday", "Avocado toast", "Spinach and feta omelet", "Roasted chicken with rosemary potatoes"],
              ].map(([day, b, l, d]) => (
                <div className="weekly-row" key={day}>
                  <span>{day}</span>
                  <span>{b}</span>
                  <span>{l}</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right column */}
        <aside className="card expiry-card">
          <h2 className="card-title">Leftovers &amp; Expiry Tracker</h2>

          <div className="expiry-table">
            <div className="expiry-row expiry-head">
              <span>Item</span>
              <span>Qty</span>
              <span>Expiry</span>
              <span>Status</span>
            </div>

            {[
              ["Chicken Breast", "200g", "2 days", "Expiring Soon"],
              ["Spinach", "150g", "1 day", "Expiring Soon"],
              ["Tomatoes", "3 pcs", "5 days", "Fresh"],
              ["Milk", "500ml", "Today", "Expired"],
              ["Potatoes", "500g", "7 days", "Fresh"],
            ].map(([item, qty, expiry, status]) => (
              <div className="expiry-row" key={item}>
                <span>{item}</span>
                <span>{qty}</span>
                <span>{expiry}</span>
                <span
                  className={
                    status === "Expired"
                      ? "status-pill status-danger"
                      : status === "Expiring Soon"
                      ? "status-pill status-warn"
                      : "status-pill status-ok"
                  }
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* Bottom grid */}
        <section className="bottom-grid">
          <div className="card">
            <h2 className="card-title">Recipe Recommendations</h2>
            <div className="card-grid">
              <RecipeCard title="Spicy Tofu Stir-fry" desc="A quick and flavorful vegetarian dish." img="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80" />
              <RecipeCard title="Classic Chicken Curry" desc="A comforting aromatic curry." img="https://images.unsplash.com/photo-1604908176997-1251884b08a3?auto=format&fit=crop&w=600&q=80" />
              <RecipeCard title="Veggie Pasta Primavera" desc="Light and fresh pasta." img="https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80" />
              <RecipeCard title="Hearty Beef Stew" desc="Slow-cooked to perfection." img="https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=600&q=80" />
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">Cultural &amp; Nepali Recipes</h2>
            <RecipeRow title="Authentic Dal Bhat" desc="The staple meal of Nepal." img="https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80" />
            <RecipeRow title="Steamed Momos" desc="Nepali dumplings with chutney." img="https://images.unsplash.com/photo-1600628421055-4bb3afe8f96e?auto=format&fit=crop&w=600&q=80" />
          </div>

          <div className="card">
            <h2 className="card-title">Budget-Friendly Suggestions</h2>
            <ul className="tips-list">
              <li>Plan meals around seasonal produce.</li>
              <li>Use versatile ingredients.</li>
              <li>Batch cook and reuse leftovers.</li>
              <li>Track expiry dates.</li>
              <li>Grow herbs at home.</li>
            </ul>
          </div>
        </section>

        <section className="card marketplace-card">
          <h2 className="card-title">Homecooked Meal Marketplace</h2>
          <div className="card-grid marketplace-grid">
            <MarketplaceCard title="Homemade Chicken Biryani" cook="Aisha's Kitchen" price="$12.50" img="https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80" />
            <MarketplaceCard title="Vegan Lentil Lasagna" cook="Green Goodness" price="$11.00" img="https://images.unsplash.com/photo-1604908176997-1251884b08a3?auto=format&fit=crop&w=600&q=80" />
            <MarketplaceCard title="Palak Paneer & Naan" cook="Chef Rahul" price="$10.00" img="https://images.unsplash.com/photo-1625944229409-2c7020e4e0aa?auto=format&fit=crop&w=600&q=80" />
            <MarketplaceCard title="Lemon Herb Grilled Fish" cook="Ocean Delights" price="$14.00" img="https://images.unsplash.com/photo-1516685018646-549198525c1b?auto=format&fit=crop&w=600&q=80" />
          </div>
        </section>

        <footer className="dash-footer">
          <span>© 2025 NutriAI. All rights reserved.</span>
          <span className="footer-right">
            Made with <span className="visily-logo">Visily</span>
          </span>
        </footer>
      </main>

      <MealSidebar
        isOpen={isMealSidebarOpen}
        onClose={() => setIsMealSidebarOpen(false)}
      />
    </div>
  );
}

/* Helper components (unchanged UI) */

function RecipeCard({ title, desc, img }) {
  return (
    <div className="recipe-card">
      <img src={img} alt={title} />
      <div className="recipe-body">
        <h4>{title}</h4>
        <p>{desc}</p>
      </div>
    </div>
  );
}

function RecipeRow({ title, desc, img }) {
  return (
    <div className="recipe-row">
      <img src={img} alt={title} />
      <div className="recipe-row-body">
        <h4>{title}</h4>
        <p>{desc}</p>
      </div>
    </div>
  );
}

function MarketplaceCard({ title, cook, price, img }) {
  return (
    <div className="market-card">
      <img src={img} alt={title} />
      <div className="market-body">
        <h4>{title}</h4>
        <p className="market-cook">Cook: {cook}</p>
        <p className="market-price">{price}</p>
      </div>
    </div>
  );
}
