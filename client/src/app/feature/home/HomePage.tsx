import { Link } from 'react-router-dom';
import './HomePage.css';

function Diamond({
    to,
    title,
    subtitle,
}: {
    to: string;
    title: string;
    subtitle: string;
}) {
    return (
        <Link className="diamond" to={to}>
            <span className="diamond__inner">
                <span className="diamond__title">{title}</span>
                <span className="diamond__subtitle">{subtitle}</span>
            </span>
        </Link>
    );
}

export default function HomePage() {
    return (
        <div className="home">
            <header className="home__header">
                <div className="home__brand">
                    <div className="home__brand-mark" />
                    <div className="home__brand-name">PawnExpress</div>
                </div>
                <div className="home__clock">
                    {new Date().toLocaleString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </div>
            </header>

            <main className="home__main">
                <h1 className="home__title">Welcome back 👋</h1>
                <p className="home__subtitle">Choose an action to get started.</p>

                <div className="home__actions">
                    <Diamond to="/Pawn" title="Pawn" subtitle="Pawn / Buy" />
                    <Diamond to="/Payments" title="Payments" subtitle="Pay Pawn" />
                    <Diamond to="/Sales" title="Sales" subtitle="Sale" />
                    <Diamond to="/logout" title="Sign out" subtitle="Back to login" />
                </div>

                <section className="home__recent">
                    <div className="home__recent-title">Recent activity</div>
                    <div className="home__recent-box">No recent items yet.</div>
                </section>
            </main>
        </div>
    );
}