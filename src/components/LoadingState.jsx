export default function LoadingState({ text = 'Loading...' }) {
  return (
    <div className="loading-wrap">
      <div className="loader" />
      <p>{text}</p>
    </div>
  );
}
