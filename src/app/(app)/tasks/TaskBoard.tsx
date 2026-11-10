'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { CalendarClock, GripVertical, Pencil, Trash2, Plus } from 'lucide-react';
import { ActionForm, SubmitButton } from '@/components/forms';
import { Avatar, Badge, Field, Input, Select, Textarea, buttonClass, cn } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { deleteTask, moveTask, saveTask } from './actions';

export type BoardTask = {
  id: string; title: string; description: string | null; status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH'; dueDate: string | null; dueInput: string;
  assignee: { id: string; name: string; image: string | null } | null; creator: string;
};

const COLUMNS = [
  { id: 'TODO', label: 'To do', dot: 'bg-slate-400' },
  { id: 'IN_PROGRESS', label: 'In progress', dot: 'bg-brand-500' },
  { id: 'DONE', label: 'Done', dot: 'bg-leaf-500' },
] as const;
const PRIORITY = { HIGH: { tone: 'rose', label: 'High' }, MEDIUM: { tone: 'amber', label: 'Medium' }, LOW: { tone: 'slate', label: 'Low' } } as const;

export default function TaskBoard({ tasks, members }: { tasks: BoardTask[]; members: { id: string; name: string }[] }) {
  const [optimistic, applyMove] = useOptimistic(tasks, (state, { id, status }: { id: string; status: BoardTask['status'] }) =>
    state.map((t) => (t.id === id ? { ...t, status } : t)));
  const [, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [editing, setEditing] = useState<BoardTask | 'new' | null>(null);
  const [error, setError] = useState('');

  const move = (id: string, status: BoardTask['status']) =>
    startTransition(async () => {
      applyMove({ id, status });
      const res = await moveTask(id, status);
      setError(res.error ?? '');
    });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setEditing('new')} className={buttonClass('primary')}><Plus className="h-4 w-4" /> New task</button>
      </div>
      {error ? <p role="alert" className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = optimistic.filter((t) => t.status === col.id);
          return (
            <section
              key={col.id}
              aria-label={col.label}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => { e.preventDefault(); setDragOver(null); const id = e.dataTransfer.getData('text/plain'); if (id) move(id, col.id); }}
              className={cn('rounded-xl border bg-slate-100/70 p-3 transition', dragOver === col.id ? 'border-brand-400 bg-brand-50' : 'border-transparent')}
            >
              <h2 className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold text-slate-700">
                <span className={cn('h-2 w-2 rounded-full', col.dot)} /> {col.label}
                <span className="ml-auto rounded-full bg-surface px-2 text-xs text-slate-500">{items.length}</span>
              </h2>
              <ul className="min-h-[120px] space-y-2">
                {items.map((t) => {
                  const overdue = t.dueDate && t.status !== 'DONE' && t.dueInput < today;
                  return (
                    <li
                      key={t.id}
                      draggable
                      onDragStart={(e) => { e.dataTransfer.setData('text/plain', t.id); e.dataTransfer.effectAllowed = 'move'; }}
                      className="group cursor-grab rounded-lg border border-slate-200 bg-surface p-3 shadow-sm active:cursor-grabbing"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-4 w-4 flex-none text-slate-300" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className={cn('text-sm font-medium', t.status === 'DONE' && 'text-slate-400 line-through')}>{t.title}</p>
                          {t.description ? <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{t.description}</p> : null}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Badge tone={PRIORITY[t.priority].tone}>{PRIORITY[t.priority].label}</Badge>
                            {t.dueDate ? <Badge tone={overdue ? 'rose' : 'slate'}><CalendarClock className="h-3 w-3" />{overdue ? 'Overdue · ' : ''}{formatDate(t.dueDate)}</Badge> : null}
                          </div>
                        </div>
                        {t.assignee ? <span title={t.assignee.name}><Avatar name={t.assignee.name} src={t.assignee.image} size="sm" /></span> : null}
                      </div>
                      <div className="mt-2 flex items-center gap-1 border-t border-slate-100 pt-2">
                        {/* Keyboard / touch alternative to drag-and-drop */}
                        <label className="sr-only" htmlFor={`mv-${t.id}`}>Move “{t.title}” to</label>
                        <select id={`mv-${t.id}`} value={t.status} onChange={(e) => move(t.id, e.target.value as BoardTask['status'])} className="rounded-md border-0 bg-slate-50 py-1 pl-2 pr-7 text-xs text-slate-600 ring-1 ring-slate-200 focus:ring-brand-500">
                          {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                        <button onClick={() => setEditing(t)} className="ml-auto rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Edit ${t.title}`}><Pencil className="h-3.5 w-3.5" /></button>
                        <button
                          onClick={() => { if (confirm(`Delete “${t.title}”?`)) startTransition(async () => { const r = await deleteTask(t.id); setError(r.error ?? ''); }); }}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Delete ${t.title}`}
                        ><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </li>
                  );
                })}
                {items.length === 0 ? <li className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">Drop tasks here</li> : null}
              </ul>
            </section>
          );
        })}
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">{editing === 'new' ? 'New task' : 'Edit task'}</h2>
            <ActionForm action={saveTask} onSuccess={() => setEditing(null)} className="space-y-4">
              {(s) => {
                const t = editing === 'new' ? null : editing;
                return (
                  <>
                    {t ? <input type="hidden" name="id" value={t.id} /> : null}
                    <Field label="Title" name="title" error={s.fieldErrors?.title} required><Input name="title" defaultValue={t?.title} autoFocus /></Field>
                    <Field label="Details" name="description"><Textarea name="description" rows={3} defaultValue={t?.description ?? ''} /></Field>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label="Assign to" name="assigneeId" className="sm:col-span-3"><Select name="assigneeId" placeholder="Unassigned" options={members.map((m) => ({ value: m.id, label: m.name }))} defaultValue={t?.assignee?.id ?? ''} /></Field>
                      <Field label="Priority" name="priority"><Select name="priority" defaultValue={t?.priority ?? 'MEDIUM'} options={[{ value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' }, { value: 'HIGH', label: 'High' }]} /></Field>
                      <Field label="Due date" name="dueDate" className="sm:col-span-2"><Input name="dueDate" type="date" defaultValue={t?.dueInput ?? ''} /></Field>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setEditing(null)} className="px-3 text-sm text-slate-600">Cancel</button>
                      <SubmitButton pendingText="Saving…">Save task</SubmitButton>
                    </div>
                  </>
                );
              }}
            </ActionForm>
          </div>
        </div>
      ) : null}
    </>
  );
}
