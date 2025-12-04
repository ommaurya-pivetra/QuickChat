import { createContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendURL = import.meta.env.VITE_BACKEND_URL ;
axios.defaults.baseURL = backendURL;

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // Socket connection helper — server expects `userid` in handshake query
  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;

    const newSocket = io(backendURL, { query: { userid: userData._id, } });

    newSocket.connect();
    setSocket(newSocket);
    newSocket.on("online-users", (userIds) => setOnlineUsers(userIds));
  };


  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (err) {
      toast.error(err.message);
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
   
        setAuthUser(data.user);
        connectSocket(data.user);
        axios.defaults.headers.common["token"] = data.token;
        setToken(data.token);
        localStorage.setItem("token", data.token);
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
      const { data } = await axios.put("/api/auth/update-profile", body);

      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
         localStorage.setItem("user", JSON.stringify(data.user));
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
