// src/admin/LoginPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import LanguageSelector from "../components/LanguageSelector";
import { useAdminTranslations } from "../hooks/useAdminTranslations";

interface Restaurant {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
}

export default function LoginPage() {
  const { t } = useAdminTranslations();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for success message from signup
    const urlParams = new URLSearchParams(location.search);
    const message = urlParams.get("message");
    if (message) {
      setSuccessMessage(message);
    }
    
    // Fetch restaurants for selection
    fetchRestaurants();
  }, [location]);

  const fetchRestaurants = async () => {
    try {
      const response = await fetch('/api/restaurants');
      if (response.ok) {
        const restaurantData = await response.json();
        setRestaurants(restaurantData);
        // Auto-select first restaurant if only one available
        if (restaurantData.length === 1) {
          setSelectedRestaurant(restaurantData[0].slug);
        }
      } else {
        console.error('Failed to fetch restaurants');
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoadingRestaurants(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!selectedRestaurant) {
      setError("Please select a restaurant");
      return;
    }

    const ok = await login(email, password);
    if (ok) {
      // Check for redirect parameter first
      const urlParams = new URLSearchParams(location.search);
      const redirect = urlParams.get("redirect");
      
      if (redirect) {
        console.log("Login successful, navigating to redirect:", redirect);
        navigate(redirect);
        return;
      }
      
      // Navigate to selected restaurant admin
      const targetPath = `/r/${selectedRestaurant}/admin`;
      console.log("Login successful, navigating to:", targetPath);
      navigate(targetPath);
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-gray-50">
      <div className="absolute top-4 right-4">
        <LanguageSelector variant="compact" />
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-warm-gray-200 w-full max-w-sm">
        <div className="text-center mb-5">
          <h2 className="text-2xl font-semibold text-warm-gray-800">MenuShield</h2>
          <p className="text-warm-gray-600 mt-1 text-sm">{t('adminLogin')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2.5 rounded text-sm">
              {successMessage}
            </div>
          )}

          {/* Restaurant Selection */}
          <div>
            <label className="block text-sm font-medium text-warm-gray-700 mb-1">
              Restaurant
            </label>
            <div className="relative">
              {loadingRestaurants ? (
                <div className="w-full px-3 py-2 border border-warm-gray-300 rounded bg-warm-gray-50 text-warm-gray-500">
                  Loading restaurants...
                </div>
              ) : (
                <select
                  value={selectedRestaurant}
                  onChange={(e) => setSelectedRestaurant(e.target.value)}
                  className="w-full border border-warm-gray-300 rounded px-3 py-2 focus:outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500"
                  required
                >
                  <option value="">Select a restaurant</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.slug} value={restaurant.slug}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-gray-700 mb-1">
              {t('email')}
            </label>
            <input
              type="email"
              required
              className="w-full border border-warm-gray-300 rounded px-3 py-2 focus:outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-gray-700 mb-1">
              {t('password')}
            </label>
            <input
              type="password"
              required
              className="w-full border border-warm-gray-300 rounded px-3 py-2 focus:outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-sage-600 text-white py-2.5 px-4 rounded-lg hover:bg-sage-700 transition-all duration-200 active:scale-98 font-medium"
          >
            {t('login')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate("/admin/forgot-password")}
            className="text-sage-600 hover:text-sage-800 font-medium text-sm underline"
          >
            Forgot your password?
          </button>
        </div>

        <div className="mt-5 text-center">
          <p className="text-warm-gray-600 text-sm">
            {t('noAccount')}{" "}
            <button
              onClick={() => navigate("/admin/signup")}
              className="text-sage-600 hover:text-sage-800 font-medium"
            >
              {t('signUpHere')}
            </button>
          </p>
        </div>

        <div className="mt-4 p-3 bg-warm-gray-50 rounded text-sm text-warm-gray-600">
          <p className="font-medium mb-1">Demo Account:</p>
          <p>Email: admin@example.com</p>
          <p>Password: supersecret</p>
        </div>
      </div>
    </div>
  );
}
