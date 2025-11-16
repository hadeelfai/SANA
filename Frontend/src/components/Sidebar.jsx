// Sidebar.jsx
import { useState, useEffect } from "react";
import {Link, useNavigate} from "react-router-dom"; // ADD THIS at the top

import {
    Edit,
    Headphones,
    LayoutGrid,
    User,
    Globe,
    Settings,
    ChevronUp,
    Menu,
    Search,
    X,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../translations";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Sidebar({ menuOpen, setMenuOpen }) {
    const [ticketsOpen, setTicketsOpen] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const { language, toggleLanguage } = useLanguage();
    const t = translations[language];
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    // Get user-specific chat history key
    const getChatHistoryKey = () => {
        return user?._id ? `sana_chat_history_${user._id}` : "sana_chat_history";
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

    // Update chat history when component mounts or when menu opens
    useEffect(() => {
        if (menuOpen && user?._id) {
            const history = loadChatHistory();
            setChatHistory(history);
            if (!searchQuery.trim()) {
                setFilteredHistory(history);
            }
        }
    }, [menuOpen, user?._id]);

    // Refresh chat history when storage changes (for cross-tab updates)
    useEffect(() => {
        if (!menuOpen || !user?._id) return;
        
        const chatHistoryKey = getChatHistoryKey();
        
        const handleStorageChange = (e) => {
            if (e.key === chatHistoryKey) {
                const history = loadChatHistory();
                setChatHistory(history);
                if (!searchQuery.trim()) {
                    setFilteredHistory(history);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        // Also check periodically for same-tab updates
        const interval = setInterval(() => {
            const history = loadChatHistory();
            if (history.length !== chatHistory.length) {
                setChatHistory(history);
                if (!searchQuery.trim()) {
                    setFilteredHistory(history);
                }
            }
        }, 2000); // Check every 2 seconds

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [menuOpen, searchQuery, chatHistory.length, user?._id]);

    // Get user's initial letter
    const getUserInitial = () => {
        if (!user?.name) return "U";
        return user.name.charAt(0).toUpperCase();
    };

    // Search functionality
    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            setFilteredHistory(chatHistory);
            return;
        }

        const query = searchQuery.toLowerCase().trim();
        const filtered = chatHistory.filter((chat) => {
            // Search in title
            if (chat.title?.toLowerCase().includes(query)) return true;
            // Search in messages
            if (chat.messages) {
                return chat.messages.some((msg) =>
                    msg.text?.toLowerCase().includes(query)
                );
            }
            return false;
        });
        setFilteredHistory(filtered);
    };

    // Update filtered history when search query changes
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredHistory(chatHistory);
        } else {
            const query = searchQuery.toLowerCase().trim();
            const filtered = chatHistory.filter((chat) => {
                // Search in title
                if (chat.title?.toLowerCase().includes(query)) return true;
                // Search in messages
                if (chat.messages) {
                    return chat.messages.some((msg) =>
                        msg.text?.toLowerCase().includes(query)
                    );
                }
                return false;
            });
            setFilteredHistory(filtered);
        }
    }, [searchQuery, chatHistory]);

    // Load a chat from history
    const loadChat = (chatId) => {
        navigate(`/home?chatId=${chatId}`);
        setSearchOpen(false);
        setSearchQuery("");
    };


    return (
        <>
            <aside
                className={`fixed ${language === 'ar' ? 'right-0' : 'left-0'} top-0 h-full bg-[#343434] border-${language === 'ar' ? 'l' : 'r'} border-[#3a3a3a] flex flex-col justify-between transition-all duration-500 ease-out z-50
        ${menuOpen ? "w-80 px-6" : "w-16 items-center px-0"}`}
            >
                {/* Top section */}
                <div className="flex flex-col space-y-6 mt-6">

                    {/* Menu Button and Search */}
                    <div className="flex items-center justify-between gap-3 px-3">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="hover:text-gray-400 transition"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        {menuOpen && !searchOpen && (
                            <button
                                onClick={() => setSearchOpen(true)}
                                className="hover:text-gray-400 transition"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Search Bar */}
                    {menuOpen && searchOpen && (
                        <form onSubmit={handleSearch} className="flex items-center gap-2 px-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchOpen(false);
                                    setSearchQuery("");
                                    setFilteredHistory(chatHistory);
                                }}
                                className="hover:text-gray-400 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                }}
                                placeholder={language === 'ar' ? 'ابحث في المحادثات...' : 'Search chats...'}
                                className="flex-1 bg-[#272727] text-white px-3 py-1.5 rounded-lg outline-none focus:ring-2 focus:ring-[#2AC0DA] transition text-sm"
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="hover:text-gray-400 transition"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        </form>
                    )}


                    {/* New Chat */}
                    <button
                        onClick={() => navigate("/home?new=1")}
                        className="flex items-center gap-4 hover:bg-[#272727] rounded-lg transition px-3 py-2"
                    >
                        <Edit className="w-5 h-5" />
                        {menuOpen && <span className="text-white opacity-50 text-lg">{t.newChat}</span>}
                    </button>


                    {/* Tickets */}
                    <div className="space-y-1 w-full">
                        <div className="flex items-center justify-between hover:bg-[#272727] rounded-lg transition px-3 py-2 w-full">
                            <div className="flex items-center gap-4 flex-1">
                                {/* Headphones icon navigates to New Ticket page */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate("/tickets/new");
                                    }}
                                    className="hover:opacity-80"
                                    aria-label="New Ticket"
                                >
                                    <Headphones className="w-5 h-5" />
                                </button>
                                {menuOpen && (
                                    <button
                                        onClick={() => setTicketsOpen(!ticketsOpen)}
                                        className="flex items-center justify-between flex-1 text-left"
                                    >
                                        <span className="text-white opacity-50 text-lg">{t.ticketSystem}</span>
                                        <ChevronUp
                                            className={`w-5 h-5 text-white opacity-50 transition-transform ${ticketsOpen ? "" : "rotate-180"
                                                }`}
                                        />
                                    </button>
                                )}
                            </div>
                        </div>

                        {menuOpen && ticketsOpen && (
                            <div
                                className={
                                    language === "ar" ? "mr-9 space-y-1" : "ml-9 space-y-1"
                                }
                            >
                                {/* NEW TICKET navigates to TicketPage */}
                                <Link
                                    to="/tickets/new"
                                    className={
                                        language === "ar"
                                            ? "text-md text-white opacity-50 block w-full text-right hover:bg-[#272727] rounded-lg transition px-3 py-1.5"
                                            : "text-md text-white opacity-50 block w-full text-left hover:bg-[#272727] rounded-lg transition px-3 py-1.5"
                                    }
                                >
                                    {t.newTicket}
                                </Link>

                                {/* MY TICKETS  */}
                                <Link
                                    to="/tickets"
                                    className={
                                        language === "ar"
                                            ? "text-md text-white opacity-50 block w-full text-right hover:bg-[#272727] rounded-lg transition px-3 py-1.5"
                                            : "text-md text-white opacity-50 block w-full text-left hover:bg-[#272727] rounded-lg transition px-3 py-1.5"
                                    }
                                >
                                    {t.myTickets}
                                </Link>
                            </div>
                        )}
                    </div>



                    {user?.role === "admin" ? (
                        <button
                            onClick={() => navigate("/dashboard/admin")}
                            className="flex items-center gap-4 hover:bg-[#272727] rounded-lg transition px-3 py-2 w-full text-left"
                        >
                            <LayoutGrid className="w-5 h-5" />
                            {menuOpen && <span className="text-white opacity-50 text-lg">{t.adminDashboard}</span>}
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate("/dashboard/employee")}
                            className="flex items-center gap-4 hover:bg-[#272727] rounded-lg transition px-3 py-2 w-full text-left"
                        >
                            <LayoutGrid className="w-5 h-5" />
                            {menuOpen && <span className="text-white opacity-50 text-lg">{t.employeeStats}</span>}
                        </button>
                    )}

                    {menuOpen && (
                        <button
                            onClick={() => navigate("/profile")}
                            className="flex items-center gap-4 hover:bg-[#272727] rounded-lg transition px-3 py-2"
                        >
                            {/* Profile icon with user's initial */}
                            <div className="w-5 h-5 rounded-full bg-[#2AC0DA] flex items-center justify-center text-xs font-semibold text-white leading-none">
                                <span className="text-center">{getUserInitial()}</span>
                            </div>
                            <span className="text-white opacity-50 text-lg">{t.profile}</span>
                        </button>
                    )}

                    {menuOpen && (
                        <div className="pt-4 border-t border-[#404040]">
                            <h3 className="text-lg text-white px-2 pb-2">{t.recent}</h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {filteredHistory.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-white opacity-30">
                                        {searchQuery.trim() 
                                            ? (language === 'ar' ? 'لا توجد نتائج' : 'No results found')
                                            : (language === 'ar' ? 'لا توجد محادثات سابقة' : 'No chat history')
                                        }
                                    </div>
                                ) : (
                                    filteredHistory.map((chat, index) => (
                                        <button
                                            key={chat.id || index}
                                            onClick={() => loadChat(chat.id)}
                                            className={`w-full text-left px-3 py-2 hover:bg-[#272727] rounded-lg text-sm font-thin text-white opacity-50 transition ${
                                                index === 0 && !searchQuery.trim()
                                                    ? 'border border-teal-400 p-[2px] bg-gradient-to-r from-[#2AC0DA] via-[#CEE9E8] to-[#48A07D] rounded-lg'
                                                    : ''
                                            }`}
                                        >
                                            <div className={index === 0 && !searchQuery.trim() ? 'px-3 py-2 bg-[#343434] hover:bg-[#272727] rounded-lg' : ''}>
                                                {chat.title || (language === 'ar' ? 'محادثة جديدة' : 'New Chat')}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col space-y-2 mb-4 relative">
                    {settingsOpen && (
                        <div className={`absolute bottom-full mb-2 ${language === 'ar' ? 'right-0' : 'left-0'} bg-[#3E3E3E] shadow-md rounded-lg overflow-hidden w-60`}>
                            <button
                                onClick={toggleLanguage}
                                className="flex gap-3 px-3 py-2 hover:bg-[#272727] transition w-full"
                            >
                                <Globe className="w-5 h-5" />
                                <span className="text-white opacity-50">{t.language}: {language === 'ar' ? 'العربية' : 'English'}</span>
                            </button>
                            <button onClick={logout} className={`text-white opacity-50 block w-full text-${language === 'ar' ? 'right' : 'left'} px-4 py-2 hover:bg-[#272727] transition text-sm border-t border-[#272727]`}>
                                {t.logout}
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            if (!menuOpen) {
                                setMenuOpen(true);
                                setSettingsOpen(true);
                            } else {
                                setSettingsOpen(!settingsOpen);
                            }
                        }}
                        className="flex items-center gap-4 hover:bg-[#272727] rounded-lg transition px-3 py-2"
                    >
                        <Settings className="w-5 h-5" />
                        {menuOpen && <span className="text-white opacity-50">{t.settings}</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}