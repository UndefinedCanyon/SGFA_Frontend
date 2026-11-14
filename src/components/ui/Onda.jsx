// Divisor ondulado: toma el color del texto (currentColor) para fundirse con la sección siguiente.
function Onda({ className = "" }) {
    return (
        <svg
            viewBox="0 0 1440 80"
            preserveAspectRatio="none"
            aria-hidden="true"
            className={`block h-8 w-full sm:h-12 ${className}`}
        >
            <path
                fill="currentColor"
                d="M0,44 C180,84 360,4 600,34 C840,64 1080,10 1260,36 C1350,49 1400,46 1440,40 L1440,80 L0,80 Z"
            />
        </svg>
    );
}

export default Onda;
