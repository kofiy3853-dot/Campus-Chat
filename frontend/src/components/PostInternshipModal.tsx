import React, { useState } from 'react';
import { X, Briefcase, Building, MapPin, Calendar, Link as LinkIcon, Plus, Loader2 } from 'lucide-react';
import api from '../services/api';

interface PostInternshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PostInternshipModal: React.FC<PostInternshipModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    location: '',
    category: 'Engineering',
    deadline: '',
    apply_link: '',
    requirements: ['']
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/internships/create', {
        ...formData,
        requirements: formData.requirements.filter(r => r.trim() !== '')
      });
      onSuccess();
      onClose();
      setFormData({
        title: '',
        company: '',
        description: '',
        location: '',
        category: 'Engineering',
        deadline: '',
        apply_link: '',
        requirements: ['']
      });
    } catch (error) {
      console.error('Failed to post internship:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRequirement = () => {
    setFormData(prev => ({ ...prev, requirements: [...prev.requirements, ''] }));
  };

  const handleRequirementChange = (index: number, value: string) => {
    const newRequirements = [...formData.requirements];
    newRequirements[index] = value;
    setFormData(prev => ({ ...prev, requirements: newRequirements }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-10 pt-10 pb-6 flex items-center justify-between border-b border-slate-50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Post Opportunity</h2>
            <p className="text-slate-500 font-medium text-sm">Help students find their next career step.</p>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close modal"
            className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="internship_title">Internship Title *</label>
              <div className="relative">
                <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input 
                  id="internship_title"
                  type="text" 
                  required
                  placeholder="e.g. Software Engineering Intern"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-base font-medium text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="company">Company Name *</label>
              <div className="relative">
                <Building className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input 
                  id="company"
                  type="text" 
                  required
                  placeholder="e.g. Google, Remote Startup"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-base font-medium text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  value={formData.company}
                  onChange={e => setFormData(p => ({ ...p, company: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="internship_location">Location *</label>
              <div className="relative">
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input 
                  id="internship_location"
                  type="text" 
                  required
                  placeholder="e.g. Accra, Remote"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-base font-medium text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  value={formData.location}
                  onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="deadline">Application Deadline *</label>
              <div className="relative">
                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input 
                  id="deadline"
                  type="date" 
                  required
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-base font-medium text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  value={formData.deadline}
                  onChange={e => setFormData(p => ({ ...p, deadline: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="category">Category</label>
              <select 
                id="category"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-base font-medium text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all appearance-none"
                value={formData.category}
                onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
              >
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Data Science">Data Science</option>
                <option value="Business">Business</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="apply_link">Application Hub (Link)</label>
              <div className="relative">
                <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input 
                  id="apply_link"
                  type="url" 
                  placeholder="https://company.com/apply"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-base font-medium text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  value={formData.apply_link}
                  onChange={e => setFormData(p => ({ ...p, apply_link: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="description">Description *</label>
            <textarea 
              id="description"
              required
              rows={4}
              placeholder="Tell us more about the role and what to expect..."
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-base font-medium text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none"
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Required Skills / Requirements</label>
              <button 
                type="button" 
                onClick={handleAddRequirement}
                aria-label="Add requirement field"
                className="text-indigo-600 hover:text-black transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.requirements.map((req, index) => (
                <input 
                  key={index}
                  type="text" 
                  placeholder={`Requirement #${index + 1}`}
                  className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-medium text-slate-700 outline-none focus:bg-white transition-all"
                  value={req}
                  onChange={e => handleRequirementChange(index, e.target.value)}
                />
              ))}
            </div>
          </div>
        </form>

        <div className="p-10 border-t border-slate-50 flex justify-end gap-4">
          <button 
            type="button" 
            onClick={onClose}
            className="px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="bg-indigo-600 hover:bg-black text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 shadow-xl shadow-indigo-200 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Listing'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostInternshipModal;
