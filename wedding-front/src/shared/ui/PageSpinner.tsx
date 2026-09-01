import styles from './PageSpinner.module.css'

export default function PageSpinner() {
  return (
    <div className={styles.container}>
      <div className={styles.ring} />
    </div>
  )
}
