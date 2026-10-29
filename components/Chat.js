import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text } from 'react-native';
import { supabase } from '../lib/supabase';

const Chat = ({ userId, receiverId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true });
    if (!error) setMessages(data);
  };

  const sendMessage = async () => {
    if (input.trim()) {
      await supabase.from('messages').insert({
        sender_id: userId,
        receiver_id: receiverId,
        content: input.trim()
      });
      setInput('');
    }
  };

  useEffect(() => {
    fetchMessages();

    const subscription = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new;
          if (
            (msg.sender_id === userId && msg.receiver_id === receiverId) ||
            (msg.sender_id === receiverId && msg.receiver_id === userId)
          ) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text style={{ padding: 8, backgroundColor: item.sender_id === userId ? '#ccf' : '#eee', marginVertical: 4 }}>
            {item.content}
          </Text>
        )}
      />
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="Type a message..."
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <Button title="Send" onPress={sendMessage} />
    </View>
  );
};

export default Chat;
