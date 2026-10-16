const TONOS = {
    verde: "bg-green-100 text-green-800",
    rojo: "bg-red-100 text-red-800",
    ambar: "bg-amber-100 text-amber-800",
    azul: "bg-blue-100 text-blue-800",
    gris: "bg-gray-100 text-gray-700",
};

function Insignia({ tono = "gris", children }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${TONOS[tono]}`}
        >
            {children}
        </span>
    );
}

export default Insignia;