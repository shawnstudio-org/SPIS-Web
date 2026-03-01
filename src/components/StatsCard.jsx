export default function StatsCard({ label, value, icon, trend, trendLabel, color = 'green', hint }) {
    const trendDir = trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat';
    return (
        <div className={`card stat-card ${color}`}>
            {icon && <div className={`stat-icon ${color}`}>{icon}</div>}
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
            {trend !== undefined && trend !== null && (
                <span className={`stat-trend ${trendDir}`}>
                    {trendDir === 'up' ? '↑' : trendDir === 'down' ? '↓' : '→'}
                    {' '}{Math.abs(trend)}%
                    {trendLabel && ` ${trendLabel}`}
                </span>
            )}
            {hint && <div className="stat-hint">{hint}</div>}
        </div>
    );
}
