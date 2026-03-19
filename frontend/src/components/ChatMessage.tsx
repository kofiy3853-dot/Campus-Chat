import React, { useState } from 'react';
import VoicePlayer from './VoicePlayer';
import { clsx } from 'clsx';
import { Check, CheckCheck, Paperclip, Clock, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getMediaUrl } from '../utils/imageUrl';

interface ChatMessageProps {
  message: any;
  isMe: boolean;
  onReaction?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string, newText: string) => void;
  onDelete?: (messageId: string) => void;
  onMenuOpen?: (message: any, position: { x: number, y: number }) => void;
  onSwipe?: (message: any) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isMe, onReaction, onEdit, onMenuOpen, onSwipe }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.message_text);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  
  const senderName = isMe ? user?.name : message.sender_id?.name || 'User';
  const avatarUrl = isMe ? getMediaUrl(user?.profile_picture) : getMediaUrl(message.sender_id?.profile_picture);

  const handleReaction = (emoji: string) => {
    onReaction?.(message._id, emoji);
  };

  const reactionCounts = (message.reactions || []).reduce((acc: Record<string, number>, curr: any) => {
    acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
    return acc;
  }, {});

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

  const handleMarkHelpful = async () => {
    try {
      await api.post(`/api/groups/messages/${message._id}/helpful`);
      // Haptic feedback
      if (window.navigator.vibrate) window.navigator.vibrate([30, 50, 30]);
    } catch (error: any) {
      console.error('Error marking as helpful:', error);
    }
  };

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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (message.is_deleted) return;
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart;
    
    // Only allow swiping right
    if (diff > 0) {
      // Add a slight resistance/cap to the swipe
      const offset = Math.min(diff * 0.5, 60); 
      setSwipeOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 40) {
      onSwipe?.(message);
      // Haptic feedback if available (standard in Capacitor)
      if (window.navigator.vibrate) window.navigator.vibrate(10);
    }
    setTouchStart(null);
    setSwipeOffset(0);
  };

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add("message-highlight");
      setTimeout(() => {
        el.classList.remove("message-highlight");
      }, 2000);
    }
  };

  const renderSenderName = !isMe && message.sender_id?.name && (
    <span className="text-[0.7rem] font-bold text-on-surface-variant/70 mb-1.5 ml-1 uppercase tracking-widest leading-none font-display">
      {message.sender_id.name}
    </span>
  );

  const handleContextMenu = (e: React.MouseEvent) => {
    if (message.is_deleted) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    onMenuOpen?.(message, { 
      x: rect.left + rect.width / 2, 
      y: rect.top - 50 
    });
  };

  return (
    <div
      id={`msg-${message._id}`}
      className={clsx(
        "flex w-full mb-1 px-1 md:px-2 transition-all duration-300",
        isMe ? "justify-end" : "justify-start"
      )}
    >
      {!isMe && (
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-2xl overflow-hidden mr-3 shrink-0 border-2 border-white bg-slate-100 self-end mb-1 shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95">
          <img 
            src={avatarUrl || `https://ui-avatars.com/api/?name=${senderName}&background=0EA5E9&color=fff`} 
            alt={senderName} 
            className="w-full h-full object-cover"
            onClick={() => window.open(avatarUrl, '_blank')}
            title="Click to view full size"
          />
        </div>
      )}
      
      <div 
        className={clsx(
          "max-w-[70%] group relative transform-gpu transition-all duration-300",
          isMe ? "flex flex-col items-end" : "flex flex-col items-start"
        )}
        onContextMenu={handleContextMenu}
      >
        {renderSenderName}

        <div 
          className={clsx(
            "px-5 py-3 relative transition-all duration-300 swipe-transform font-body",
            isMe 
              ? "btn-primary-gradient bubble-me" 
              : "bg-surface-lowest bubble-other shadow-ambient border-none text-on-surface"
          )}
          style={{ '--swipe-offset': `${swipeOffset}px` } as React.CSSProperties}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Reply Context */}
          {message.reply_to && !message.is_deleted && (
            <div 
              onClick={() => scrollToMessage(message.reply_to._id)}
              className={clsx(
                "mb-2 p-2 px-3 rounded-2xl text-xs border-l-4 overflow-hidden cursor-pointer",
                isMe 
                  ? "bg-white/10 border-white/40 text-white/90" 
                  : "bg-slate-50 border-sky-400 text-slate-500"
              )}
            >
              <p className="font-black uppercase tracking-widest text-[0.65rem] mb-0.5 opacity-80">
                {message.reply_to.sender_id?.name || 'User'}
              </p>
              <p className="line-clamp-1 italic">
                {message.reply_to.message_text || (message.reply_to.media_url ? 'Sent an attachment' : '')}
              </p>
            </div>
          )}

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
                "text-sm leading-[1.6] whitespace-pre-wrap font-medium tracking-tight",
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
                        className="max-h-80 object-cover w-full rounded-2xl transition-transform hover:scale-[1.02] duration-500 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(getMediaUrl(message.media_url), '_blank');
                        }}
                      />
                    </a>
                  ) : (message.message_type === 'voice' || message.media_url?.match(/\.(mp3|ogg|wav|webm|m4a|aac)$/i)) ? (
                    <VoicePlayer url={getMediaUrl(message.media_url)} isMe={isMe} />
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
                "flex items-center gap-1.5 pt-1 justify-end font-display",
                isMe ? "text-white/70" : "text-on-surface-variant/50"
              )}>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {message.edited_at && !message.is_deleted && (
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">• Edited</span>
                )}
                {isMe && <DeliveryStatus />}
              </div>

              {/* Mark as Helpful Button (Group messages only, not mine) */}
              {!isMe && message.group_id && !message.is_deleted && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkHelpful();
                  }}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-slate-400 hover:text-yellow-500 hover:bg-yellow-50 hover:border-yellow-100 transition-all duration-300"
                  title="Mark as Helpful Study Tip"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Helpful</span>
                </button>
              )}
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
                  {(Number(count) > 1) && (
                    <span className={clsx(
                      "text-[10px] font-bold",
                      myReactions.includes(emoji) ? "text-sky-600" : "text-slate-400"
                    )}>
                      {count as any}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isMe && (
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-2xl overflow-hidden ml-3 shrink-0 border-2 border-white bg-slate-100 self-end mb-1 shadow-md hover:scale-110 transition-transform cursor-pointer">
          <img src={avatarUrl || `https://ui-avatars.com/api/?name=${senderName}&background=0EA5E9&color=fff`} alt={senderName} className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
};

export default React.memo(ChatMessage);
