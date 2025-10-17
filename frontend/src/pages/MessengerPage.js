import React, { useState, useEffect, useRef } from 'react';
import { messengerAPI } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Paperclip } from 'lucide-react';

const MessengerPage = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await messengerAPI.getMessages();
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      await messengerAPI.sendMessage({ content: newMessage });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('content', newMessage || 'Sent a file');

    setLoading(true);
    try {
      await messengerAPI.sendMediaMessage(formData);
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="h-[calc(100vh-12rem)]">
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-full">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.sender_type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  {message.media_url && (
                    <div className="mt-2">
                      {message.media_type === 'image' ? (
                        <img
                          src={`${process.env.REACT_APP_BACKEND_URL}${message.media_url}`}
                          alt="Uploaded"
                          className="rounded max-w-full"
                        />
                      ) : (
                        <a
                          href={`${process.env.REACT_APP_BACKEND_URL}${message.media_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-300 underline text-sm"
                        >
                          View file
                        </a>
                      )}
                    </div>
                  )}
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              type="file"
              id="fileInput"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,video/*"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => document.getElementById('fileInput').click()}
              disabled={loading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessengerPage;