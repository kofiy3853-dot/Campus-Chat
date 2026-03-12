import React, { useState, useRef, useEffect } from 'react';
import {
  Smile, ImageIcon, Mic, Send, Paperclip, X, StopCircle,
  FileText, Calendar, Contact, FolderOpen, ChevronUp,
} from 'lucide-react';
import api from '../services/api';

interface ChatInputProps {
  onSend: (text: string, mediaUrl?: string, mediaType?: string) => void;
  onTyping: () => void;
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

const ChatInput: React.FC<ChatInputProps> = ({ onSend, onTyping }) => {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: string; name: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dynamicInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const emojiRef = useRef<HTMLDivElement>(null);
  const attachRef = useRef<HTMLDivElement>(null);

  // Close popups on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
      if (attachRef.current && !attachRef.current.contains(e.target as Node)) setShowAttach(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/api/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreviewFile({ url: data.url, type: data.type, name: file.name });
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
      onSend(text || previewFile.name, previewFile.url, previewFile.type);
      setPreviewFile(null);
      setText('');
      return;
    }
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  const insertEmoji = (emoji: string) => {
    setText(prev => prev + emoji);
    setShowEmoji(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = e => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        await uploadFile(file);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      alert('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <footer className="p-4 md:p-6 bg-[#0A0F1D]/80 backdrop-blur-xl border-t border-slate-800/50">

      {/* File preview bar */}
      {previewFile && (
        <div className="max-w-6xl mx-auto mb-3 flex items-center gap-3 px-4 py-2.5 bg-slate-800 rounded-2xl border border-slate-700">
          {previewFile.type === 'image' && (
            <img src={previewFile.url} alt="preview" className="w-12 h-12 rounded-lg object-cover shrink-0" />
          )}
          {previewFile.type === 'audio' && (
            <audio controls src={previewFile.url} className="h-10 flex-1" />
          )}
          {(previewFile.type === 'file' || !['image','audio'].includes(previewFile.type)) && previewFile.type !== 'audio' && previewFile.type !== 'image' && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Paperclip className="w-4 h-4 text-primary-400 shrink-0" />
              <span className="text-sm text-slate-300 truncate">{previewFile.name}</span>
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
          className="max-w-6xl mx-auto mb-3 p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl grid grid-cols-10 gap-1"
        >
          {EMOJIS.map(e => (
            <button
              key={e}
              type="button"
              onClick={() => insertEmoji(e)}
              className="text-xl p-1 hover:bg-slate-800 rounded-lg"
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
          className="max-w-6xl mx-auto mb-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 pt-3 pb-1">
            Attach
          </p>
          <div className="grid grid-cols-4 gap-0 divide-x divide-slate-800/50">
            {ATTACH_OPTIONS.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => openAttachOption(opt.accept)}
                  className="flex flex-col items-center gap-2 py-4 px-2 hover:bg-slate-800 text-center"
                >
                  <div className="w-10 h-10 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">{opt.label}</span>
                  <span className="text-[10px] text-slate-600 leading-snug">{opt.desc}</span>
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
        className="flex items-center gap-3 max-w-6xl mx-auto ring-1 ring-slate-800/80 p-2.5 rounded-[1.5rem] bg-slate-900 shadow-2xl focus-within:ring-primary-500/50"
      >
        <div className="flex items-center gap-1 px-1">
          {/* Attachment toggle */}
          <button
            type="button"
            aria-label="Add attachment"
            title="Attachments"
            disabled={uploading}
            onClick={() => { setShowAttach(v => !v); setShowEmoji(false); }}
            className={`p-2.5 hover:bg-slate-800 rounded-xl disabled:opacity-40 ${showAttach ? 'text-primary-400' : 'text-slate-500 hover:text-primary-400'}`}
          >
            {showAttach ? <ChevronUp className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
          </button>

          {/* Emoji */}
          <button
            type="button"
            aria-label="Insert emoji"
            title="Emoji"
            onClick={() => { setShowEmoji(v => !v); setShowAttach(false); }}
            className={`p-2.5 hover:bg-slate-800 rounded-xl hidden sm:flex ${showEmoji ? 'text-primary-400' : 'text-slate-500 hover:text-primary-400'}`}
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        <input
          type="text"
          placeholder={uploading ? 'Uploading…' : isRecording ? 'Recording…' : 'Type your message…'}
          className="flex-1 bg-transparent border-none outline-none text-slate-200 py-2.5 px-2 text-[15px] placeholder:text-slate-600"
          value={text}
          onChange={e => { setText(e.target.value); onTyping(); }}
          disabled={uploading || isRecording}
        />

        <div className="flex items-center gap-1 px-1">
          {/* Image quick-pick */}
          <button
            type="button"
            aria-label="Send image"
            title="Send image"
            disabled={uploading}
            onClick={() => imageInputRef.current?.click()}
            className="p-2.5 text-slate-500 hover:text-primary-400 hover:bg-slate-800 rounded-xl hidden sm:flex disabled:opacity-40"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Mic / Stop */}
          {isRecording ? (
            <button
              type="button"
              aria-label="Stop recording"
              title="Stop recording"
              onClick={stopRecording}
              className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-xl"
            >
              <StopCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Record voice message"
              title="Voice message"
              disabled={uploading}
              onClick={startRecording}
              className="p-2.5 text-slate-500 hover:text-primary-400 hover:bg-slate-800 rounded-xl disabled:opacity-40"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          {/* Send */}
          <button
            type="submit"
            disabled={!text.trim() && !previewFile}
            aria-label="Send message"
            className="p-3 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:hover:bg-primary-600 text-white rounded-2xl shadow-lg shadow-primary-600/30 ml-2"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </footer>
  );
};

export default ChatInput;
