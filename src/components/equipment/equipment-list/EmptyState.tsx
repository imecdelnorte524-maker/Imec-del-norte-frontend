// components/equipment/equipment-list/EmptyState.tsx
import styles from "../../../styles/components/equipment/equipment-list/EmptyState.module.css"

interface EmptyStateProps {
  message: string
  actionText?: string
  onAction?: () => void
  showAction?: boolean
}

export default function EmptyState({ 
  message, 
  actionText, 
  onAction, 
  showAction = false 
}: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <p>{message}</p>
      {showAction && actionText && onAction && (
        <button 
          className={styles.actionButton}
          onClick={onAction}
        >
          {actionText}
        </button>
      )}
    </div>
  )
}