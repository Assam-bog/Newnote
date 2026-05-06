import Dexie, { Table } from 'dexie';
import { Note, Reminder, Todo, HtmlSnippet } from './types';

export class QuiqNoteDB extends Dexie {
  notes!: Table<Note>;
  reminders!: Table<Reminder>;
  todos!: Table<Todo>;
  htmlSnippets!: Table<HtmlSnippet>;

  constructor() {
    super('QuiqNoteDB');
    this.version(1).stores({
      notes: 'id, title, content, isImportant, createdAt',
      reminders: 'id, text, time, isCompleted',
      todos: 'id, text, isCompleted',
      htmlSnippets: 'id, name, createdAt'
    });
  }
}

export const db = new QuiqNoteDB();
