export type AdminAlertTheme = "green" | "orange" | "neutral";

type Props = {
  theme: AdminAlertTheme;
  title: string;
  message: string;
  onDismiss?: () => void;
};

// Alerts never rely on color alone: the icon and the title carry the meaning too.
function AlertIcon({ theme }: { theme: AdminAlertTheme }) {
  const paths = {
    green: <path d="M5 12.5l4.5 4.5L19 7.5" />,
    orange: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5.5" />
        <path d="M12 16.4v.01" />
      </>
    ),
    neutral: (
      <>
        <path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15z" />
        <path d="M10 20.5h4" />
      </>
    ),
  }[theme];

  return (
    <svg
      className="admin-alert-icon"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}

export default function AdminAlert({ theme, title, message, onDismiss }: Props) {
  return (
    <div className={`admin-alert admin-alert--${theme}`}>
      <AlertIcon theme={theme} />
      <div className="admin-alert-body">
        <strong className="admin-alert-title">{title}</strong>
        <p className="admin-alert-text">{message}</p>
      </div>
      {onDismiss ? (
        <button
          className="admin-alert-close"
          type="button"
          aria-label="Dismiss notification"
          onClick={onDismiss}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
