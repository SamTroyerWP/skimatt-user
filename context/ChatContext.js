import React, { createContext, useState, useContext } from 'react';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [chatRecipient, setChatRecipient] = useState('');
  const [mySupabaseId, setMySupabaseId] = useState(''); // 👈 new
  const [providerMessages, setProviderMessages] = useState([]);
  const [providerSupabaseIds, setProviderSupabaseIds] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [hasBooking, setHasBooking] = useState(false); // New state for booking status


  return (
    <ChatContext.Provider value={{
        chatRecipient,
        setChatRecipient,
        mySupabaseId,
        setMySupabaseId,
        providerMessages,
        setProviderMessages,
        providerSupabaseIds,
        setProviderSupabaseIds,
        showChat,
        setShowChat,
        hasBooking,
        setHasBooking,
      }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};