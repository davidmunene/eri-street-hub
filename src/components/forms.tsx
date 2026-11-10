'use client';

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { buttonClass, cn } from '@/components/ui';
import type { ActionState } from '@/lib/actions';

const PendingContext = createContext<boolean | null>(null);

export function SubmitButton({ children, variant = 'primary', size = 'md', className, pendingText }: { children: ReactNode; variant?: Parameters<typeof buttonClass>[0]; size?: 'sm' | 'md'; className?: string; pendingText?: string }) {
  const status = useFormStatus();
  const ctx = useContext(PendingContext);
  const pending = ctx ?? status.pending;
  return (
    <button type="submit" disabled={pending} className={cn(buttonClass(variant, size), className)}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

type FormAction = (state: ActionState, fd: FormData) => Promise<ActionState>;

/**
 * A <form> bound to a server action that returns ActionState.
 * Shows the error/success message and exposes field errors to children.
 */
export function ActionForm({
  action, children, className, resetOnSuccess = false, onSuccess, successMessage,
}: {
  action: FormAction;
  children: ReactNode | ((state: ActionState) => ReactNode);
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
  successMessage?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  const ref = useRef<HTMLFormElement>(null);
  const lastState = useRef(state);

  useEffect(() => {
    if (state === lastState.current) return;
    lastState.current = state;
    if (state.ok) {
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.();
    }
  }, [state, resetOnSuccess, onSuccess]);

  return (
    // Submitting via a transition (rather than the `action` prop) stops React 19
    // from auto-clearing every field, so users keep their input when validation fails.
    <form
      ref={ref}
      className={className}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
    >
      <PendingContext.Provider value={pending}>
        {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
        {state.ok && (state.message || successMessage) ? <FormMessage tone="success">{state.message ?? successMessage}</FormMessage> : null}
        {typeof children === 'function' ? children(state) : children}
      </PendingContext.Provider>
    </form>
  );
}

export function FormMessage({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  const Icon = tone === 'error' ? AlertCircle : CheckCircle2;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('mb-4 flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm', tone === 'error' ? 'bg-rose-50 text-rose-800' : 'bg-leaf-50 text-leaf-700')}>
      <Icon className="mt-0.5 h-4 w-4 flex-none" />
      <span>{children}</span>
    </div>
  );
}

/** A tiny form that calls a server action, optionally after a confirm() prompt. */
export function InlineAction({ action, children, confirm: confirmText, className, hidden }: { action: (fd: FormData) => Promise<void>; children: ReactNode; confirm?: string; className?: string; hidden?: Record<string, string> }) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => { if (confirmText && !window.confirm(confirmText)) e.preventDefault(); }}
    >
      {hidden ? Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />) : null}
      {children}
    </form>
  );
}
