import styles from '../../App.module.css';

export function PublicHome() {
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
