import Dexie, { type EntityTable } from "dexie";

export interface Todo {
  id: number;
  title: string;
  isCompleted: boolean;
}

export const db = new Dexie("focuslist") as Dexie & {
  todos: EntityTable<Todo, "id">;
};

db.version(1).stores({
  todos: "++id",
});
