export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function getErrorMessage(response, fallback = 'Something went wrong.') {
  return response?.data?.error || response?.error || fallback;
}

export function normalizeDiagnosis(payload) {
  if (!payload || payload.empty || payload.message === 'no analysis yet') {
    return {
      empty: true,
      message: payload?.message || 'No analysis has been generated yet.',
      error_stats: [],
      skill_stats: [],
      ai_status: 'SKIPPED',
      ai_summary: null,
      plateau_risk: 'N/A',
    };
  }

  return {
    ...payload,
    empty: false,
    error_stats: asArray(payload.error_stats || payload.error_overview),
    skill_stats: asArray(payload.skill_stats || payload.skill_map),
    ai_status: payload.ai_status || 'SKIPPED',
    ai_summary: payload.ai_summary || null,
  };
}

export function normalizePrescription(payload) {
  if (!payload || payload.empty || payload.message === 'no prescription yet' || !payload.id) {
    return {
      empty: true,
      message: payload?.message || 'No prescription has been generated yet.',
      items: [],
    };
  }

  return {
    ...payload,
    empty: false,
    items: asArray(payload.items),
  };
}

export function normalizeProgress(payload) {
  if (!payload) {
    return {
      latest: null,
      snapshots: [],
    };
  }

  return {
    ...payload,
    latest: payload.latest || null,
    snapshots: asArray(payload.snapshots),
  };
}

export function normalizeAlerts(payload) {
  if (!payload || payload.empty) {
    return {
      empty: true,
      plateau_risk: 'N/A',
      urgent_errors: [],
    };
  }

  return {
    ...payload,
    empty: false,
    urgent_errors: asArray(payload.urgent_errors),
  };
}

export function normalizeDailyPractice(payload) {
  if (!payload || payload.empty) {
    return { empty: true, items: [], status: 'NO_SET', total: 0, completed: 0 };
  }
  return {
    ...payload,
    empty: false,
    items: asArray(payload.items),
    completion_pct: payload.total_questions > 0
      ? Math.round((payload.completed_questions / payload.total_questions) * 100)
      : 0,
  };
}

export function normalizeQuestionBank(payload) {
  return {
    questions: asArray(payload?.questions),
    total: payload?.total || 0,
  };
}
