import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users,setUsers]=useState([]);
    const [selectedUser,setSelectedUser]=useState(null);
    const [unseenMessages,setUnseenMessages]=useState({});
    const {socket,axios}=useContext(AuthContext);

    const getUsers=async()=>{
        try{
            const {data}=await axios.get('/api/messages/users');
            if(data.success){
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
            }
        }catch(error){
            toast.error("Failed to load users for chat sidebar");
            console.error("Error fetching users:",error);
        }
    };

    const getMessages=async(userId)=>{
        try{
            const {data}=await axios.get(`/api/messages/${userId}`);

            if(data.success){
                getMessages(data.messages);
            }
        }catch(error){
            toast.error("Failed to load messages");
            console.error("Error fetching messages:",error);
        }
    };

    const sendMessage=async(messageData)=>{
        try{
            const {data}=await axios.post(`/api/messages/send${selectedUser._id}`,messageData);
            if(data.success){
                getMessages((prevMessages)=>[...prevMessages,data.newMessage]);
            }else{
                toast.error(data.message);
            }

        }catch(error){
            toast.error("Failed to send message");
            console.error("Error sending message:",error);
        }
    }

    const subscribeToNewMessages=()=>{
        if(!socket)return;

        socket.on("newMessage", (newMessage) => {
            if (selectedUser && newMessage.senderId === selectedUser._id ) {
                newMessage.seen=true;
                getMessages((prevMessages) => [...prevMessages, newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`);

            } else {
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages,[newMessage.senderId]: 
                    (prevUnseenMessages[newMessage.senderId] )? prevUnseenMessages[newMessage.senderId] + 1 : 1,
                }));
            }
        });
    };
    const unsubcribeFromNewMessages=()=>{
        if(!socket)return;
        socket.off("newMessage");
    }

    useEffect(() => {
        subscribeToNewMessages();
        return () => {
            unsubcribeFromNewMessages();
        };
    }, [socket, selectedUser]);

    const value = {
        messages,
        getMessages,
        users,
        selectedUser,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
        getUsers,
        sendMessage,
    };



  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );

};