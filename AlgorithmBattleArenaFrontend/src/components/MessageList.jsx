import { useEffect, useRef } from 'react';

const MessageList = ({ messages = [], currentUserEmail }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((message) => {
        const isOwnMessage = message.senderEmail === currentUserEmail;
        
        return (
          <div
            key={message.messageId}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                isOwnMessage
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {!isOwnMessage && (
                <div className="text-xs font-medium mb-1">
                  {message.senderName || message.senderEmail}
                </div>
              )}
              <div className="text-sm">{message.content}</div>
              <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                {formatTime(message.sentAt)}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;