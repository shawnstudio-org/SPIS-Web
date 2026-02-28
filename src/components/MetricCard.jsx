export default function MetricCard({ label, value, hint, icon: Icon }) {
  return (
    <div className="card metric-card">
      <div className="metric-icon-wrap">
        {Icon && <Icon size={20} />}
      </div>
      <p className="metric-label">{label}</p>
      <h3 className="metric-value">{value}</h3>
      {hint ? <p className="metric-hint">{hint}</p> : null}
    </div>
  );
}
