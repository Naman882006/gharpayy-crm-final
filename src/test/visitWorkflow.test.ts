import { describe, it, expect, vi, beforeEach } from 'vitest';

// mock the supabase client before it is imported by the code under test
vi.mock('@/integrations/supabase/client', () => {
  return { supabase: { from: vi.fn() } };
});

import type { Database } from '@/integrations/supabase/types';
import { recordVisitOutcome } from '@/hooks/useCrmData';
import { supabase } from '@/integrations/supabase/client';

// create a minimal stubbed statement object that behaves like a promise
function makeStmt(result: any) {
  const stmt: any = {};
  stmt.select = vi.fn(() => stmt);
  stmt.eq = vi.fn(() => stmt);
  stmt.single = vi.fn(async () => result);
  stmt.update = vi.fn(() => stmt);
  stmt.insert = vi.fn(() => stmt);
  // make the object awaitable
  stmt.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
  stmt.catch = (fn: any) => Promise.resolve(result).catch(fn);
  return stmt;
}

describe('recordVisitOutcome', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('throws if the visit lookup fails', async () => {
    const errorResp = { data: null, error: { message: 'not found' } };
    (supabase.from as any).mockImplementation(() => makeStmt(errorResp));

    await expect(recordVisitOutcome('v1', 'considering')).rejects.toMatchObject({ message: 'not found' });
  });

  it('successfully records a non-booked outcome without touching leads/bookings', async () => {
    // first call fetch visit
    const visit = { lead_id: 'L1', property_id: 'P1' };
    const stmt1 = makeStmt({ data: visit, error: null });
    // second call update visit
    const stmt2 = makeStmt({ data: [], error: null });

    const calls: any[] = [stmt1, stmt2];
    (supabase.from as any).mockImplementation(() => calls.shift());

    await expect(recordVisitOutcome('v1', 'considering')).resolves.toMatchObject({ visitId: 'v1', outcome: 'considering' });
  });

  it('updates lead and creates booking when outcome is booked', async () => {
    const visit = { lead_id: 'L1', property_id: 'P1' };
    const stmt1 = makeStmt({ data: visit, error: null });
    const stmt2 = makeStmt({ data: [], error: null }); // update visit
    const stmt3 = makeStmt({ data: [], error: null }); // update lead
    const stmt4 = makeStmt({ data: [], error: null }); // insert booking

    const calls: any[] = [stmt1, stmt2, stmt3, stmt4];
    (supabase.from as any).mockImplementation(() => calls.shift());

    await expect(recordVisitOutcome('v2', 'booked')).resolves.toMatchObject({ visitId: 'v2', outcome: 'booked' });
    // ensure each table was called in correct order
    expect((supabase.from as any).mock.calls.map(c => c[0])).toEqual(['visits', 'visits', 'leads', 'bookings']);
  });

  it('propagates error when lead update fails during booked', async () => {
    const visit = { lead_id: 'L1', property_id: 'P1' };
    const stmt1 = makeStmt({ data: visit, error: null });
    const stmt2 = makeStmt({ data: [], error: null });
    const stmt3 = makeStmt({ data: null, error: { message: 'lead failed' } });
    const calls: any[] = [stmt1, stmt2, stmt3];
    (supabase.from as any).mockImplementation(() => calls.shift());

    await expect(recordVisitOutcome('v3', 'booked')).rejects.toMatchObject({ message: 'lead failed' });
  });
});
