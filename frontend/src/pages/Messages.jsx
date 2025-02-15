import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSmile, faBars, faTimes, faHome } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

const Messages = () => {
  const location = useLocation();
  const navigate = useNavigate();
const { token, fetchMessages, fetchConversations, chats, markAsRead, sendMessage, userId, socket } =
    useContext(ShopContext);
  const [activeChat, setActiveChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [messageOffset, setMessageOffset] = useState(0);
  const [contextMenu, setContextMenu] = useState(null);
  const messagesLimit = 20;
  const messageContainerRef = useRef(null);

  useEffect(() => {
    if (token) fetchConversations();
  }, [token]);

  useEffect(() => {
    if (activeChat) {
      const updatedActiveChat = chats.find(
        (chat) => String(chat.recipientId) === String(activeChat.recipientId)
      );
      if (updatedActiveChat && updatedActiveChat !== activeChat) setActiveChat(updatedActiveChat);
    }
  }, [chats]);

  useEffect(() => {
    if (messageContainerRef.current && activeChat) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [activeChat?.messages]);

  // WebSocket listeners for deletion events
  useEffect(() => {
    if (socket && activeChat) {
      socket.on('messageDeleted', ({ messageId, conversationId }) => {
        if (conversationId === activeChat._id) {
          setActiveChat((prevChat) => ({
            ...prevChat,
            messages: prevChat.messages.filter((msg) => msg._id !== messageId),
          }));
        }
      });
  
      socket.on('conversationDeleted', ({ conversationId }) => {
        if (conversationId === activeChat._id) {
          setActiveChat(null);
          fetchConversations();
        }
      });
  
      return () => {
        socket.off('messageDeleted');
        socket.off('conversationDeleted');
      };
    }
  }, [socket, activeChat]);
  

  useEffect(() => {
    const closeContextMenu = () => setContextMenu(null);
    document.addEventListener('click', closeContextMenu);
    return () => document.removeEventListener('click', closeContextMenu);
  }, []);

  const openChat = (chat) => {
    setActiveChat(chat);
    setMessageOffset(0);
    fetchMessages(chat.recipientId, messagesLimit, 0);
    setSidebarOpen(false);

    if (chat.messages.some((msg) => msg.unread && msg.sender._id !== userId)) {
      markAsRead(chat.recipientId);
    }
  };

  const loadMoreMessages = () => {
    if (activeChat) {
      const newOffset = messageOffset + messagesLimit;
      fetchMessages(activeChat.recipientId, messagesLimit, newOffset);
      setMessageOffset(newOffset);
    }
  };

  const handleScroll = () => {
    if (messageContainerRef.current?.scrollTop < 100) loadMoreMessages();
  };

  const handleSendMessage = () => {
    if (!token) {
      toast.error('You need to be logged in to send messages.');
      return;
    }

    if (newMessage.trim() && activeChat) {
      sendMessage({ recipientId: activeChat.recipientId, content: newMessage });
      setNewMessage('');

      setTimeout(() => {
        if (messageContainerRef.current) {
          messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
      }, 100);
    } else {
      toast.error("Message content can't be empty.");
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const studentId = queryParams.get('studentId');

    if (studentId) {
      // Find or open a chat with the specified studentId
      const existingChat = chats.find(chat => String(chat.recipientId) === studentId);
      if (existingChat) {
        setActiveChat(existingChat);
        fetchMessages(studentId, 20, 0); // Adjust limits as necessary
      } else {
        // Handle case where there's no existing chat
        toast.info('No existing chat found with this student. Start a new conversation.');
        navigate('/messages'); // Redirect to clear query params
      }
    }
  }, [location.search, chats, fetchMessages]);

    
  return (
    <div className="flex h-screen bg-gray-900 text-gray-200 font-sans relative">
      <Link to="/" className="absolute top-4 left-1/2 transform -translate-x-1/2 text-gray-400 hover:text-pink-500 transition-colors">
        <FontAwesomeIcon icon={faHome} className="text-2xl md:text-3xl opacity-80 hover:opacity-100" />
      </Link>

      <div className={`fixed inset-y-0 left-0 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 w-72 max-w-xs bg-gray-800 shadow-xl p-4 overflow-y-auto border-r border-gray-700 z-20`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-pink-500">Chats</h2>
          <button onClick={() => setSidebarOpen(false)} className="text-gray-400 md:hidden">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <ul className="space-y-4">
          {chats.length > 0 ? (
            chats.map((chat, index) => (
              <li
                key={`${chat.recipientId}-${index}`}
                onClick={() => openChat(chat)}
                className={`p-3 rounded-lg cursor-pointer transition ${chat.messages?.some((msg) => msg.unread && msg.sender._id !== userId) ? 'bg-gray-700' : 'bg-gray-800'} hover:bg-gray-700 shadow-sm`}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={chat.avatar || "/default-avatar.png"}
                    alt=" "
                    className="w-10 h-10 rounded-full border-2 border-pink-500"
                  />
                  <div className="flex-grow">
                    <span className="font-semibold text-pink-400">{chat.user || chat.recipientId}</span>
                    <p className="text-sm text-gray-400 truncate">
                      {chat.messages?.[chat.messages.length - 1]?.content || "Start a conversation"}
                    </p>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <p className="text-center text-gray-300">No chats available</p>
          )}
        </ul>
      </div>

      <div className="flex-grow flex flex-col bg-gray-900 md:ml-72">
        <div className="flex items-center justify-between p-4 bg-gray-800 shadow-lg border-b border-gray-700">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 md:hidden">
            <FontAwesomeIcon icon={faBars} />
          </button>

          {activeChat ? (
            <div className="absolute left-16 md:left-20 flex items-center space-x-3">
              <img src={activeChat.avatar || '/default-avatar.png'} alt="Recipient Avatar" className="w-8 h-8 rounded-full" />
              <h3 className="text-lg font-semibold text-pink-400">{activeChat.user || activeChat.recipientId}</h3>
            </div>
          ) : (
            <h3 className="text-lg font-semibold text-gray-400">Your Messages</h3>
          )}
          {activeChat && (
            <button onClick={() => setActiveChat(null)} className="text-gray-400 hover:text-gray-200">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>

        <div ref={messageContainerRef} onScroll={handleScroll} className="flex-grow p-4 overflow-y-auto bg-gray-800 space-y-3">
          {activeChat ? (
            <div className="space-y-3">
              {activeChat.messages?.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map((msg, index) => (
                <div
                  key={index}
                  onContextMenu={(e) => handleRightClick(e, msg)}
                  className={`flex ${msg?.sender?._id === userId ? 'justify-end' : 'justify-start'} transition-transform`}
                >
                  <div className={`${msg?.sender?._id === userId ? 'bg-pink-500 text-white' : 'bg-gray-700 text-gray-200'} px-4 py-2 rounded-lg max-w-xs shadow-lg`}>
                    <p className="text-sm">{msg?.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500">
              <p>Select a chat to view messages.</p>
            </div>
          )}
        </div>

        {contextMenu && (
          <div
            className="absolute bg-gray-800 text-gray-200 shadow-lg rounded-md z-50"
            style={{
              top: `${contextMenu.position.y}px`,
              left: `${contextMenu.position.x}px`,
            }}
          >
            <ul className="py-2">
              {contextMenuOptions.map((option, index) => (
                <li
                  key={index}
                  onClick={() => handleContextMenuSelect(option)}
                  className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                >
                  {option.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeChat && (
          <div className="p-4 bg-gray-800 shadow-xl flex items-center space-x-3 border-t border-gray-700">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow p-2 rounded-lg bg-gray-900 border border-gray-600 text-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none transition-shadow"
            />
            <button className="text-gray-400 hover:text-pink-500 transition">
              <FontAwesomeIcon icon={faSmile} />
            </button>
            <button
              onClick={handleSendMessage}
              className="bg-pink-500 text-white px-4 py-2 rounded-lg flex items-center shadow-lg hover:bg-pink-600 transition"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
