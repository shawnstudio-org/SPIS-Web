import {
  normalizeAlerts,
  normalizeDiagnosis,
  normalizePrescription,
  normalizeProgress,
} from '@/lib/view-models';

describe('view-model normalizers', () => {
  it('returns safe defaults for empty diagnosis payloads', () => {
    expect(normalizeDiagnosis({ message: 'no analysis yet' })).toMatchObject({
      empty: true,
      error_stats: [],
      skill_stats: [],
      ai_status: 'SKIPPED',
    });
  });

  it('normalizes populated diagnosis payload arrays', () => {
    const diagnosis = normalizeDiagnosis({
      error_overview: [{ label: 'Inference', error_count: 2 }],
      skill_map: [{ skill_code: 'reading_overall', skill_ratio: 0.4 }],
      ai_status: 'DONE',
    });

    expect(diagnosis.empty).toBe(false);
    expect(diagnosis.error_stats).toHaveLength(1);
    expect(diagnosis.skill_stats).toHaveLength(1);
    expect(diagnosis.ai_status).toBe('DONE');
  });

  it('returns safe defaults for empty prescription and progress payloads', () => {
    expect(normalizePrescription({ message: 'no prescription yet' })).toMatchObject({
      empty: true,
      items: [],
    });
    expect(normalizeProgress(null)).toMatchObject({
      latest: null,
      snapshots: [],
    });
    expect(normalizeAlerts(null)).toMatchObject({
      empty: true,
      urgent_errors: [],
    });
  });
});
