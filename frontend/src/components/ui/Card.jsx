export default function Card({ children, className = '', hover = false, onClick, padding = 'p-5 md:p-6' }) {
  return (
    <div
      onClick={onClick}
      className={`${hover ? 'card-hover' : 'card'} ${padding} animate-fade-in ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
