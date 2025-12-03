import { createContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
axios.defaults.baseURL = backendURL;

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [authUser, setAuthUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // Socket connection helper — server expects `userid` in handshake query
  const connectSocket = (userData) => {
    if (!userData) return;
    // if there's already a connected socket for this user, skip
    if (socket?.connected) return;

    // create socket and subscribe to server events
    const s = io(backendURL, { query: { userid: userData._id } });
    setSocket(s);
    s.on("online-users", (userIds) => setOnlineUsers(userIds || []));
  };


  const checkAuth = async () => {
    if (!token) return;
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        const u = data.user || data.userData || null;
        setAuthUser(u);
        connectSocket(u);
      }
    } catch (err) {
      toast.error("Session expired. Please login again.");
      setToken(null);
      setAuthUser(null);
      localStorage.removeItem("token");
    }
  };


  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["token"] = token;
      checkAuth();
    }
  }, [token]);

  // ✅ LOGIN & SIGNUP
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);

      if (data.success) {
        const u = data.user || data.userData || null;
        setAuthUser(u);
        connectSocket(u);
        axios.defaults.headers.common["token"] = data.token;
        setToken(data.token);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(u));
        toast.success("Login successful ✅");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error("An error occurred during login.");
    }
  };

  // ✅ UPDATE PROFILE
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/updateProfile", body);

      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Profile Update Error:", error);
      toast.error("Error while updating profile.");
    }
  };

  // ✅ LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    delete axios.defaults.headers.common["token"];
    socket?.disconnect();
    setSocket(null);
    toast.success("Logged out successfully");
  };

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    token,
    login,
    updateProfile,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
