import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Check, CheckCheck, Smile, Trash2, Edit2, MoreVertical, Paperclip, Clock, Mic } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getMediaUrl } from '../utils/imageUrl';

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
  const avatarUrl = isMe ? getMediaUrl(user?.profile_picture) : getMediaUrl(message.sender_id?.profile_picture);

  const handleReaction = async (emoji: string) => {
    try {
      const endpoint = message.group_id 
        ? `/api/groups/messages/${message._id}/reaction`
        : `/api/chat/messages/${message._id}/reaction`;
      
      const response = await api.post(endpoint, { emoji });
      // The parent component should handle the message update via socket or state
      onReaction?.(message._id, emoji);
      setShowReactions(false);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const reactionCounts = message.reactions?.reduce((acc: Record<string, number>, curr: any) => {
    acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
    return acc;
  }, {}) || {};

  const myReactions = message.reactions?.filter((r: any) => {
    const rUserId = r.userId?._id || r.userId;
    return rUserId?.toString() === user?._id?.toString();
  }).map((r: any) => r.emoji) || [];

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

  // Enhanced delivery status icons
  const DeliveryStatus = () => {
    if (!isMe) return null;
    const tickColor = user?.tick_color || '#38BDF8';
    
    if (message.delivery_status === 'read') {
      return (
        <CheckCheck 
          className="w-3.5 h-3.5 drop-shadow-sm" 
          strokeWidth={3} 
          style={{ color: tickColor }} 
        />
      );
    }
    if (message.delivery_status === 'sent') {
      return <Check className="w-3.5 h-3.5 text-white/60 drop-shadow-sm" strokeWidth={3} />;
    }
    return <Clock className="w-3 h-3 text-white/40" strokeWidth={3} />;
  };

  return (
    <div
      className={clsx(
        "flex w-full mb-6 px-1 md:px-2",
        isMe ? "justify-end" : "justify-start"
      )}
    >
      {!isMe && (
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-2xl overflow-hidden mr-3 shrink-0 border-2 border-white bg-slate-100 self-end mb-1 shadow-md cursor-pointer">
          <img src={avatarUrl || `https://ui-avatars.com/api/?name=${senderName}&background=0EA5E9&color=fff`} alt={senderName} className="w-full h-full object-cover" />
        </div>
      )}
      
      <div className={clsx(
        "max-w-[85%] md:max-w-[70%] group relative",
        isMe ? "flex flex-col items-end" : "flex flex-col items-start"
      )}>
        {/* Sender Name in groups */}
        {!isMe && message.sender_id?.name && (
          <span className="text-[11px] font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-widest leading-none">
            {message.sender_id.name}
          </span>
        )}

        <div className={clsx(
          "px-5 py-3.5 rounded-3xl relative shadow-xl shadow-slate-200/50 transition-all duration-300",
          isMe 
            ? "bg-gradient-to-br from-sky-400 to-sky-500 text-white rounded-br-md hover:shadow-sky-200/50" 
            : "bg-white text-slate-700 rounded-bl-md border border-slate-100/50 hover:shadow-slate-300/50"
        )}>
          {/* Message Content */}
          {isEditing && isMe ? (
            <div className="flex flex-col gap-3 min-w-[240px]">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Edit your message..."
                className="w-full bg-white/20 text-white rounded-2xl px-4 py-3 text-sm outline-none border border-white/30 placeholder:text-white/50 resize-none min-h-[80px]"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  className="bg-white text-sky-500 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-sky-600/20 active:scale-95 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className={clsx(
                "text-[15px] leading-[1.6] whitespace-pre-wrap font-medium tracking-tight",
                message.is_deleted && "italic opacity-60 line-through"
              )}>
                {message.is_deleted ? 'This message was deleted' : message.message_text}
              </p>
              
              {/* Media Content */}
              {message.media_url && !message.is_deleted && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-white/20 shadow-inner bg-slate-50">
                  {(message.message_type === 'image' || (!message.message_type && message.media_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i))) ? (
                    <a href={getMediaUrl(message.media_url)} target="_blank" rel="noreferrer" className="block">
                      <img 
                        src={getMediaUrl(message.media_thumbnail || message.media_url)} 
                        alt="Shared media" 
                        className="max-h-80 object-cover w-full rounded-2xl transition-transform hover:scale-[1.02] duration-500"
                      />
                    </a>
                  ) : (message.message_type === 'voice' || message.media_url?.match(/\.(mp3|ogg|wav|webm|m4a)$/i)) ? (
                    <div className="p-4 bg-slate-50/50 backdrop-blur-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                        <Mic className="w-5 h-5 text-sky-500" />
                      </div>
                      <audio 
                        controls 
                        src={getMediaUrl(message.media_url)} 
                        className="flex-1 h-8 custom-audio-player" 
                      />
                    </div>
                  ) : (
                    <a
                      href={getMediaUrl(message.media_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-4 bg-slate-50/50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                        <Paperclip className="w-5 h-5 text-sky-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">Download Attachment</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">File Share</p>
                      </div>
                    </a>
                  )}
                </div>
              )}

              {/* Timestamp and Status */}
              <div className={clsx(
                "flex items-center gap-1.5 pt-1 justify-end",
                isMe ? "text-sky-50/70" : "text-slate-400"
              )}>
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {message.edited_at && !message.is_deleted && (
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">• Edited</span>
                )}
                {isMe && <DeliveryStatus />}
              </div>
            </div>
          )}

          {/* Reactions */}
          {Object.keys(reactionCounts).length > 0 && (
            <div className={clsx(
              "absolute -bottom-3 flex flex-wrap gap-1 p-1 bg-white border border-slate-100 rounded-full shadow-lg shadow-slate-200 z-10",
              isMe ? "right-2" : "left-2"
            )}>
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <button 
                  key={emoji} 
                  onClick={() => handleReaction(emoji)}
                  className={clsx(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full transition-all text-sm",
                    myReactions.includes(emoji) 
                      ? "bg-sky-50 border border-sky-100 ring-1 ring-sky-200/50" 
                      : "hover:bg-slate-50 border border-transparent"
                  )}
                >
                  <span>{emoji}</span>
                  {count > 1 && <span className={clsx(
                    "text-[10px] font-bold",
                    myReactions.includes(emoji) ? "text-sky-600" : "text-slate-400"
                  )}>{count}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Actions (visible on hover) */}
        {!message.is_deleted && (
          <div className={clsx(
            "absolute top-1/2 -translate-y-1/2 flex items-center gap-1 transition-all duration-300 opacity-0 group-hover:opacity-100 z-20",
            isMe ? "-left-28" : "-right-28"
          )}>
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-sky-500 rounded-2xl shadow-xl shadow-slate-200 active:scale-90 transition-all"
              title="Add Reaction"
            >
              <Smile className="w-4.5 h-4.5" />
            </button>
            {isMe && !isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-sky-500 rounded-2xl shadow-xl shadow-slate-200 active:scale-90 transition-all"
                  title="Edit Message"
                >
                  <Edit2 className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2.5 bg-red-50 border border-red-100 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl shadow-xl shadow-red-200 active:scale-90 transition-all"
                  title="Delete Message"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Reaction Picker Overlay */}
        {showReactions && (
          <div className={clsx(
            "absolute -top-14 bg-white border border-slate-100 shadow-2xl rounded-[1.5rem] p-2 flex gap-1 z-30 animate-in fade-in zoom-in duration-300",
            isMe ? "right-0" : "left-0"
          )}>
            {reactionEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="w-10 h-10 flex items-center justify-center text-xl hover:bg-slate-50 rounded-xl hover:scale-110 active:scale-90 transition-all"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {isMe && (
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-2xl overflow-hidden ml-3 shrink-0 border-2 border-white bg-slate-100 self-end mb-1 shadow-md hover:scale-110 transition-transform cursor-pointer">
          <img src={avatarUrl || `https://ui-avatars.com/api/?name=${senderName}&background=0EA5E9&color=fff`} alt={senderName} className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
