import React, { useState, useRef, useEffect } from 'react';
import {
  Smile, ImageIcon, Mic, Send, Paperclip, X, StopCircle,
  FileText, Calendar, Contact, FolderOpen, ChevronUp, Edit2
} from 'lucide-react';
import { clsx } from 'clsx';
import api from '../services/api';
import { getMediaUrl } from '../utils/imageUrl';
import { compressImage } from '../utils/imageCompression';

interface ChatInputProps {
  onSend: (text: string, mediaUrl?: string, mediaType?: string, replyTo?: string) => void;
  onTyping: () => void;
  editingValue?: string;
  onCancelEdit?: () => void;
  reply?: any;
  onCancelReply?: () => void;
}

// Built-in emoji set
const EMOJIS = [
  '😀','😂','😍','🥰','😎','😭','😡','🥺','😴','🤔',
  '👋','👍','👎','❤️','🔥','🎉','💯','✅','😅','🙏',
  '🤣','😊','😢','😤','🥳','🤩','😏','🫡','💀','🤯',
  '👀','💬','📸','🎵','🚀','⚡','🌟','💎','🎯','🏆',
];

// Attachment menu options
const ATTACH_OPTIONS = [
  { id: 'file',     label: 'File',     icon: FolderOpen, accept: '',     desc: 'Any file type' },
  { id: 'document', label: 'Document', icon: FileText,   accept: '.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.csv', desc: 'PDF, Word, Excel…' },
  { id: 'event',    label: 'Event',    icon: Calendar,   accept: '.ics', desc: 'Calendar event (.ics)' },
  { id: 'contact',  label: 'Contact',  icon: Contact,    accept: '.vcf', desc: 'vCard contact (.vcf)' },
];

const ChatInput: React.FC<ChatInputProps> = ({ onSend, onTyping, editingValue, onCancelEdit, reply, onCancelReply }) => {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: string; name: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dynamicInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const emojiRef = useRef<HTMLDivElement>(null);
  const attachRef = useRef<HTMLDivElement>(null);

  // Sync text with editing value
  useEffect(() => {
    if (editingValue !== undefined) {
      setText(editingValue);
    }
  }, [editingValue]);

  // Close popups on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
      if (attachRef.current && !attachRef.current.contains(e.target as Node)) setShowAttach(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const uploadFile = async (originalFile: File, explicitType?: 'voice' | 'image' | 'file') => {
    setUploading(true);
    try {
      let fileToUpload = originalFile;
      if (originalFile.type.startsWith('image/')) {
        fileToUpload = await compressImage(originalFile);
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);
      const { data } = await api.post('/api/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreviewFile({ 
        url: data.url,
        type: explicitType || data.type, 
        name: originalFile.name 
      });
    } catch {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  const openAttachOption = (accept: string) => {
    setShowAttach(false);
    if (dynamicInputRef.current) {
      dynamicInputRef.current.accept = accept;
      dynamicInputRef.current.click();
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (previewFile) {
      onSend(text || previewFile.name, previewFile.url, previewFile.type, reply?._id);
      setPreviewFile(null);
      setText('');
      return;
    }
    if (!text.trim()) return;
    onSend(text, undefined, undefined, reply?._id);
    setText('');
  };

  const insertEmoji = (emoji: string) => {
    setText(prev => prev + emoji);
    setShowEmoji(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Prefer more universal formats for mobile compatibility (especially iOS/Capacitor)
      const mimeType = [
        'audio/aac',
        'audio/mp4',
        'audio/mpeg',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg'
      ].find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';

      console.log(`[ChatInput] Recording with mimeType: ${mimeType}`);
      const recorder = new MediaRecorder(stream, { mimeType });
      
      setRecordingTime(0);
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      audioChunksRef.current = [];
      // Requesting chunks every 1 second to ensure we capture data even on small recordings
      recorder.ondataavailable = e => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        clearInterval(timer);
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        
        if (blob.size === 0) {
          console.error('[ChatInput] Recorded blob is empty');
          alert('Recording failed: no audio data captured.');
          return;
        }

        const extension = mimeType.includes('aac') ? 'aac' : 
                         mimeType.includes('mp4') ? 'mp4' : 
                         mimeType.includes('mpeg') ? 'mp3' : 'webm';
        
        const file = new File([blob], `voice-${Date.now()}.${extension}`, { type: mimeType });
        stream.getTracks().forEach(t => t.stop());
        await uploadFile(file, 'voice');
      };
      
      recorder.start(1000); // Capture in 1s chunks
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error('[ChatInput] Start recording failed:', err);
      alert('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <footer className="p-2.5 md:p-6 bg-white/90 backdrop-blur-xl border-t border-gray-100 relative">
      {/* Reply Preview Area */}
      {reply && (
        <div className="max-w-6xl mx-auto mb-3 flex items-center justify-between px-4 py-3 bg-sky-50 border-l-4 border-sky-400 rounded-xl animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-600 mb-0.5">
              Replying to {reply.sender_id?.name || 'User'}
            </p>
            <p className="text-sm text-slate-600 truncate italic">
              {reply.message_text || (reply.media_url ? 'Attachment' : '')}
            </p>
          </div>
          <button 
            onClick={onCancelReply}
            aria-label="Cancel reply"
            title="Cancel reply"
            className="p-1.5 hover:bg-sky-100 rounded-lg text-sky-400 transition-colors shrink-0 ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Edit Mode Indicator */}
      {editingValue !== undefined && (
        <div className="max-w-6xl mx-auto mb-3 flex items-center justify-between px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 text-amber-600">
            <Edit2 className="w-4 h-4" />
            <span className="text-sm font-bold">Editing message</span>
          </div>
          <button 
            onClick={onCancelEdit}
            aria-label="Cancel editing"
            title="Cancel editing"
            className="p-1 hover:bg-amber-100 rounded-lg text-amber-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* File preview bar */}
      {previewFile && (
        <div className="max-w-6xl mx-auto mb-3 flex items-center gap-3 px-3 md:px-4 py-2 md:py-2.5 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100">
          {previewFile.type === 'image' && (
            <img src={getMediaUrl(previewFile.url)} alt="preview" className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover shrink-0" />
          )}
          {previewFile.type === 'voice' && (
            <audio controls src={getMediaUrl(previewFile.url)} className="h-9 md:h-10 flex-1" />
          )}
          {(previewFile.type === 'file' || !['image','voice'].includes(previewFile.type)) && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Paperclip className="w-3.5 h-3.5 md:w-4 md:h-4 text-sky-400 shrink-0" />
              <span className="text-xs md:text-sm text-gray-700 truncate">{previewFile.name}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setPreviewFile(null)}
            className="ml-auto p-1 text-slate-500 hover:text-red-400 shrink-0"
            aria-label="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div
          ref={emojiRef}
          className="max-w-6xl mx-auto mb-3 p-2 md:p-3 bg-white border border-gray-100 rounded-xl md:rounded-2xl shadow-xl grid grid-cols-8 md:grid-cols-10 gap-1"
        >
          {EMOJIS.map(e => (
            <button
              key={e}
              type="button"
              onClick={() => insertEmoji(e)}
              className="text-lg md:text-xl p-1.5 md:p-1 hover:bg-gray-50 rounded-lg transition-none"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Attachment menu */}
      {showAttach && (
        <div
          ref={attachRef}
          className="max-w-6xl mx-auto mb-3 bg-white border border-gray-100 rounded-xl md:rounded-2xl shadow-xl overflow-hidden"
        >
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-1">
            Attach
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y md:divide-y-0 divide-gray-100">
            {ATTACH_OPTIONS.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => openAttachOption(opt.accept)}
                  className="flex flex-row md:flex-col items-center gap-3 md:gap-2 py-3 md:py-4 px-4 hover:bg-gray-50 text-left md:text-center transition-none"
                >
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-sky-50 flex items-center justify-center shrink-0">
                    <Icon className="w-4.5 h-4.5 md:w-5 md:h-5 text-sky-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-700">{opt.label}</span>
                    <span className="text-[9px] md:text-[10px] text-gray-400 leading-snug">{opt.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={dynamicInputRef}
        type="file"
        className="hidden"
        aria-label="Attach file"
        onChange={handleFileChange}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label="Attach image"
        onChange={handleFileChange}
      />

      <form
        onSubmit={handleSend}
        className="flex items-center gap-1.5 md:gap-3 max-w-6xl mx-auto ring-1 ring-gray-100 p-1.5 md:p-2.5 rounded-2xl md:rounded-[1.5rem] bg-gray-50 shadow-sm focus-within:ring-sky-500/20 transition-none"
      >
        <div className="flex items-center gap-0.5 md:gap-1 px-0.5">
          {/* Attachment toggle */}
          <button
            type="button"
            aria-label="Add attachment"
            title="Attachments"
            disabled={uploading}
            onClick={() => { setShowAttach(v => !v); setShowEmoji(false); }}
            className={`p-2 md:p-2.5 hover:bg-gray-100 rounded-xl disabled:opacity-40 transition-none ${showAttach ? 'text-sky-500 bg-gray-100' : 'text-gray-400 hover:text-sky-500'}`}
          >
            {showAttach ? <ChevronUp className="w-4.5 h-4.5 md:w-5 md:h-5" /> : <Paperclip className="w-4.5 h-4.5 md:w-5 md:h-5" />}
          </button>

          {/* Emoji */}
          <button
            type="button"
            aria-label="Insert emoji"
            title="Emoji"
            onClick={() => { setShowEmoji(v => !v); setShowAttach(false); }}
            className={`p-2 md:p-2.5 hover:bg-gray-100 rounded-xl hidden sm:flex transition-none ${showEmoji ? 'text-sky-500 bg-gray-100' : 'text-gray-400 hover:text-sky-500'}`}
          >
            <Smile className="w-4.5 h-4.5 md:w-5 md:h-5" />
          </button>
        </div>

        <input
          type="text"
          placeholder={uploading ? 'Uploading…' : isRecording ? `Recording... ${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}` : 'Type message…'}
          className={clsx(
            "flex-1 bg-transparent border-none outline-none text-gray-800 py-2 md:py-2.5 px-1 md:px-2 text-sm md:text-[15px] placeholder:text-gray-400 min-w-0",
            isRecording && "animate-pulse text-red-500 font-bold"
          )}
          value={text}
          onChange={e => { setText(e.target.value); onTyping(); }}
          disabled={uploading || isRecording}
        />

        <div className="flex items-center gap-0.5 md:gap-1 px-0.5">
          {/* Image quick-pick */}
          <button
            type="button"
            aria-label="Send image"
            title="Send image"
            disabled={uploading}
            onClick={() => imageInputRef.current?.click()}
            className="p-2 md:p-2.5 text-gray-400 hover:text-sky-500 hover:bg-gray-100 rounded-xl hidden sm:flex disabled:opacity-40 transition-none"
          >
            <ImageIcon className="w-4.5 h-4.5 md:w-5 md:h-5" />
          </button>

          {/* Mic / Stop */}
          {isRecording ? (
            <button
              type="button"
              aria-label="Stop recording"
              title="Stop recording"
              onClick={stopRecording}
              className="p-2 md:p-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <StopCircle className="w-4.5 h-4.5 md:w-5 md:h-5" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Record voice message"
              title="Voice message"
              disabled={uploading}
              onClick={startRecording}
              className="p-2 md:p-2.5 text-gray-400 hover:text-sky-500 hover:bg-gray-100 rounded-xl disabled:opacity-40 transition-none"
            >
              <Mic className="w-4.5 h-4.5 md:w-5 md:h-5" />
            </button>
          )}

          {/* Send */}
          <button
            type="submit"
            disabled={!text.trim() && !previewFile}
            aria-label="Send message"
            className="p-2 md:p-3 bg-sky-400 hover:bg-sky-500 disabled:opacity-50 disabled:hover:bg-sky-400 text-white rounded-xl md:rounded-2xl shadow-sm ml-1 md:ml-2 transition-none shrink-0"
          >
            <Send className="w-4.5 h-4.5 md:w-5 md:h-5" />
          </button>
        </div>
      </form>
    </footer>
  );
};

export default ChatInput;
