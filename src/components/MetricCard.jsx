export default function MetricCard({ label, value, hint }) {
  return (
    <div className="card metric-card">
      <p className="metric-label">{label}</p>
      <h3 className="metric-value">{value}</h3>
      {hint ? <p className="metric-hint">{hint}</p> : null}
    </div>
  );
}
