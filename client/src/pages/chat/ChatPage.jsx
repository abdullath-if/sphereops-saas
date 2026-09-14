import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Users,
  FolderKanban,
  Send,
  Check,
  CheckCheck,
  Smile,
  Paperclip,
  Circle,
  Hash,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

export const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const initialUserId = searchParams.get('user');

  const [conversations, setConversations] = useState({ direct: [], channels: [] });
  const [activeChat, setActiveChat] = useState(null); // { type: 'direct' | 'project', id: string, name: string }
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const [roomKey, setRoomKey] = useState('');
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const { socket, isUserOnline, joinChat, leaveChat } = useSocket();
  const { showToast } = useToast();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch all conversations list
  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);

      // Auto-select initial conversation
      if (!activeChat) {
        if (initialUserId) {
          const directMatch = res.data.direct?.find((d) => d.user?._id === initialUserId);
          if (directMatch) {
            setActiveChat({
              type: 'direct',
              id: directMatch.user._id,
              name: directMatch.user.name,
              avatar: directMatch.user.avatar,
              position: directMatch.user.position,
            });
            return;
          }
        }

        if (res.data.channels?.length > 0) {
          const firstChan = res.data.channels[0];
          setActiveChat({
            type: 'project',
            id: firstChan.id,
            name: firstChan.project?.name,
          });
        } else if (res.data.direct?.length > 0) {
          const firstDirect = res.data.direct[0];
          setActiveChat({
            type: 'direct',
            id: firstDirect.user._id,
            name: firstDirect.user.name,
            avatar: firstDirect.user.avatar,
            position: firstDirect.user.position,
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages when activeChat changes
  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages?type=${activeChat.type}&targetId=${activeChat.id}`);
        setMessages(res.data.messages || []);
        setRoomKey(res.data.roomKey);
        joinChat(res.data.roomKey);
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    fetchMessages();

    return () => {
      if (roomKey) {
        leaveChat(roomKey);
      }
    };
  }, [activeChat]);

  // Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time socket message and typing handlers
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      // Check if message belongs to current active conversation
      const isCurrentDirect =
        activeChat?.type === 'direct' &&
        ((message.sender._id === activeChat.id && message.recipient === user._id) ||
          (message.sender._id === user._id && message.recipient === activeChat.id));

      const isCurrentProject =
        activeChat?.type === 'project' && message.project === activeChat.id;

      if (isCurrentDirect || isCurrentProject) {
        setMessages((prev) => [...prev, message]);
      } else {
        // Increment unread count in conversations list
        fetchConversations();
      }
    };

    const handleTypingStatus = ({ roomKey: rKey, userName, isTyping }) => {
      if (rKey === roomKey && userName !== user.name) {
        setTypingUser(isTyping ? userName : null);
      }
    };

    socket.on('message:receive', handleReceiveMessage);
    socket.on('typing:status', handleTypingStatus);

    return () => {
      socket.off('message:receive', handleReceiveMessage);
      socket.off('typing:status', handleTypingStatus);
    };
  }, [socket, activeChat, roomKey, user]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !roomKey) return;

    socket.emit('typing:start', { roomKey, userName: user.name });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { roomKey, userName: user.name });
    }, 1500);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const textToSend = newMessage;
    setNewMessage('');

    if (socket && roomKey) {
      socket.emit('typing:stop', { roomKey, userName: user.name });
    }

    try {
      await api.post('/messages', {
        conversationType: activeChat.type,
        recipient: activeChat.type === 'direct' ? activeChat.id : null,
        project: activeChat.type === 'project' ? activeChat.id : null,
        content: textToSend,
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] bg-white rounded-2xl border border-slate-200/80 shadow-sm flex overflow-hidden">
      {/* Left Chat Sidebar: Channels and Direct Messages */}
      <div className="w-80 border-r border-slate-200/80 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200/80">
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-600" />
            Team Communication
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Channels & Direct Messages</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Project Channels */}
          <div>
            <span className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Project Channels
            </span>
            <div className="space-y-1">
              {conversations.channels?.map((chan) => {
                const isActive = activeChat?.type === 'project' && activeChat.id === chan.id;

                return (
                  <button
                    key={chan.id}
                    onClick={() =>
                      setActiveChat({
                        type: 'project',
                        id: chan.id,
                        name: chan.project?.name,
                      })
                    }
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Hash className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{chan.project?.name}</span>
                    </div>
                    {chan.unreadCount > 0 && (
                      <span className="w-4 h-4 bg-brand-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                        {chan.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Messages */}
          <div>
            <span className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Direct Messages
            </span>
            <div className="space-y-1">
              {conversations.direct?.map((d) => {
                const isOnline = isUserOnline(d.user._id);
                const isActive = activeChat?.type === 'direct' && activeChat.id === d.user._id;

                return (
                  <button
                    key={d.user._id}
                    onClick={() =>
                      setActiveChat({
                        type: 'direct',
                        id: d.user._id,
                        name: d.user.name,
                        avatar: d.user.avatar,
                        position: d.user.position,
                      })
                    }
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="relative flex-shrink-0">
                        {d.user.avatar ? (
                          <img
                            src={d.user.avatar}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-7 h-7 rounded-full font-bold text-[10px] flex items-center justify-center ${
                              isActive ? 'bg-brand-700 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {d.user.name.charAt(0)}
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-2 ${
                            isActive ? 'ring-brand-600' : 'ring-white'
                          } ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        />
                      </div>
                      <div className="truncate text-left">
                        <span className="block truncate">{d.user.name}</span>
                        <span
                          className={`text-[10px] block truncate ${
                            isActive ? 'text-brand-100' : 'text-slate-400'
                          }`}
                        >
                          {d.lastMessage?.content || d.user.position}
                        </span>
                      </div>
                    </div>

                    {d.unreadCount > 0 && (
                      <span className="w-4 h-4 bg-brand-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                        {d.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeChat ? (
          <>
            {/* Chat Top Banner */}
            <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeChat.type === 'direct' ? (
                  <div className="relative">
                    {activeChat.avatar ? (
                      <img
                        src={activeChat.avatar}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-600 font-bold text-sm flex items-center justify-center">
                        {activeChat.name?.charAt(0)}
                      </div>
                    )}
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                        isUserOnline(activeChat.id) ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Hash className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {activeChat.name}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {activeChat.type === 'direct'
                      ? isUserOnline(activeChat.id)
                        ? 'Active now'
                        : 'Offline'
                      : 'Project Team Discussion Channel'}
                  </span>
                </div>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.sender?._id === user._id || msg.sender === user._id;

                return (
                  <div
                    key={msg._id}
                    className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-600 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {msg.sender?.avatar ? (
                          <img
                            src={msg.sender.avatar}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          msg.sender?.name?.charAt(0) || 'U'
                        )}
                      </div>
                    )}

                    <div className="max-w-md">
                      {!isMe && (
                        <span className="text-[10px] font-bold text-slate-500 ml-1 mb-0.5 block">
                          {msg.sender?.name}
                        </span>
                      )}
                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-brand-600 text-white rounded-br-none shadow-sm'
                            : 'bg-slate-100 text-slate-800 rounded-bl-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span
                        className={`text-[9px] text-slate-400 mt-1 block ${
                          isMe ? 'text-right' : 'text-left ml-1'
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {typingUser && (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-300" />
                  </div>
                  <span>{typingUser} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 flex gap-3">
              <input
                type="text"
                placeholder={`Message ${activeChat.name}...`}
                value={newMessage}
                onChange={handleTyping}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              />
              <Button type="submit" variant="primary" icon={Send} disabled={!newMessage.trim()}>
                Send
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
            Select a conversation to start messaging.
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
