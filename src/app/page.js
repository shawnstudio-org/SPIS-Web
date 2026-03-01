import Link from 'next/link';

export default function LandingPage() {
  return (
    <>
      <section className="landing-hero">
        <span className="landing-badge">🎓 NSW Selective Test Prep</span>
        <h1 className="landing-title">
          Smart Prep for <span className="accent">Selective Test</span> Success
        </h1>
        <p className="landing-desc">
          SPIS turns your mock test reports into AI-powered diagnoses, personalized daily practice,
          and data-driven study strategies. Stop guessing, start improving.
        </p>
        <div className="landing-cta">
          <Link href="/register" className="primary-btn" style={{ padding: '14px 32px', fontSize: '1rem' }}>
            Get Started Free
          </Link>
          <Link href="/login" className="secondary-btn" style={{ padding: '14px 32px', fontSize: '1rem' }}>
            Log In
          </Link>
        </div>
      </section>

      <section className="landing-features">
        <h2 className="landing-features-title">How SPIS Works</h2>
        <div className="feature-grid">
          <div className="card feature-card">
            <div className="feature-card-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>📤</div>
            <h3>Upload Reports</h3>
            <p>Upload PDF reports, photos, or manually enter scores from your mock tests across Reading, Math, Thinking Skills, and Writing.</p>
          </div>
          <div className="card feature-card">
            <div className="feature-card-icon" style={{ background: 'var(--secondary-soft)', color: 'var(--secondary)' }}>🔬</div>
            <h3>AI Analysis</h3>
            <p>Our engine classifies every error by type, identifies cognitive patterns, and surfaces your biggest weaknesses with precision.</p>
          </div>
          <div className="card feature-card">
            <div className="feature-card-icon" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}>✏️</div>
            <h3>Daily Practice</h3>
            <p>Get personalized daily question sets that target your weakest areas. Practice smarter, not harder, every single day.</p>
          </div>
          <div className="card feature-card">
            <div className="feature-card-icon" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>📈</div>
            <h3>Track Progress</h3>
            <p>Watch your error rates drop, skill balance improve, and predicted band climb over time with clear visualizations.</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} SPIS — Selective Performance Intelligence System</p>
      </footer>
    </>
  );
}
