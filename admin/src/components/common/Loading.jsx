import './common.css';

export default function Loading({ size = 'md', text = 'Loading...' }) {
  return (
    <div className={`loading-container loading-${size}`}>
      <div className="spinner" />
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
}
