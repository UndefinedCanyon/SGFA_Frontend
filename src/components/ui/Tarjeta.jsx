function Tarjeta({ titulo, descripcion, acciones, className = "", children }) {
    return (
        <section className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}>
            {(titulo || acciones) && (
                <header className="flex flex-wrap items-start justify-between gap-3 px-6 pt-6">
                    <div>
                        {titulo && <h3 className="text-lg font-semibold text-gray-900">{titulo}</h3>}
                        {descripcion && <p className="text-sm text-gray-500 mt-0.5">{descripcion}</p>}
                    </div>
                    {acciones}
                </header>
            )}
            <div className="p-6">{children}</div>
        </section>
    );
}

export default Tarjeta;