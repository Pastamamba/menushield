import React, { createContext, useState, useContext } from "react";

interface User {
  userId: string;
  email: string;
  restaurantId: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

// Helper function to parse JWT token
const parseJWT = (token: string): User | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.userId,
      email: payload.email,
      restaurantId: payload.restaurantId,
      role: payload.role
    };
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
};

// Helper function to get restaurant slug by ID
const getRestaurantSlug = async (restaurantId: string): Promise<string | null> => {
  try {
    const response = await fetch(`/api/restaurants/${restaurantId}`);
    if (!response.ok) return null;
    const restaurant = await response.json();
    return restaurant.slug || null;
  } catch (error) {
    console.error('Error fetching restaurant slug:', error);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(() => {
    // Initialize from localStorage if available
    return localStorage.getItem("authToken");
  });
  
  const [user, setUser] = useState<User | null>(() => {
    const storedToken = localStorage.getItem("authToken");
    return storedToken ? parseJWT(storedToken) : null;
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
      
      const userData = parseJWT(data.token);
      if (!userData) {
        console.error('Failed to parse user data from token');
        return false;
      }
      
      setToken(data.token);
      setUser(userData);
      localStorage.setItem("authToken", data.token);
      return true;
    } catch (error) {
      console.error("Login error:", error); // Debug log
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("authToken");
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
