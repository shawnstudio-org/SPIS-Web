'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuthGuard } from '@/lib/auth-client';

export function useStudentPage(studentId) {
  const auth = useAuthGuard();
  const [student, setStudent] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth.ready || !studentId) return;

    const run = async () => {
      const response = await apiRequest(`/students/${studentId}`, {
        token: auth.token,
      });

      if (!response.ok) {
        setError(response.data?.error || 'Unable to load student');
        return;
      }

      setStudent(response.data);
    };

    run();
  }, [auth.ready, auth.token, studentId]);

  return { auth, student, error, setError };
}
