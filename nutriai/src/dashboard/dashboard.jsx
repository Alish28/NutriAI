import "./dashboard.css";

export default function Dashboard({ onLogout, onOpenProfile }) {
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
          <button className="icon-btn">🔔</button>
          <button className="icon-btn">⚙️</button>
          <button className="avatar-btn" onClick={onOpenProfile}>
            NA
          </button>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main scrollable content */}
      <main className="dash-main">
        {/* Left column: meal plan */}
        <section className="card meal-plan-card">
          <h2 className="card-title">Personalized Meal Plan</h2>

          <div className="todays-meals">
            <h3>Today's Meals</h3>
            <p>
              <strong>Breakfast:</strong> Oatmeal with berries
            </p>
            <p>
              <strong>Lunch:</strong> Quinoa salad
            </p>
            <p>
              <strong>Dinner:</strong> Baked salmon with roasted vegetables
            </p>
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

        {/* Right column: leftovers */}
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

        {/* Bottom section: 3 columns */}
        <section className="bottom-grid">
          {/* Recipe recommendations */}
          <div className="card">
            <h2 className="card-title">Recipe Recommendations</h2>
            <div className="card-grid">
              <RecipeCard
                title="Spicy Tofu Stir-fry"
                desc="A quick and flavorful vegetarian dish with crisp tofu and fresh vegetables."
                img="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80"
              />
              <RecipeCard
                title="Classic Chicken Curry"
                desc="A comforting aromatic curry, perfect with basmati rice."
                img="https://images.unsplash.com/photo-1604908176997-1251884b08a3?auto=format&fit=crop&w=600&q=80"
              />
              <RecipeCard
                title="Veggie Pasta Primavera"
                desc="Light and fresh pasta with seasonal vegetables."
                img="https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80"
              />
              <RecipeCard
                title="Hearty Beef Stew"
                desc="Slow-cooked to perfection, ideal for a cold evening."
                img="https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=600&q=80"
              />
            </div>
          </div>

          {/* Cultural & Nepali recipes */}
          <div className="card">
            <h2 className="card-title">Cultural &amp; Nepali Recipes</h2>
            <div className="card-column">
              <RecipeRow
                title="Authentic Dal Bhat"
                desc="The staple meal of Nepal, rich in flavor and nutrition."
                img="https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80"
              />
              <RecipeRow
                title="Steamed Momos"
                desc="Delicious Nepali dumplings served with spicy tomato chutney."
                img="https://images.unsplash.com/photo-1600628421055-4bb3afe8f96e?auto=format&fit=crop&w=600&q=80"
              />
            </div>
          </div>

          {/* Budget-friendly suggestions */}
          <div className="card">
            <h2 className="card-title">Budget-Friendly Suggestions</h2>
            <ul className="tips-list">
              <li>Plan meals around weekly sales and seasonal produce.</li>
              <li>Use versatile ingredients like eggs, rice, and beans for multiple meals.</li>
              <li>Cook in batches and repurpose leftovers for lunches.</li>
              <li>Track expiry dates to minimize food waste.</li>
              <li>Grow herbs at home to save money and add fresh flavor.</li>
            </ul>
          </div>
        </section>

        {/* Marketplace */}
        <section className="card marketplace-card">
          <h2 className="card-title">Homecooked Meal Marketplace</h2>
          <div className="card-grid marketplace-grid">
            <MarketplaceCard
              title="Homemade Chicken Biryani"
              cook="Aisha's Kitchen"
              price="$12.50"
              img="https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80"
            />
            <MarketplaceCard
              title="Vegan Lentil Lasagna"
              cook="Green Goodness"
              price="$11.00"
              img="https://images.unsplash.com/photo-1604908176997-1251884b08a3?auto=format&fit=crop&w=600&q=80"
            />
            <MarketplaceCard
              title="Spicy Palak Paneer & Naan"
              cook="Chef Rahul"
              price="$10.00"
              img="https://images.unsplash.com/photo-1625944229409-2c7020e4e0aa?auto=format&fit=crop&w=600&q=80"
            />
            <MarketplaceCard
              title="Lemon Herb Grilled Fish"
              cook="Ocean Delights"
              price="$14.00"
              img="https://images.unsplash.com/photo-1516685018646-549198525c1b?auto=format&fit=crop&w=600&q=80"
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="dash-footer">
          <span>© 2025 NutriAI. All rights reserved.</span>
          <span className="footer-right">
            Made with <span className="visily-logo">Visily</span>
          </span>
        </footer>
      </main>
    </div>
  );
}

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
