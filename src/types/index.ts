export interface Todo {
  id: string;
  name: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  status: 'open' | 'in_progress' | 'done';
  doneAt: string | null;
  createdAt: string;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export type ProjectUpdate = Pick<Project, 'name' | 'description'>;

export interface Contact {
  id: string;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  createdAt: string;
}

export type ContactUpdate = Pick<Contact, 'name' | 'nickname' | 'email' | 'phone'>;

export interface ProjectStats {
  total: number;
  open: number;
  inProgress: number;
  done: number;
}
