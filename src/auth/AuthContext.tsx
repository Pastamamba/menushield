import React, { createContext, useState, useContext } from "react";

interface AuthContextType {
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(() => {
    // Initialize from localStorage if available
    return localStorage.getItem("authToken");
  });

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login with:", email); // Debug log
      console.log("Making request to:", "/api/login"); // Debug log
      
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("Login response status:", res.status); // Debug log
      console.log("Login response headers:", Object.fromEntries(res.headers)); // Debug log

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Login failed with status:", res.status, "Response:", errorText); // Debug log
        return false;
      }

      const data = await res.json();
      console.log(
        "Login successful, token received:",
        data.token?.substring(0, 20) + "..."
      ); // Debug log
      setToken(data.token);
      localStorage.setItem("authToken", data.token);
      return true;
    } catch (error) {
      console.error("Login error:", error); // Debug log
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("authToken");
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
