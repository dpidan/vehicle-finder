import styles from './App.module.css';

export function App() {
  const isDashboard = window.location.pathname.startsWith('/app');

  return isDashboard ? <DashboardShell /> : <PublicHome />;
}

function PublicHome() {
  return (
    <main className={styles.publicPage}>
      <section className={styles.publicIntro}>
        <p className={styles.eyebrow}>Vehicle Finder</p>
        <h1>Find the right used vehicle faster.</h1>
        <p>
          A small family search tool for collecting listings, ranking candidates,
          tracking workflow state, and watching price changes.
        </p>
        <a className={styles.primaryLink} href="/app">
          Open dashboard
        </a>
      </section>
    </main>
  );
}

function DashboardShell() {
  return (
    <main className={styles.appShell}>
      <header className={styles.toolbar}>
        <div>
          <p className={styles.eyebrow}>Dashboard</p>
          <h1>Family replacement vehicle</h1>
        </div>
        <span className={styles.status}>Shell</span>
      </header>
      <section className={styles.emptyState}>
        <h2>Dashboard scaffold is ready.</h2>
        <p>Next up: load saved searches and ranked listings from the existing API.</p>
      </section>
    </main>
  );
}
