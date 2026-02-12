interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

function ErrorMessage({
  message,
  onRetry,
}: ErrorMessageProps): React.JSX.Element {
  return (
    <div className="error-message">
      <p>Error: {message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
