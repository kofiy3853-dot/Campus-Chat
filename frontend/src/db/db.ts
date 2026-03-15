import Dexie, { Table } from 'dexie';

export interface LocalConversation {
  _id: string;
  participants: any[];
  last_message: any;
  last_message_time: string;
  unread_count: number;
  type: 'chat' | 'group';
  group_name?: string;
  updatedAt: string;
}

export interface LocalMessage {
  _id: string;
  conversation_id: string;
  sender_id: any;
  message_text: string;
  message_type: 'text' | 'image' | 'voice' | 'file';
  media_url?: string;
  timestamp: string;
  delivery_status: 'sent' | 'delivered' | 'read' | 'pending' | 'failed';
  reactions?: any[];
  is_deleted?: boolean;
  edited_at?: string;
}

export interface OfflineAction {
  id?: number;
  type: 'send_message' | 'react' | 'delete' | 'edit';
  data: any;
  timestamp: string;
}

export class AppDatabase extends Dexie {
  conversations!: Table<LocalConversation>;
  messages!: Table<LocalMessage>;
  offline_queue!: Table<OfflineAction>;

  constructor() {
    super('CampusChatDB');
    this.version(1).stores({
      conversations: '_id, last_message_time, type',
      messages: '_id, conversation_id, timestamp',
      offline_queue: '++id, type, timestamp'
    });
  }
}

export const db = new AppDatabase();
