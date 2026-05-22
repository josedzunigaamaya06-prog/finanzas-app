export default function Card({ children, className = '', hover = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`card p-6 animate-fade-in ${hover ? 'hover:shadow-md hover:border-primary-500/20 cursor-pointer transition-all duration-200' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
