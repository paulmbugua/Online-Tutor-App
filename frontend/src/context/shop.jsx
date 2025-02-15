import { createContext, useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from 'axios';
import { toast } from 'react-toastify';

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [language, setLanguage] = useState('EN');
    const [chats, setChats] = useState([]);
    const [userId, setUserId] = useState(null);
    const [isSocketReady, setIsSocketReady] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [userEmail, setUserEmail] = useState(null); 
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const navigate = useNavigate();
    const [tokens, setTokens] = useState(0);

    const socket = useMemo(() => {
        if (token) {
            return io(backendUrl, { query: { token }, autoConnect: false });
        }
        return null;
    }, [backendUrl, token]);

    const fetchUserDetails = async () => {
    try {
        const response = await axios.get(`${backendUrl}/api/user/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Response from API:', response.data);

        if (response.data) {
            const { userId, email, tokens } = response.data; // Destructure the response

            // Set context states for userId, email, and tokens
            if (userId) {
                setUserId(userId);
                console.log('User ID set in context:', userId);
            }
            if (email) setUserEmail(email);
            if (tokens !== undefined) setTokens(tokens);

        } else {
            console.warn('Invalid response: missing user details.');
        }
    } catch (error) {
        console.error('Error fetching user details:', error.response?.data || error.message);
    }
};


    useEffect(() => {
        if (socket && token && userId) {
            socket.connect();
            socket.on("connect", () => {
                setIsSocketReady(true);
                socket.emit("joinRoom", String(userId));
                console.log("Socket connected with userId:", userId);
            });

            // Handle incoming messages and update unread count for the recipient
            socket.on("messageReceived", (data) => {
                const { recipientId, senderId, content, senderName, unread } = data;
            
                // Only process if current user is the recipient
                if (String(recipientId) === String(userId)) {
                    setChats((prevChats) => {
                        const updatedChats = [...prevChats];
                        const chatIndex = updatedChats.findIndex(
                            (chat) => String(chat.userId) === String(senderId)
                        );
            
                        if (chatIndex > -1) {
                            updatedChats[chatIndex].messages.push({ user: senderName, content, unread });
                            if (unread) updatedChats[chatIndex].unreadCount += 1;
                        } else {
                            updatedChats.push({
                                userId: String(senderId),
                                messages: [{ user: senderName, content, unread }],
                                unreadCount: unread ? 1 : 0,
                                avatar: 'default-avatar.png',
                            });
                        }
                        return updatedChats;
                    });
            
                    // Increment the global unread count
                    if (unread) {
                        setUnreadMessagesCount((prevCount) => prevCount + 1);
                    }
                }
            });
            
            socket.on("disconnect", () => {
                setIsSocketReady(false);
                console.log("Socket disconnected");
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [socket, userId, token]);

    useEffect(() => {
        if (token) {
            console.log('Fetching user details...');
            fetchUserDetails();
        }
    }, [token]);
    
    useEffect(() => {
        console.log('Updated userEmail in context:', userEmail);
    }, [userEmail]);
    

    const fetchConversations = useCallback(async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/profileActions/conversations`, {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            if (response.data && response.data.conversations) {
                const formattedConversations = response.data.conversations.map((conv) => ({
                    recipientId: conv.recipientId,
                    user: conv.user,
                    avatar: conv.avatar || 'default-avatar.png',
                    messages: conv.lastMessage ? [conv.lastMessage] : [],
                    unreadCount: conv.unreadCount || 0 // Use unreadCount from backend
                }));
    
                const initialUnreadCount = formattedConversations.reduce((total, chat) =>
                    total + (chat.unreadCount || 0), 0 // Sum unreadCount across conversations
                );
                setUnreadMessagesCount(initialUnreadCount);
                console.log("Initial unreadMessagesCount from fetchConversations:", initialUnreadCount);
                setChats(formattedConversations);
            }
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
        }
    }, [backendUrl, token]);

    useEffect(() => {
        if (token) {
            console.log("Fetching conversations after login...");
            fetchConversations();
        }
    }, [token, fetchConversations]);
    
    
    const fetchMessages = async (recipientId, limit = 20, offset = 0) => {
        if (!token || !recipientId) return;
        try {
            const response = await axios.get(`${backendUrl}/api/profileActions/conversations/${recipientId}/messages`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { limit, offset },
            });

            setChats((prevChats) => {
                const updatedChats = [...prevChats];
                const chatIndex = updatedChats.findIndex((chat) => String(chat.recipientId) === String(recipientId));
                if (chatIndex > -1) {
                    updatedChats[chatIndex].messages = response.data.messages || [];
                } else {
                    updatedChats.push({
                        recipientId: String(recipientId),
                        messages: response.data.messages || [],
                        avatar: 'default-avatar.png',
                    });
                }
                return updatedChats;
            });
        } catch (error) {
            console.error("Failed to fetch messages:", error);
            toast.error("Failed to load messages. Please try again.");
        }
    };

    const sendMessage = ({ recipientId, content }) => {
        if (!token || !userId) {
            toast.error("You need to be logged in to send messages.");
            return;
        }
    
        if (isSocketReady && socket) {
            // Send the message via the socket
            socket.emit("sendMessage", {
                recipientId: String(recipientId),
                content,
                senderId: String(userId), // Include sender ID
                unread: true, // Mark as unread for recipient
            });
    
            // Optimistically update the chats state
            setChats((prevChats) => {
                const updatedChats = [...prevChats];
                const chatIndex = updatedChats.findIndex(
                    (chat) => String(chat.recipientId) === String(recipientId)
                );
    
                const newMessage = {
                    sender: { _id: userId }, // Explicitly set the sender
                    content,
                    timestamp: new Date().toISOString(),
                    unread: false, // Not unread for the sender
                };
    
                if (chatIndex > -1) {
                    updatedChats[chatIndex].messages.push(newMessage);
                } else {
                    updatedChats.push({
                        recipientId,
                        messages: [newMessage],
                        avatar: "default-avatar.png",
                    });
                }
    
                return updatedChats;
            });
        }
    };
    
      
    

      const markAsRead = async (recipientId) => {
        if (isSocketReady && socket) {
            socket.emit("markAsRead", { userId: String(recipientId), senderId: String(userId) });
        }
    
        // Find the unread count specifically for this chat
        const unreadCountForChat = chats
            .find(chat => String(chat.recipientId) === String(recipientId))
            ?.unreadCount || 0;
        
        // Update the unreadMessagesCount to reflect the changes
        setUnreadMessagesCount((prevCount) => Math.max(prevCount - unreadCountForChat, 0));
    
        // Update the chats state to mark messages in this chat as read
        setChats((prevChats) =>
            prevChats.map((chat) =>
                String(chat.recipientId) === String(recipientId)
                    ? { ...chat, unreadCount: 0, messages: chat.messages.map((msg) => ({ ...msg, unread: false })) }
                    : chat
            )
        );
    
        try {
            await axios.post(`${backendUrl}/api/profileActions/conversations/${recipientId}/markAsRead`, null, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Failed to mark messages as read:", error);
        }
    };
    

    
    const updateToken = (newToken) => {
        setToken(newToken);
        if (newToken) localStorage.setItem('token', newToken);
        else logout();
    };

    const logout = () => {
        setToken('');
        setUserId(null);
        setUserEmail(null);
        setIsSocketReady(false);
        localStorage.removeItem('token');
        navigate('/login');
    };

    const value = {
        backendUrl,
        token,
        language,
        setToken: updateToken,
        toggleLanguage: () => setLanguage((prev) => (prev === 'EN' ? 'FR' : 'EN')),
        logout,
        chats,
        setChats,
        socket,
        userEmail,
        tokens,
        markAsRead,
        sendMessage,
        fetchMessages,
        fetchConversations,
        userId,
        loadingProfile,
        isSocketReady,
        unreadMessagesCount,
    };

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    );
};

export default ShopContextProvider;
