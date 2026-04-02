'use client';

import { useEffect, useState, useRef } from 'react';
import { onAuthChange } from '@/lib/firebase/auth';
import {
  getProfile, subscribeChildAssignments,
  getFamilyDefinitions, createSingleAssignment,
} from '@/lib/firebase/db';
import type { MissionAssignment, MissionFrequency } from '@/types';

function getPeriodStart(frequency: MissionFrequency): Date {
  const now = new Date();
  if (frequency === 'daily') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (frequency === 'weekly') {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }
  if (frequency === 'monthly') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(0);
}

async function runPeriodReset(
  childId: string,
  familyId: string,
  currentAssignments: MissionAssignment[],
): Promise<void> {
  const defs = await getFamilyDefinitions(familyId);
  const frequencyDefs = defs.filter(d => d.frequency && d.frequency !== 'once');

  for (const def of frequencyDefs) {
    const periodStart = getPeriodStart(def.frequency!);
    const hasActive = currentAssignments.some((a) => {
      if (a.definitionId !== def.id) return false;
      if (!a.createdAt) return false;
      const createdAt = a.createdAt.toDate();
      return createdAt >= periodStart && a.status !== 'rejected';
    });
    if (!hasActive) {
      await createSingleAssignment(def, childId);
    }
  }
}

export function useMissions() {
  const [missions, setMissions] = useState<MissionAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const resetChecked = useRef(false);

  useEffect(() => {
    let unsubMissions: (() => void) | null = null;

    const unsubAuth = onAuthChange(async (user) => {
      if (!user) {
        setMissions([]);
        setLoading(false);
        return;
      }

      try {
        const profile = await getProfile(user.uid);
        if (!profile?.familyId) {
          setMissions([]);
          setLoading(false);
          return;
        }

        const familyId = profile.familyId;

        unsubMissions = subscribeChildAssignments(user.uid, familyId, (data) => {
          setMissions(data);
          setLoading(false);

          if (!resetChecked.current) {
            resetChecked.current = true;
            runPeriodReset(user.uid, familyId, data).catch(() => {});
          }
        });
      } catch {
        setError('미션을 불러오지 못했습니다.');
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      unsubMissions?.();
    };
  }, []);

  return { missions, loading, error };
}
