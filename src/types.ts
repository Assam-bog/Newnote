export type Note = {
  id: string;
  title: string;
  content: string;
  isImportant: boolean;
  color: string;
  createdAt: number;
};

export type Reminder = {
  id: string;
  text: string;
  time: number;
  isCompleted: boolean;
};

export type Todo = {
  id: string;
  text: string;
  isCompleted: boolean;
  completedAt?: number;
};

export type HtmlSnippet = {
  id: string;
  name: string;
  code: string;
  createdAt: number;
};

export type AppSettings = {
  fontStyle: string;
  theme: 'light' | 'dark';
};
