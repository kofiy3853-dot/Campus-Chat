// Re-export from Supabase Storage service
// (Formerly Firebase Storage — now migrated to Supabase)
import { uploadToSupabaseStorage, deleteFromSupabaseStorage } from './supabaseStorageService';

export { uploadToSupabaseStorage as uploadToStorage, deleteFromSupabaseStorage as deleteFromStorage };
