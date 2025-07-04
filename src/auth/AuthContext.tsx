import React, { createContext, useState, useContext } from 'react';

interface AuthContextType {
    token: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);

    const login = async (email: string, password: string) => {
        try {
            const res = await fetch('http://localhost:4000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!res.ok) return false;
            const data = await res.json();
            setToken(data.token);
            return true;
        } catch {
            return false;
        }
    };

    const logout = () => {
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
