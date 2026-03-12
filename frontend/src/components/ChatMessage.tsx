import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Check, CheckCheck, Smile, Trash2, Edit2, MoreVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface ChatMessageProps {
  message: any;
  isMe: boolean;
  onReaction?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string, newText: string) => void;
  onDelete?: (messageId: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isMe, onReaction, onEdit, onDelete }) => {
  const { user } = useAuth();
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.message_text);
  const [showMenu, setShowMenu] = useState(false);
  
  const senderName = isMe ? user?.name : message.sender_id?.name || 'User';
  const avatarUrl = isMe ? user?.profile_picture : message.sender_id?.profile_picture;

  const handleReaction = async (emoji: string) => {
    try {
      await api.post(`/api/chat/messages/${message._id}/reaction`, { emoji });
      onReaction?.(message._id, emoji);
      setShowReactions(false);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    try {
      await api.put(`/api/chat/messages/${message._id}`, { message_text: editText });
      onEdit?.(message._id, editText);
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/chat/messages/${message._id}`);
      onDelete?.(message._id);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

  return (
    <div
      className={clsx(
        "flex w-full mb-3",
        isMe ? "justify-end" : "justify-start"
      )}
    >
      {!isMe && (
        <div className="w-8 h-8 rounded-full overflow-hidden mr-3 shrink-0 border border-slate-700 bg-slate-800 self-end mb-1 shadow-sm">
          <img src={avatarUrl || `https://ui-avatars.com/api/?name=${senderName}`} alt={senderName} className="w-full h-full object-cover" />
        </div>
      )}
      
      <div className={clsx(
        "max-w-[70%] px-4 py-3 rounded-2xl relative shadow-lg group",
        isMe 
          ? "bg-primary-600 text-white rounded-br-sm selection:bg-white/20" 
          : "bg-slate-800/80 text-slate-200 rounded-bl-sm border border-slate-700/30 backdrop-blur-sm"
      )}>
        {/* Message Content */}
        {isEditing && isMe ? (
          <div className="flex gap-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="Edit your message..."
              className="flex-1 bg-slate-700 text-white rounded px-2 py-1 text-sm"
            />
            <button
              onClick={handleEdit}
              className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <p className={clsx(
              "text-sm leading-relaxed whitespace-pre-wrap",
              message.is_deleted && "italic opacity-60"
            )}>
              {message.is_deleted ? '[Message deleted]' : message.message_text}
            </p>
            {message.edited_at && !message.is_deleted && (
              <span className="text-[10px] opacity-70 ml-1">(edited)</span>
            )}
          </>
        )}
        
        {/* Media Content */}
        {message.media_url && !message.is_deleted && (
          <div className="mt-2 rounded-xl overflow-hidden">
            {(message.message_type === 'image' || (!message.message_type && message.media_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i))) ? (
              <a href={message.media_url} target="_blank" rel="noreferrer">
                <img 
                  src={message.media_thumbnail || message.media_url} 
                  alt="Shared media" 
                  className="max-h-60 object-cover w-full rounded-xl hover:opacity-80 transition"
                />
              </a>
            ) : message.message_type === 'audio' || message.media_url?.match(/\.(mp3|ogg|wav|webm|m4a)$/i) ? (
              <audio controls src={message.media_url} className="w-full mt-1" />
            ) : (
              <a
                href={message.media_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs underline opacity-80 py-1"
              >
                📎 Download attachment
              </a>
            )}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.reactions.map((reaction: any, idx: number) => (
              <span key={idx} className="bg-slate-700 px-2 py-0.5 rounded-full text-xs">
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}

        {/* Footer info */}
        <div className={clsx(
          "flex items-center gap-1.5 mt-1.5 justify-between",
          isMe ? "text-primary-100" : "text-slate-500"
        )}>
          <span className="text-[10px] font-medium">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="flex gap-2">
            {isMe && (
              <div className="flex">
                {message.delivery_status === 'read' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Message Actions (visible on hover) */}
        {!message.is_deleted && (
          <div className={clsx(
            "absolute -top-8 right-0 flex gap-1 bg-slate-700 rounded-lg p-1 transition opacity-0 group-hover:opacity-100",
            isMe ? "group-hover:block" : "group-hover:block"
          )}>
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-1.5 hover:bg-slate-600 rounded text-white"
              title="React"
            >
              <Smile className="w-4 h-4" />
            </button>
            {isMe && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 hover:bg-slate-600 rounded text-white"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 hover:bg-red-600 rounded text-white"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Reaction Picker */}
        {showReactions && (
          <div className="absolute -top-12 left-0 bg-slate-700 rounded-lg p-2 flex gap-1 flex-wrap w-48">
            {reactionEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="text-xl hover:scale-125 transition"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {isMe && (
        <div className="w-8 h-8 rounded-full overflow-hidden ml-3 shrink-0 border border-slate-700 bg-slate-800 self-end mb-1 shadow-sm">
          <img src={avatarUrl || `https://ui-avatars.com/api/?name=${senderName}`} alt={senderName} className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
