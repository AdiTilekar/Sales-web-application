const ToastNotification = ({ show, message, actionLabel, onAction }) => {
  return (
    <div
      className={`toast ${show ? 'show' : ''} ${actionLabel ? 'toast-with-action' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className="toast-message">{message}</span>
      {actionLabel && onAction ? (
        <button
          type="button"
          className="toast-action-btn"
          onClick={(event) => {
            event.stopPropagation()
            onAction()
          }}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

export default ToastNotification
