export default function PageHeader({ title, subtitle, breadcrumbs = [], actions }) {
    return (
        <div className="page-header">
            {breadcrumbs.length > 0 && (
                <div className="page-breadcrumbs">
                    {breadcrumbs.map((crumb, i) => (
                        <span key={i}>
                            {i > 0 && <span className="sep">/</span>}
                            {crumb.href ? (
                                <a href={crumb.href}>{crumb.label}</a>
                            ) : (
                                <span>{crumb.label}</span>
                            )}
                        </span>
                    ))}
                </div>
            )}
            <div className="page-header-row">
                <div>
                    <h1 className="page-title">{title}</h1>
                    {subtitle && <p className="page-subtitle">{subtitle}</p>}
                </div>
                {actions && <div className="btn-row">{actions}</div>}
            </div>
        </div>
    );
}
