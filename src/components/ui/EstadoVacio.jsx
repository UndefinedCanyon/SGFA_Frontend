function EstadoVacio({ titulo, descripcion, accion }) {
    return (
        <div className="flex flex-col items-center text-center py-10 px-4">
            <div
                className="h-12 w-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-3"
                aria-hidden="true"
            >
                <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
                    <path d="M3.3 7.5L12 12.5l8.7-5M12 22V12.5" />
                </svg>
            </div>
            <p className="font-medium text-gray-800">{titulo}</p>
            {descripcion && <p className="text-sm text-gray-500 mt-1 max-w-sm">{descripcion}</p>}
            {accion && <div className="mt-4">{accion}</div>}
        </div>
    );
}

export default EstadoVacio;