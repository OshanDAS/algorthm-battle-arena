import { useState, useEffect } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const LobbyChatSidebar = ({ lobbyId, isOpen, onToggle }) => {
  const { user } = useAuth();
  const { conversations, messages, joinConversation, sendMessage, leaveConversation } = useChat();
  const [lobbyConversation, setLobbyConversation] = useState(null);

  useEffect(() => {
    // Find lobby conversation
    const conv = conversations.find(c => c.type === 'Lobby' && c.referenceId === parseInt(lobbyId));
    if (conv) {
      setLobbyConversation(conv);
      joinConversation(conv.conversationId);
    }

    return () => {
      if (conv) {
        leaveConversation(conv.conversationId);
      }
    };
  }, [conversations, lobbyId, joinConversation, leaveConversation]);

  const handleSendMessage = async (content) => {
    if (lobbyConversation) {
      await sendMessage(lobbyConversation.conversationId, content);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-l-lg shadow-lg z-40"
      >
        <MessageCircle size={20} />
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white/10 backdrop-blur-sm border-l border-white/20 flex flex-col z-40">
      {/* Header */}
      <div className="p-4 border-b border-white/20 flex justify-between items-center">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <MessageCircle size={16} />
          Lobby Chat
        </h3>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {lobbyConversation ? (
        <>
          <MessageList
            messages={messages[lobbyConversation.conversationId] || []}
            currentUserEmail={user?.email}
          />
          <MessageInput onSendMessage={handleSendMessage} />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <p>Loading chat...</p>
        </div>
      )}
    </div>
  );
};

export default LobbyChatSidebar;