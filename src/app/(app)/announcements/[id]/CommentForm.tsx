'use client';

import { ActionForm, SubmitButton } from '@/components/forms';
import { Textarea } from '@/components/ui';
import { addComment } from '../actions';

export default function CommentForm({ announcementId }: { announcementId: string }) {
  return (
    <ActionForm action={addComment} resetOnSuccess className="space-y-2">
      {(s) => (
        <>
          <input type="hidden" name="announcementId" value={announcementId} />
          <label htmlFor="body" className="sr-only">Comment</label>
          <Textarea name="body" rows={3} placeholder="Write a comment…" />
          {s.fieldErrors?.body ? <p className="text-xs text-rose-600">{s.fieldErrors.body}</p> : null}
          <div className="flex justify-end"><SubmitButton size="sm">Comment</SubmitButton></div>
        </>
      )}
    </ActionForm>
  );
}
