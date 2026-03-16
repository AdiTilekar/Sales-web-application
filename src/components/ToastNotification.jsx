const ToastNotification = ({ show, message }) => {
  return (
    <div className={`toast ${show ? 'show' : ''}`} role="status" aria-live="polite">
      {message}
    </div>
  )
}

export default ToastNotification
