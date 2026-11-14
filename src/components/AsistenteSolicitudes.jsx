import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { analizarSolicitudesDeEdicion } from "../services/api";
import { describirEdicion } from "../utils/helpers";
import { Alerta, Boton, Campo, Insignia } from "./ui";

function nombreProveedor(proveedor) {
    return proveedor === "Demostración" ? "Demostración (sin IA)" : `Generado por ${proveedor}`;
}

/**
 * Panel del asistente de IA: el administrador elige una edición con solicitudes pendientes y pide un
 * análisis. Solo da sugerencias; las decisiones (aprobar o rechazar) siguen siendo suyas.
 * Entrega el resultado al padre con onAnalisis para que muestre la sugerencia en cada solicitud.
 */
function AsistenteSolicitudes({ solicitudes, ediciones, ferias, lugares, onAnalisis }) {
    const { usuario } = useAuth();

    const [idEdicion, setIdEdicion] = useState("");
    const [analizando, setAnalizando] = useState(false);
    const [error, setError] = useState(null);
    const [analisis, setAnalisis] = useState(null);

    const pendientesPorEdicion = new Map();
    solicitudes
        .filter((s) => s.estado === "PENDIENTE")
        .forEach((s) => {
            pendientesPorEdicion.set(s.idEdicionFeria, (pendientesPorEdicion.get(s.idEdicionFeria) ?? 0) + 1);
        });

    const opciones = [...pendientesPorEdicion.entries()]
        .map(([id, cantidad]) => ({
            id,
            cantidad,
            texto: `${describirEdicion(id, ediciones, ferias, lugares)} (${cantidad} ${
                cantidad === 1 ? "pendiente" : "pendientes"
            })`,
        }))
        .sort((a, b) => b.cantidad - a.cantidad || a.id - b.id);

    // Si la edición elegida ya no tiene pendientes (porque se aprobaron o rechazaron), se deselecciona.
    const seleccionValida = opciones.some((o) => String(o.id) === idEdicion) ? idEdicion : "";

    function limpiar() {
        setAnalisis(null);
        onAnalisis(null);
    }

    async function analizar() {
        setError(null);
        limpiar();
        setAnalizando(true);
        try {
            const resultado = await analizarSolicitudesDeEdicion(Number(seleccionValida), usuario.token);
            setAnalisis(resultado);
            onAnalisis(resultado);
        } catch (err) {
            setError(err.message);
        } finally {
            setAnalizando(false);
        }
    }

    if (opciones.length === 0) {
        return (
            <section
                aria-label="Asistente de IA"
                className="mb-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-900"
            >
                <p className="font-medium">Asistente de IA</p>
                <p className="mt-1 text-blue-800">No hay solicitudes pendientes para analizar.</p>
            </section>
        );
    }

    return (
        <section aria-label="Asistente de IA" className="mb-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-blue-900">Asistente de IA</p>
                <Insignia tono="azul">Sugerencias</Insignia>
            </div>
            <p className="mt-1 text-sm text-blue-800">
                Elige una edición y el asistente resumirá sus solicitudes pendientes y sugerirá cuáles revisar primero.
                Tú decides siempre.
            </p>

            <div className="mt-3 flex flex-wrap items-end gap-3">
                <Campo
                    className="min-w-0 flex-1 sm:max-w-xl"
                    etiqueta="Edición a analizar"
                    as="select"
                    value={seleccionValida}
                    onChange={(e) => {
                        setIdEdicion(e.target.value);
                        setError(null);
                        limpiar();
                    }}
                    disabled={analizando}
                >
                    <option value="">Selecciona una edición</option>
                    {opciones.map((o) => (
                        <option key={o.id} value={o.id}>{o.texto}</option>
                    ))}
                </Campo>

                <Boton onClick={analizar} cargando={analizando} disabled={!seleccionValida}>
                    {analizando ? "Analizando..." : "Analizar con IA"}
                </Boton>
            </div>

            <Alerta tipo="error" className="mt-3">{error}</Alerta>

            {analisis && (
                <div className="mt-4 rounded-lg border border-blue-100 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-semibold text-gray-900">Análisis del asistente</h4>
                        <Insignia tono="azul">{nombreProveedor(analisis.proveedor)}</Insignia>
                    </div>

                    <p className="mt-2 text-sm text-gray-700">{analisis.resumen}</p>

                    <p className="mt-2 text-xs text-gray-500">
                        {analisis.cuposDisponibles === null || analisis.cuposDisponibles === undefined
                            ? "Sin límite de cupo."
                            : `Cupos disponibles: ${analisis.cuposDisponibles}.`}{" "}
                        Analizadas {analisis.analizadas} de {analisis.totalPendientes} pendientes.
                        {analisis.analizadas < analisis.totalPendientes &&
                            " Solo se analizan las más antiguas de cada vez."}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                        Sugerencia automática: revísala antes de decidir. Las sugerencias aparecen en cada solicitud pendiente.
                    </p>

                    <div className="mt-3">
                        <Boton variante="secundario" tamano="sm" onClick={limpiar}>
                            Cerrar análisis
                        </Boton>
                    </div>
                </div>
            )}
        </section>
    );
}

export default AsistenteSolicitudes;
