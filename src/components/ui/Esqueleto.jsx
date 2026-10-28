function Esqueleto({ className = "h-4 w-full" }) {
    return <div className={`esqueleto rounded bg-gray-200 ${className}`} aria-hidden="true" />;
}

export default Esqueleto;