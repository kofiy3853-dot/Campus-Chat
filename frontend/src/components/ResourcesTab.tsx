import React, { useState } from 'react';
import { Plus, Link as LinkIcon, FileText, ExternalLink, Trash2, Globe, File, MoreVertical, Loader2, BookOpen } from 'lucide-react';
import api from '../services/api';
import { clsx } from 'clsx';

interface ResourcesTabProps {
  groupId: string;
  resources: any[];
  onUpdate: () => void;
}

const ResourcesTab: React.FC<ResourcesTabProps> = ({ groupId, resources, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    url: '',
    type: 'link' as 'link' | 'file'
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResource.title || !newResource.url) return;

    setLoading(true);
    try {
      await api.post('/api/groups/resources', {
        groupId,
        ...newResource
      });
      onUpdate();
      setIsAdding(false);
      setNewResource({ title: '', url: '', type: 'link' });
    } catch (error) {
      console.error('Error adding resource:', error);
      alert('Failed to add resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-8 pb-4 flex items-center justify-between">
         <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Shared Resources</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest pl-1">Knowledge Repository</p>
         </div>
         <button 
           onClick={() => setIsAdding(!isAdding)}
           aria-label={isAdding ? "Cancel adding resource" : "Add resource"}
           className={clsx(
             "p-4 rounded-2xl transition-all active:scale-95 shadow-lg",
             isAdding ? "bg-slate-100 text-slate-400 shadow-none" : "bg-indigo-600 text-white shadow-indigo-200"
           )}
         >
           <Plus className={clsx("w-5 h-5 transition-transform", isAdding && "rotate-45")} />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-6 scrollbar-hide">
        {isAdding && (
          <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. OSI Model Diagram"
                    className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                    value={newResource.title}
                    onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">URL / Link</label>
                  <input 
                    type="url" 
                    placeholder="https://..."
                    className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                    value={newResource.url}
                    onChange={(e) => setNewResource({...newResource, url: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-black transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Log Resource'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.length > 0 ? (
            resources.map((res, i) => (
              <a 
                key={i} 
                href={res.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center gap-5 p-5 bg-white border border-slate-100 rounded-[2rem] hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  {res.type === 'link' ? <Globe className="w-6 h-6" /> : <File className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{res.title}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{new URL(res.url).hostname}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all">
                  <ExternalLink className="w-4 h-4" />
                </div>
              </a>
            ))
          ) : !isAdding && (
            <div className="col-span-full py-20 text-center">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <BookOpen className="w-8 h-8 text-slate-200" />
               </div>
               <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Repository Empty</p>
               <button 
                 onClick={() => setIsAdding(true)}
                 className="mt-4 text-indigo-500 text-[10px] font-black uppercase tracking-widest hover:text-indigo-600"
               >
                 + Contribute First Entry
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourcesTab;
