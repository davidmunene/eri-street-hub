'use client';

import Collapsible from '@/components/Collapsible';
import { useEffect, useRef } from 'react';
import ReportForm from './ReportForm';

type Props = Omit<Parameters<typeof ReportForm>[0], 'onDone'> & { autoOpen?: boolean };

export default function NewReport({ autoOpen, ...props }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // Deep link from a beneficiary profile opens the form straight away.
  useEffect(() => { if (autoOpen) ref.current?.querySelector('button')?.click(); }, [autoOpen]);
  return (
    <div ref={ref}>
      <Collapsible label="Log intervention" title="New field report">
        {(close) => <ReportForm {...props} onDone={close} />}
      </Collapsible>
    </div>
  );
}
