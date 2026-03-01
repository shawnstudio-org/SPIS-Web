'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import LoadingState from '@/components/LoadingState';
import MetricCard from '@/components/MetricCard';
import { apiRequest, getApiErrorMessage } from '@/lib/api';
import { useAuthGuard } from '@/lib/auth-client';

export default function PlanSettingsPage() {
  const auth = useAuthGuard();
  const [planInfo, setPlanInfo] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponSubmitting, setCouponSubmitting] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [targetPlan, setTargetPlan] = useState('FREE');
  const [targetStatus, setTargetStatus] = useState('ACTIVE');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadPlan() {
    const response = await apiRequest('/account/plan', { token: auth.token });
    if (!response.ok) {
      setError(getApiErrorMessage(response, 'Unable to load plan.'));
      return;
    }
    setPlanInfo(response.data);
  }

  useEffect(() => {
    if (!auth.ready) return;
    loadPlan();
  }, [auth.ready]);

  async function assignPlan(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    const userId = Number(targetUserId);
    if (!Number.isInteger(userId) || userId <= 0) {
      setError('Valid target user ID is required.');
      return;
    }

    const response = await apiRequest(`/admin/users/${userId}/plan`, {
      method: 'PATCH',
      token: auth.token,
      headers: {
        'x-admin-secret': adminSecret,
      },
      body: {
        plan: targetPlan,
        status: targetStatus,
        notes: notes || null,
      },
    });

    if (!response.ok) {
      setError(getApiErrorMessage(response, 'Plan assignment failed. Verify ADMIN_SECRET and user ID.'));
      return;
    }

    setMessage(`Assigned ${response.data.plan} (${response.data.status}) to user ${response.data.user_id}.`);
    loadPlan();
  }

  async function redeemCoupon(event) {
    event.preventDefault();
    setCouponError('');
    setCouponMessage('');

    const normalizedCode = String(couponCode || '').trim();
    if (!normalizedCode) {
      setCouponError('Coupon code is required.');
      return;
    }

    setCouponSubmitting(true);
    const response = await apiRequest('/account/plan/redeem-coupon', {
      method: 'POST',
      token: auth.token,
      body: { coupon_code: normalizedCode },
    });
    setCouponSubmitting(false);

    if (!response.ok) {
      setCouponError(getApiErrorMessage(response, 'Coupon redemption failed.'));
      return;
    }

    setCouponCode('');
    setCouponMessage(
      `Coupon redeemed successfully. Premium is active until ${response.data?.expires_at?.slice(0, 10) || response.data?.expires_at}.`,
    );
    loadPlan();
  }

  if (!auth.ready) return <LoadingState text="Loading plan settings..." />;

  return (
    <AppShell title="Plan Settings" user={auth.user} plan={auth.plan} token={auth.token}>
      <div className="metric-grid">
        <MetricCard
          label="Current Plan"
          value={planInfo?.plan || auth.plan}
          hint="Active tier gating for this account"
        />
        <MetricCard
          label="Plan Status"
          value={planInfo?.status || 'ACTIVE'}
          hint="Manual assignment lifecycle"
        />
        <MetricCard
          label="Assigned At"
          value={planInfo?.assigned_at?.slice(0, 10) || 'N/A'}
          hint="Latest plan assignment timestamp"
        />
        <MetricCard
          label="Expires At"
          value={planInfo?.expires_at?.slice(0, 10) || 'No expiry'}
          hint="Optional manual expiry"
        />
      </div>

      <div className="card form-grid">
        <h2 className="card-title">Redeem Premium Coupon</h2>
        <p>Redeem once per account. If already Premium, expiry will be extended by 1 year.</p>
        <form className="form-grid" onSubmit={redeemCoupon}>
          <label>
            Coupon code
            <input
              type="password"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder="Enter coupon code"
              required
            />
          </label>
          <button className="primary-btn" type="submit" disabled={couponSubmitting}>
            {couponSubmitting ? 'Redeeming...' : 'Redeem Premium Coupon'}
          </button>
        </form>
        {couponError ? <div className="error-box">{couponError}</div> : null}
        {couponMessage ? <div className="ok-box">{couponMessage}</div> : null}
      </div>

      <div className="card form-grid">
        <h2 className="card-title">Capabilities Matrix (No Payment)</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Free</th>
                <th>Standard</th>
                <th>Premium</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Report upload + manual mapping</td>
                <td>Yes</td>
                <td>Yes</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>Diagnosis depth</td>
                <td>Basic only</td>
                <td>Full</td>
                <td>Full</td>
              </tr>
              <tr>
                <td>Prescription items</td>
                <td>Top 3 preview</td>
                <td>Full</td>
                <td>Full</td>
              </tr>
              <tr>
                <td>Weekly adjustment</td>
                <td>No</td>
                <td>Yes</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>Premium strategy module</td>
                <td>No</td>
                <td>No</td>
                <td>Yes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card form-grid">
        <h2 className="card-title">Manual Tier Assignment (Admin)</h2>
        <p>Billing is intentionally disabled. Admin-only controls stay collapsed by default to avoid exposing sensitive workflow steps during normal use.</p>

        <details className="admin-panel">
          <summary>Reveal administrator tools</summary>
          <form className="form-grid admin-form" onSubmit={assignPlan}>
            <div className="two-col">
              <label>
                Admin secret
                <input
                  type="password"
                  value={adminSecret}
                  onChange={(event) => setAdminSecret(event.target.value)}
                  placeholder="Matches API env ADMIN_SECRET"
                  required
                />
              </label>
              <label>
                Target user ID
                <input
                  value={targetUserId}
                  onChange={(event) => setTargetUserId(event.target.value)}
                  required
                />
              </label>
              <label>
                Plan
                <select value={targetPlan} onChange={(event) => setTargetPlan(event.target.value)}>
                  <option value="FREE">FREE</option>
                  <option value="STANDARD">STANDARD</option>
                  <option value="PREMIUM">PREMIUM</option>
                </select>
              </label>
              <label>
                Status
                <select value={targetStatus} onChange={(event) => setTargetStatus(event.target.value)}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>
            </div>
            <label>
              Notes
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>
            <button className="primary-btn" type="submit">Apply Plan Assignment</button>
          </form>
        </details>

        {error ? <div className="error-box">{error}</div> : null}
        {message ? <div className="ok-box">{message}</div> : null}
      </div>
    </AppShell>
  );
}
