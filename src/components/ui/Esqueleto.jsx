function Esqueleto({ className = "h-4 w-full" }) {
    return <div className={`animate-pulse rounded bg-gray-200 ${className}`} aria-hidden="true" />;
}

export default Esqueleto;