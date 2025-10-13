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
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
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
        }),
      });

      if (res.ok) {
        // Redirect to login page with success message
        navigate(
          "/admin/login?message=Account created successfully! Please log in."
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="absolute top-4 right-4">
        <LanguageSelector variant="compact" />
      </div>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">MenuShield</h2>
          <p className="text-gray-600 mt-2">
            {t('createAccount')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
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
              Password
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
              Confirm Password
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Confirmation (placeholder)</label>
            <input
              type="text"
              name="emailConfirmation"
              value={formData.emailConfirmation}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500"
              placeholder="Enter code from email (not implemented)"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
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
          <h3 className="text-sm font-medium text-gray-800 mb-2">
            What you'll get:
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Manage your restaurant's allergy-safe menu</li>
            <li>• Generate QR codes for easy guest access</li>
            <li>• Help customers with dietary restrictions</li>
            <li>• Protect ingredient information privacy</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
