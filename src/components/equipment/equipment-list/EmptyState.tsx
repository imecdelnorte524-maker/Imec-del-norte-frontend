import styles from "../../../styles/components/equipment/equipment-list/EmptyState.module.css"

interface EmptyStateProps {
  message: string
}

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <p>{message}</p>
    </div>
  )
}
