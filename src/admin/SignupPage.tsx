import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LanguageSelector from "../components/LanguageSelector";
import { useAdminTranslations } from "../hooks/useAdminTranslations";

export default function SignupPage() {
  const { t } = useAdminTranslations();
  const [formData, setFormData] = useState({
    restaurantName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    emailConfirmation: "",
    // New onboarding fields
    restaurantType: "",
    address: "",
    phone: "",
    acceptTerms: false,
    acceptMarketing: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Enhanced validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!formData.acceptTerms) {
      setError("You must accept the terms and conditions");
      return;
    }

    if (!formData.restaurantName.trim()) {
      setError("Restaurant name is required");
      return;
    }

    if (!formData.email.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName: formData.restaurantName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          emailConfirmation: formData.emailConfirmation,
          restaurantType: formData.restaurantType,
          address: formData.address,
          phone: formData.phone,
          acceptMarketing: formData.acceptMarketing,
        }),
      });

      if (res.ok) {
        // Redirect to login page with success message
        navigate(
          "/admin/login?message=Account created successfully! Please log in to get started."
        );
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create account");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-gray-50">
      <div className="absolute top-4 right-4">
        <LanguageSelector variant="compact" />
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-warm-gray-200 w-full max-w-2xl">
        <div className="text-center mb-5">
          <h2 className="text-2xl font-semibold text-warm-gray-800">MenuShield</h2>
          <p className="text-warm-gray-600 mt-1 text-sm">
            {t('createAccount')} - Set up your restaurant's allergy-safe menu
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded text-sm">
              {error}
            </div>
          )}

          {/* Restaurant Information Section */}
          <div className="bg-warm-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🏪</span>
              Restaurant Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name *</label>
                <input
                  type="text"
                  name="restaurantName"
                  required
                  value={formData.restaurantName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500"
                  placeholder="Your Restaurant Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Type</label>
                <select
                  name="restaurantType"
                  value={formData.restaurantType}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500"
                >
                  <option value="">Select type...</option>
                  <option value="fine-dining">Fine Dining</option>
                  <option value="casual">Casual Dining</option>
                  <option value="fast-food">Fast Food</option>
                  <option value="cafe">Café</option>
                  <option value="bar">Bar/Pub</option>
                  <option value="bakery">Bakery</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username (@username)</label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500"
                  placeholder="unique username for your restaurant"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500"
                  placeholder="Restaurant address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500"
                  placeholder="+46 123 456 789"
                />
              </div>
            </div>
          </div>

          {/* Account Information Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">👤</span>
              Account Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500"
                  placeholder="admin@yourrestaurant.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500"
                  placeholder="Confirm your password"
                />
              </div>
            </div>
          </div>

          {/* Terms and Preferences */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                required
              />
              <label className="text-sm text-gray-700">
                I accept the <a href="/terms" className="text-green-600 hover:text-green-800">Terms of Service</a> and <a href="/privacy" className="text-green-600 hover:text-green-800">Privacy Policy</a> *
              </label>
            </div>
            
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="acceptMarketing"
                checked={formData.acceptMarketing}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label className="text-sm text-gray-700">
                I'd like to receive tips, feature updates, and promotional emails
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sage-600 text-white py-2.5 px-4 rounded-lg hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium active:scale-98"
          >
            {loading ? "Creating Account..." : "Create Account & Get Started"}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-warm-gray-600 text-sm">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/admin/login")}
              className="text-green-600 hover:text-green-800 font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-800 mb-3">
            🇸🇪 Perfect for Swedish Restaurants:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">🛡️ Allergy Safety</h4>
              <ul className="space-y-1">
                <li>• Complete ingredient transparency</li>
                <li>• 14 EU allergen compliance</li>
                <li>• Real-time allergen filtering</li>
                <li>• Safe dining for all guests</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">💰 Business Benefits</h4>
              <ul className="space-y-1">
                <li>• QR code contactless menus</li>
                <li>• Swedish Krona (SEK) support</li>
                <li>• Multilingual (Swedish/English)</li>
                <li>• Increase customer confidence</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
