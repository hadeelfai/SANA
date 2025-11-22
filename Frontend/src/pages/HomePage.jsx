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
  const [isLoading, setIsLoading] = useState(false);
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
    if (!history || history.length === 0) {
      console.warn("No chat history found");
      setMessages([]);
      return;
    }
    
    // Try both string and number comparison since IDs might be stored differently
    const chatIdStr = chatId?.toString();
    const chatIdNum = typeof chatId === 'string' ? parseInt(chatId) : chatId;
    
    const chat = history.find((c) => {
      if (!c || !c.id) return false;
      const cIdStr = c.id.toString();
      const cIdNum = typeof c.id === 'string' ? parseInt(c.id) : c.id;
      return c.id === chatId || c.id === chatIdNum || cIdStr === chatIdStr || cIdNum === chatIdNum;
    });
    
    if (chat) {
      // Check if chat has messages array
      if (chat.messages && Array.isArray(chat.messages) && chat.messages.length > 0) {
        setMessages(chat.messages);
        // Save current chat ID to localStorage for tracking
        const key = getCurrentChatIdKey();
        localStorage.setItem(key, chatIdStr);
        // Also save current chat
        saveCurrentChat(chat.messages);
      } else {
        console.warn("Chat found but has no messages:", chatId, chat);
        setMessages([]);
      }
    } else {
      console.warn("Chat not found in history:", chatId, "Available IDs:", history.map(c => c.id));
      setMessages([]);
    }
  };

  // Clear current chat messages
  const handleClearMessages = () => {
    setMessages([]);
    localStorage.removeItem(getCurrentChatKey());
    localStorage.removeItem(getCurrentChatIdKey());
    // Navigate to home without chatId param to ensure fresh start
    if (location.search.includes("chatId=")) {
      window.history.replaceState({}, "", "/home?new=1");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Track previous user ID to detect user changes and sign-in
  const prevUserIdRef = useRef(null);
  const hasClearedOnSignInRef = useRef(false);
  
  // Clear messages when user signs in (fresh sign-in, not just page refresh)
  useEffect(() => {
    if (user?._id) {
      // Check if this is a fresh sign-in (user wasn't loaded before)
      if (prevUserIdRef.current === null) {
        // Fresh sign-in - clear current chat and start new
        setMessages([]);
        localStorage.removeItem(getCurrentChatKey());
        localStorage.removeItem(getCurrentChatIdKey());
        hasClearedOnSignInRef.current = true;
      } else if (prevUserIdRef.current !== user._id) {
        // Different user logged in - clear messages
        setMessages([]);
        localStorage.removeItem(getCurrentChatKey());
        localStorage.removeItem(getCurrentChatIdKey());
        hasClearedOnSignInRef.current = true;
      }
      prevUserIdRef.current = user._id;
    }
  }, [user?._id]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0 && user?._id) {
      saveCurrentChat(messages);
    }
  }, [messages, user?._id]);

  // Handle URL params for new chat or loading specific chat
  useEffect(() => {
    if (!user?._id) return;
    // Save current chat before switching
    try {
      const currentChatId = localStorage.getItem(getCurrentChatIdKey());
      if (currentChatId && messages.length > 0) {
        const history = loadChatHistory();
        const idx = history.findIndex(
          (c) => c.id?.toString() === currentChatId.toString()
        );
        if (idx !== -1) {
          history[idx].messages = messages;
          saveChatHistory(history);
        }
      }
    } catch {}

    const params = new URLSearchParams(location.search);
    if (params.get("new") === "1") {
      setMessages([]);
      localStorage.removeItem(getCurrentChatKey());
      localStorage.removeItem(getCurrentChatIdKey());
      hasClearedOnSignInRef.current = false;
    } else {
      // Check if we should load a specific chat from history
      const chatId = params.get("chatId");
      if (chatId) {
        const chatIdNum = parseInt(chatId);
        loadChatFromHistory(isNaN(chatIdNum) ? chatId : chatIdNum);
      } else if (!hasClearedOnSignInRef.current) {
        setMessages([]);
      }
    }
  }, [location.search, user?._id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputValue.trim() === "" || isLoading) return;

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
    setIsLoading(true);

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

    try {
      // Call the backend RAG endpoint
      const response = await fetch("/api/v1/rag/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ question: messageText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || "Failed to get response from AI";
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.answer) {
        throw new Error(data.message || data.error || "No answer received from AI");
      }
      
      const aiAnswer = data.answer;

      const aiMessage = {
        id: Date.now() + 1,
        text: aiAnswer,
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
    } catch (error) {
      console.error("Error getting AI response:", error);
      
      // Create a more helpful error message
      let errorText = error.message || (language === 'ar' 
        ? "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى." 
        : "Sorry, there was an error connecting. Please try again.");
      
      // Check if it's a service unavailable error
      if (error.message && error.message.includes("unavailable")) {
        errorText = language === 'ar'
          ? "خدمة الذكاء الاصطناعي غير متوفرة حالياً. يرجى التأكد من تشغيل خدمة Python RAG."
          : "AI service is currently unavailable. Please ensure the Python RAG service is running on port 5001.";
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: "ai",
        timestamp: new Date().toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-xl md:max-w-2xl lg:max-w-3xl rounded-2xl px-6 py-4 border-2 border-[#2AC0DA] bg-transparent text-white">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[#2AC0DA] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-[#2AC0DA] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-[#2AC0DA] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-gray-400">
                      {language === 'ar' ? 'جاري الكتابة...' : 'Typing...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
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
                  disabled={isLoading}
                  className="flex-1 bg-transparent px-6 py-4 text-lg opacity-50 outline-none placeholder:opacity-50 disabled:opacity-30"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 hover:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
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