interface LoadingSpinnerProps {
  message?: string;
}

function LoadingSpinner({
  message = "Loading...",
}: LoadingSpinnerProps): React.JSX.Element {
  return (
    <div className="loading-spinner">
      <div className="spinner" />
      <p>{message}</p>
    </div>
  );
}

export default LoadingSpinner;
