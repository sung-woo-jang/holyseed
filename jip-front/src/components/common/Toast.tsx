import { useToastStore } from '@/stores/toast'

export default function Toast() {
  const { toasts, dismiss } = useToastStore()

  if (!toasts.length) return null

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => dismiss(t.id)}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
