import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase'; // adjust path as needed
import { TouchableOpacity } from 'react-native';
import { useChat } from '../context/ChatContext';
import config from '../views/config';

export default function ChatOverlay({ onClose }) {

  const flatListRef = useRef('');

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const { chatRecipient, setChatRecipient, mySupabaseId, providerMessages, setProviderMessages, providerSupabaseIds, hasBooking } = useChat();

  const [chatProviders, setChatProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);

   useEffect(() => {
    console.log('hasBooking status:', hasBooking);
    if (chatRecipient) {
      setSelectedProvider(chatRecipient);
    }
  }, [chatRecipient]);

  useEffect(() => {
    if (chatRecipient) {
      setSelectedProvider(chatRecipient);
    }
  }, [chatRecipient]);
  
  useEffect(() => {
    if (hasBooking && chatRecipient && mySupabaseId) {
      fetchMessages();
    }
  }, [hasBooking, chatRecipient, mySupabaseId]);

  useEffect(() => {
    const getProviderNamesFromSupabaseIds = async () => {
      if (!providerSupabaseIds || providerSupabaseIds.length === 0) return;
  
      try {
        const response = await fetch(`${config.apiUrl}/providers/get-provider-names-from-supabase-ids`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ providerSupabaseIds }),
        });
  
        const data = await response.json();
        if (!response.ok) {
          console.error('Error fetching provider names:', data?.message || response.statusText);
          return;
        }
  
        // data should be an array of { id, name }
        setChatProviders(data);
      } catch (error) {
        console.error('Error fetching provider names:', error);
      }
    };
  
    if (hasBooking) {
      getProviderNamesFromSupabaseIds();
    }
  }, [providerSupabaseIds, hasBooking]);
  
    const fetchMessages = async () => {
        if (!hasBooking) {
          console.warn('Cannot fetch messages: No booking exists');
          return;
        }
        if (!chatRecipient || !mySupabaseId) {
          console.warn('Missing chatRecipient or mySupabaseId');
          return;
        }
      
        try {
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(
              `and(sender_id.eq.${mySupabaseId.id},receiver_id.eq.${chatRecipient.id}),and(sender_id.eq.${chatRecipient.id},receiver_id.eq.${mySupabaseId.id})`
            )
            .order('created_at', { ascending: true });
      
          if (error) {
            console.error('Error fetching messages:', error);
          } else {
            console.log('Fetched messages:', data);
            setMessages(data);
          }
        } catch (err) {
          console.error('Unexpected error fetching messages:', err);
        }
      };
    

  // const fetchMessages = async () => {
  //   const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
  //   if (data) setMessages(data);
  // };


  const sendMessage = async () => {
      if (!hasBooking) {
      console.warn('Cannot send message: No booking exists');
      return;
    }
    if (!newMessage.trim() || !chatRecipient || !mySupabaseId) {
      console.warn('Cannot send message: missing content, recipient, or sender');
      return;
    }

    try {
      const { error } = await supabase.from('messages').insert([
        {
          sender_id: mySupabaseId.id,
          receiver_id: chatRecipient.id,
          content: newMessage.trim(),
        },
      ]);

      if (error) {
        console.error('Error sending message:', error);
      } else {
        setNewMessage('');
        console.log('Message sent successfully');
        fetchMessages();
      }
    } catch (err) {
      console.error('Unexpected error sending message:', err);
    }
  };

  if (!hasBooking) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.chatWrapper}>
        <View style={styles.chatContainer}>
          <Text style={styles.noRecipientText}>You need a booking to chat with this provider.</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeChatButton}>
            <Text style={styles.closeChatButtonText}>Close Chat</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }
  if (!chatRecipient || !mySupabaseId) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.chatWrapper}>
        <View style={styles.chatContainer}>
          <Text style={styles.noRecipientText}>Please select a provider to start chatting.</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeChatButton}>
            <Text style={styles.closeChatButtonText}>Close Chat</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.chatWrapper}>
      <View style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const isMe = item.sender_id === mySupabaseId.id;
            const senderName = isMe ? `${mySupabaseId.name} (me)` : chatRecipient.name || 'Provider';

            return (
              <Text style={[styles.message, isMe ? styles.myMessage : styles.otherMessage]}>
                {senderName}: {item.content}
              </Text>
            );
          }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        {chatProviders.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 10 }}>
            {chatProviders.map((provider) => {
              const isSelected = selectedProvider?.id === provider.id;

              return (
                <TouchableOpacity
                  key={provider.id}
                  style={{
                    backgroundColor: isSelected ? '#a0d2eb' : '#ddd',
                    padding: 10,
                    margin: 5,
                    borderRadius: 5,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? '#0077b6' : '#ccc',
                  }}
                  onPress={() => {
                    setSelectedProvider(provider);
                    setChatRecipient(provider);
                  }}
                >
                  <Text style={{ fontWeight: isSelected ? 'bold' : 'normal' }}>{provider.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <View style={styles.inputContainer}>
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            style={styles.input}
            placeholder="Type a message..."
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeChatButton}>
          <Text style={styles.closeChatButtonText}>Close Chat</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  chatWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  chatContainer: {
    marginTop: 260,
    marginBottom: 50,
    marginHorizontal: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    flex: 1,
    overflow: 'hidden',
  },
  closeChatButton: {
    backgroundColor: '#e8987c',
    padding: 10,
  },
  closeChatButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 18,
  },
  sendButton: {
    backgroundColor: '#e8987c',
    padding: 10,
    borderRadius: 5,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 18,
  },
  message: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  myMessage: {
    backgroundColor: '#e0f7fa',
    alignSelf: 'flex-end',
    borderRadius: 10,
    margin: 5,
  },
  otherMessage: {
    backgroundColor: '#f5f5f5',
    alignSelf: 'flex-start',
    borderRadius: 10,
    margin: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    marginRight: 10,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  noRecipientText: {
    padding: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
});
