import React, { useState } from "react";
import { Link } from "react-router-dom";
import LanguageSelector from "../components/LanguageSelector";

export default function ForgotPasswordPage() {

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (!email.trim()) {
      setError("Email address is required");
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        // In development, show the token
        if (data.token) {
          setMessage(
            `${data.message}\n\nDevelopment Mode: Use this link to reset your password:\n` +
            `/admin/reset-password?token=${data.token}`
          );
        }
      } else {
        setError(data.error || "Failed to send reset instructions");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-warm-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-sage-600 to-sage-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl text-white">🛡️</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you instructions to reset your password
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex justify-center">
          <LanguageSelector variant="compact" />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
                {message}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yourrestaurant.com"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sage-600 text-white py-3 px-4 rounded-lg hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-98 font-medium"
            >
              {loading ? "Sending..." : "Send Reset Instructions"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Remember your password?{" "}
              <Link
                to="/admin/login"
                className="text-sage-600 hover:text-sage-800 font-medium"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-6 p-4 bg-warm-gray-50 rounded-lg text-sm text-warm-gray-600">
          <p className="font-medium mb-2">Development Mode:</p>
          <p>Reset instructions will be displayed here instead of being sent via email.</p>
        </div>
      </div>
    </div>
  );
}