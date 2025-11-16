// HomePage.jsx
import Sidebar from "../components/Sidebar";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext.jsx";
import { translations } from "../translations";

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const { language } = useLanguage();
  const t = translations[language];
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const location = useLocation();

  // Get user-specific keys
  const getChatHistoryKey = () => {
    return user?._id ? `sana_chat_history_${user._id}` : "sana_chat_history";
  };

  const getCurrentChatKey = () => {
    return user?._id ? `sana_current_chat_${user._id}` : "sana_current_chat";
  };

  const getCurrentChatIdKey = () => {
    return user?._id ? `sana_current_chat_id_${user._id}` : "sana_current_chat_id";
  };

  // Load chat history from localStorage
  const loadChatHistory = () => {
    try {
      const key = getChatHistoryKey();
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Save chat history to localStorage
  const saveChatHistory = (history) => {
    try {
      const key = getChatHistoryKey();
      localStorage.setItem(key, JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save chat history:", error);
    }
  };

  // Save current chat to localStorage
  const saveCurrentChat = (chatMessages) => {
    try {
      if (chatMessages.length > 0) {
        const key = getCurrentChatKey();
        localStorage.setItem(key, JSON.stringify(chatMessages));
      }
    } catch (error) {
      console.error("Failed to save current chat:", error);
    }
  };

  // Load a specific chat from history
  const loadChatFromHistory = (chatId) => {
    const history = loadChatHistory();
    const chat = history.find((c) => c.id === chatId);
    if (chat) {
      setMessages(chat.messages || []);
      // Save current chat ID to localStorage for tracking
      const key = getCurrentChatIdKey();
      localStorage.setItem(key, chatId.toString());
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Track previous user ID to detect user changes
  const prevUserIdRef = useRef(null);
  
  // Clear messages when user changes (different user logs in)
  useEffect(() => {
    if (user?._id && prevUserIdRef.current !== null && prevUserIdRef.current !== user._id) {
      // User has changed - clear messages
      setMessages([]);
    }
    prevUserIdRef.current = user?._id;
  }, [user?._id]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0 && user?._id) {
      saveCurrentChat(messages);
    }
  }, [messages, user?._id]);

  // Clear messages when navigating with ?new=1
  useEffect(() => {
    if (!user?._id) return; // Wait for user to be loaded
    
    const params = new URLSearchParams(location.search);
    if (params.get("new") === "1") {
      setMessages([]);
      localStorage.removeItem(getCurrentChatKey());
      localStorage.removeItem(getCurrentChatIdKey());
    } else {
      // Check if we should load a specific chat from history
      const chatId = params.get("chatId");
      if (chatId) {
        loadChatFromHistory(parseInt(chatId));
      } else {
        // Try to load current chat if exists
        try {
          const currentChat = localStorage.getItem(getCurrentChatKey());
          if (currentChat) {
            setMessages(JSON.parse(currentChat));
          }
        } catch {
          // Ignore errors
        }
      }
    }
  }, [location.search, user?._id]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim() === "") return;

    const messageText = inputValue.trim();
    const isNewChat = messages.length === 0;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: "user",
      timestamp: new Date().toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");

    // If this is a new chat, save it to history
    if (isNewChat) {
      const chatId = Date.now();
      const history = loadChatHistory();
      const newChat = {
        id: chatId,
        title: messageText.length > 30 ? messageText.substring(0, 30) + "..." : messageText,
        messages: [],
        createdAt: new Date().toISOString(),
      };
      history.unshift(newChat);
      // Keep only last 50 chats
      if (history.length > 50) {
        history.splice(50);
      }
      saveChatHistory(history);
    }

    // Simulate AI response after a short delay
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        text: language === 'ar' 
          ? "شكراً على رسالتك! أنا هنا للمساعدة. كيف يمكنني خدمتك اليوم؟" 
          : "Thank you for your message! I'm here to help. How can I assist you today?",
        sender: "ai",
        timestamp: new Date().toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      // Update chat history with complete conversation
      if (isNewChat) {
        const history = loadChatHistory();
        if (history.length > 0) {
          history[0].messages = finalMessages;
          saveChatHistory(history);
        }
      } else {
        // Update existing chat in history
        const history = loadChatHistory();
        const currentChatId = location.search.includes("chatId=") 
          ? new URLSearchParams(location.search).get("chatId")
          : localStorage.getItem(getCurrentChatIdKey());
        if (currentChatId) {
          const chatIndex = history.findIndex((c) => c.id === parseInt(currentChatId));
          if (chatIndex !== -1) {
            history[chatIndex].messages = finalMessages;
            saveChatHistory(history);
          }
        }
      }
    }, 1000);
  };


  return (
    <div className="min-h-screen bg-[#272727] text-white font-normal flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Sidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      
      {/* Main Content */}
      <main className={`flex-1 flex flex-col transition-all duration-500 ${menuOpen ? (language === 'ar' ? 'mr-80' : 'ml-80') : (language === 'ar' ? 'mr-16' : 'ml-16')}`}>
        
        {/* Welcome Section - Show only when no messages */}
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 px-4">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#2AC0DA] via-[#CEE9E8] to-[#48A07D] bg-clip-text text-transparent">
              {language === 'ar' ? `مرحبًا، ${user?.name ?? '...'}` : `Welcome, ${user?.name ?? '...'}`}
            </h2>
            <p className="text-2xl md:text-3xl text-gray-300">
              {t.howCanIHelp}
            </p>
          </div>
        ) : (
          /* Chat Messages */
          <div className="flex-1 overflow-y-auto px-4 py-8 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xl md:max-w-2xl lg:max-w-3xl rounded-2xl px-6 py-4 ${
                    message.sender === 'user'
                      ? 'bg-[#343434] text-white'
                      : 'border-2 border-[#2AC0DA] bg-transparent text-white'
                  }`}
                >
                  <p className="text-lg whitespace-pre-wrap break-words">{message.text}</p>
                  <span className="text-xs text-gray-400 mt-2 block">{message.timestamp}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Chat Input - Fixed at bottom */}
        <div className="w-full flex justify-center pb-8 px-4">
          <div className="w-full max-w-xl md:max-w-2xl lg:max-w-5xl">
            <div className="p-[2px] bg-gradient-to-r from-[#2AC0DA] via-[#CEE9E8] to-[#48A07D] rounded-full">
              <form onSubmit={handleSendMessage} className="w-full flex items-center bg-[#272727] rounded-full">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={t.chatPlaceholder}
                  className="flex-1 bg-transparent px-6 py-4 text-lg opacity-50 outline-none placeholder:opacity-50"
                />
                <button
                  type="submit"
                  className="px-6 hover:opacity-70 transition-opacity"
                >
                  <svg 
                    className={`w-6 h-6 ${language === 'ar' ? 'transform rotate-45' : 'transform -rotate-45'}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}