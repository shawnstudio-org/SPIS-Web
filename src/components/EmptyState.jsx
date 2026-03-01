export default function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <p className="kicker">No Data Yet</p>
      <h3>{title}</h3>
      {description ? <p className="empty-state-copy">{description}</p> : null}
      {action ? <div className="btn-row">{action}</div> : null}
    </div>
  );
}
