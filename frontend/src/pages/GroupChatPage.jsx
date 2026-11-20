// frontend/src/pages/GroupChatPage.jsx
// Challenge Group Chat Powered Exclusively by MongoDB REST APIs

import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  RefreshCw, 
  ArrowLeft, 
  Database 
} from 'lucide-react';

export default function GroupChatPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [challenge, setChallenge] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const messagesEndRef = useRef(null);

  const fetchChatData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      const [challengeRes, chatRes] = await Promise.all([
        api.getChallengeById(id),
        api.getMessages(id),
      ]);

      if (challengeRes.success) {
        setChallenge(challengeRes.challenge);
      }
      if (chatRes.success) {
        setMessages(chatRes.messages || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load chat messages.');
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChatData();
  }, [id]);

  useEffect(() => {
    // Scroll to bottom when messages update
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      setSending(true);
      setError('');
      await api.sendMessage(id, inputText.trim());
      setInputText('');
      await fetchChatData();
    } catch (err) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.deleteMessage(messageId);
      // Remove locally immediately
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      setError(err.message || 'Failed to delete message.');
    }
  };

  return (
    <div className="page-container chat-page-container">
      <div className="back-link-wrapper">
        <Link to={`/challenges/${id}`} className="back-link">
          <ArrowLeft size={16} /> Back to Challenge Details
        </Link>
      </div>

      {/* Chat Header */}
      <div className="chat-header-bar">
        <div className="chat-title-group">
          <div className="chat-icon-badge">
            <MessageSquare size={22} />
          </div>
          <div>
            <h2>{challenge ? `${challenge.title} — Squad Chat` : 'Squad Chat'}</h2>
            <p className="chat-subtitle">
              Stored in <strong>MongoDB</strong> (Collection: <code>messages</code>). RESTful API sync.
            </p>
          </div>
        </div>

        <button 
          onClick={() => fetchChatData(true)} 
          className="btn btn-secondary btn-sm"
          disabled={refreshing}
          title="Fetch latest messages via GET /api/challenges/:id/messages"
        >
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          <span>{refreshing ? 'Syncing...' : 'Refresh Messages'}</span>
        </button>
      </div>

      {/* Academic Explanation Banner */}
      <div className="info-box chat-info-box">
        <Database size={18} />
        <div>
          <strong>MongoDB Secondary Database:</strong>
          <p>
            Unlike PostgreSQL tables, chat documents are saved in MongoDB with fields <code>{`{ challengeId, senderId, senderName, message, createdAt }`}</code>. This prevents chat volume from burdening the relational database.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Messages Scroll Area */}
      <div className="chat-box">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading squad messages from MongoDB...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty-state">
            <MessageSquare size={48} className="empty-icon" />
            <h3>No messages yet</h3>
            <p>Break the ice! Send a message to motivate your squad members.</p>
          </div>
        ) : (
          <div className="messages-stream">
            {messages.map((msg) => {
              const isMine = msg.isOwnMessage || msg.senderId === user?.id;
              return (
                <div 
                  key={msg.id} 
                  className={`message-bubble-wrapper ${isMine ? 'mine' : 'theirs'}`}
                >
                  <div className="message-sender-line">
                    <span className="sender-name">
                      {isMine ? 'You' : msg.senderName}
                    </span>
                    <span className="message-time">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  <div className="message-bubble">
                    <p>{msg.message}</p>
                    {isMine && (
                      <button 
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="btn-delete-msg" 
                        title="Delete this message"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Message Input Bar */}
        <form onSubmit={handleSendMessage} className="chat-input-bar">
          <input
            type="text"
            placeholder="Type your message to the squad..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
            maxLength={1000}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={sending || !inputText.trim()}>
            <Send size={16} />
            <span>{sending ? 'Sending...' : 'Send'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
