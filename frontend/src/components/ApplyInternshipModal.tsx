import React, { useState } from 'react';
import { X, Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { clsx } from 'clsx';

interface ApplyInternshipModalProps {
  internshipId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ApplyInternshipModal: React.FC<ApplyInternshipModalProps> = ({ internshipId, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!internshipId) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        showToast('error', 'File too large', 'Resume size must be under 5MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToast('error', 'Resume required', 'Please upload your resume to apply');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      await api.post(`/api/internships/apply/${internshipId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      showToast('success', 'Application Sent!', 'Your resume has been submitted successfully.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error: any) {
      showToast('error', 'Application failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        {success ? (
          <div className="py-12 flex flex-col items-center text-center animate-in zoom-in-50 duration-500">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Success!</h2>
            <p className="text-slate-500 font-bold max-w-xs mx-auto">Your application has been received. Good luck!</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Apply Internal</h2>
              <p className="text-slate-500 font-medium">Upload your latest resume to apply for this role.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div 
                className={clsx(
                  "border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center transition-all cursor-pointer relative group",
                  file ? "border-indigo-500 bg-indigo-50/30" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                )}
                onClick={() => document.getElementById('resume-upload')?.click()}
              >
                <input 
                  type="file" 
                  id="resume-upload"
                  aria-label="Upload Resume"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                {file ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg text-indigo-500 mx-auto mb-4 border border-indigo-100">
                      <FileText className="w-8 h-8" />
                    </div>
                    <p className="text-indigo-600 font-black mb-1 line-clamp-1">{file.name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Click to change
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-50 group-hover:bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-indigo-400 mx-auto mb-4 border border-slate-100 transition-colors">
                      <Upload className="w-8 h-8" />
                    </div>
                    <p className="text-slate-800 font-black mb-1">Upload Resume</p>
                    <p className="text-sm text-slate-400 font-bold">PDF, DOC, DOCX up to 5MB</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !file}
                className="w-full bg-slate-900 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ApplyInternshipModal;
