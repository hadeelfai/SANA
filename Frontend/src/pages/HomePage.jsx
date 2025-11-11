// HomePage.jsx
import Sidebar from "../components/Sidebar";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../translations";

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const { language } = useLanguage();
  const t = translations[language];
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim() === "") return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
      timestamp: new Date().toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

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
      setMessages(prev => [...prev, aiMessage]);
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
              {t.welcomeName}
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