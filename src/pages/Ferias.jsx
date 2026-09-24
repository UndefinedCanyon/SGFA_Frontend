import { useState, useEffect } from "react";
import { consultarFerias, consultarEdicionesFeria } from "../services/api";

function Ferias() {
    const [ferias, setFerias] = useState([]);
    const [feriaSeleccionada, setFeriaSeleccionada] = useState(null);
    const [ediciones, setEdiciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function cargarFerias() {
            try {
                const datos = await consultarFerias();
                setFerias(datos);
            } catch (err) {
                setError(err.message);
            } finally {
                setCargando(false);
            }
        }

        cargarFerias();
    }, []);

    async function verEdiciones(feria) {
        setFeriaSeleccionada(feria);
        setEdiciones([]);
        try {
            const datos = await consultarEdicionesFeria(feria.id);
            setEdiciones(datos);
        } catch (err) {
            setError(err.message);
        }
    }

    if (cargando) {
        return <p>Cargando ferias...</p>;
    }

    return (
        <div>
            <h2>Ferias artesanales</h2>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <ul>
                {ferias.map((feria) => (
                    <li key={feria.id}>
                        {feria.nombreFeria}{" "}
                        <button onClick={() => verEdiciones(feria)}>Ver ediciones</button>
                    </li>
                ))}
            </ul>

            {feriaSeleccionada && (
                <div>
                    <h3>Ediciones de "{feriaSeleccionada.nombreFeria}"</h3>
                    {ediciones.length === 0 && <p>Esta feria no tiene ediciones registradas.</p>}
                    <ul>
                        {ediciones.map((edicion) => (
                            <li key={edicion.id}>
                                Del {edicion.fechaInicio} al {edicion.fechaFin}
                                {" — "}Lugar ID: {edicion.idLugar}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default Ferias;