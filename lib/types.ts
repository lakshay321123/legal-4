export type Role = 'user' | 'assistant' | 'system';
export type Mode = 'citizen' | 'lawyer';

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  sources?: SourceLink[];
  mode?: Mode;
  saved?: boolean; // saved to Library
}

export interface Chat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export interface SourceLink {
  title: string;
  url: string;
  snippet?: string;
  tag?: string; // e.g., 'Act', 'Judgment', 'Gazette'
}

export interface AppState {
  mode: Mode;
  lawyerPromptsUsedThisMonth: number;
  monthKey: string;
  plan: 'free' | 'citizen_plus' | 'lawyer_pro' | 'firm';
}
