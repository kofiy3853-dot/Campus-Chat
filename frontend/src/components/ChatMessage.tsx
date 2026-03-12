import React from 'react';
import { clsx } from 'clsx';
import { Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChatMessageProps {
  message: any;
  isMe: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isMe }) => {
  const { user } = useAuth();
  
  const senderName = isMe ? user?.name : message.sender_id?.name || 'User';
  const avatarUrl = isMe ? user?.profile_picture : message.sender_id?.profile_picture;

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
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message_text}</p>
        
        {/* Media Content */}
        {message.media_url && (
          <div className="mt-2 rounded-xl overflow-hidden">
            {(message.message_type === 'image' || (!message.message_type && message.media_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i))) ? (
              <a href={message.media_url} target="_blank" rel="noreferrer">
                <img src={message.media_url} alt="Shared media" className="max-h-60 object-cover w-full rounded-xl" />
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

        {/* Footer info */}
        <div className={clsx(
          "flex items-center gap-1.5 mt-1.5 justify-end",
          isMe ? "text-primary-100" : "text-slate-500"
        )}>
          <span className="text-[10px] font-medium">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
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

        {/* Tail styling could go here if desired */}
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
