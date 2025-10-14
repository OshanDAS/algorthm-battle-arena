import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import chatSignalR from '../services/chatSignalR';
import { getToken } from '../services/tokenStorage';

export const useChat = () => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.chat.getConversations();
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load messages for conversation
  const loadMessages = useCallback(async (conversationId) => {
    try {
      const response = await api.chat.getMessages(conversationId);
      setMessages(prev => ({
        ...prev,
        [conversationId]: response.data.reverse()
      }));
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (conversationId, content) => {
    try {
      await chatSignalR.sendMessage(conversationId, content);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, []);

  // Join conversation
  const joinConversation = useCallback(async (conversationId) => {
    setActiveConversation(conversationId);
    await chatSignalR.joinConversation(conversationId);
    await loadMessages(conversationId);
  }, [loadMessages]);

  // Leave conversation
  const leaveConversation = useCallback(async (conversationId) => {
    await chatSignalR.leaveConversation(conversationId);
    if (activeConversation === conversationId) {
      setActiveConversation(null);
    }
  }, [activeConversation]);

  // Handle incoming messages
  useEffect(() => {
    const unsubscribe = chatSignalR.onReceiveMessage((message) => {
      setMessages(prev => ({
        ...prev,
        [message.conversationId]: [...(prev[message.conversationId] || []), message]
      }));
    });

    return unsubscribe;
  }, []);

  // Initialize chat service
  useEffect(() => {
    const initializeChat = async () => {
      try {
        await chatSignalR.start();
        await loadConversations();
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      }
    };

    // Only initialize if we have a token
    const token = getToken();
    if (token) {
      initializeChat();
    }

    return () => {
      chatSignalR.stop();
    };
  }, [loadConversations]);

  return {
    conversations,
    messages,
    activeConversation,
    loading,
    sendMessage,
    joinConversation,
    leaveConversation,
    loadConversations
  };
};