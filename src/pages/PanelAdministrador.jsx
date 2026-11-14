import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
    consultarTodasLasSolicitudes, consultarTodosLosArtesanos, consultarTodasLasFerias,
    consultarLugares, consultarTodasLasEdiciones, consultarOcupacion,
} from "../services/api";
import { Alerta, Boton, Esqueleto, Pestanas, PanelPestana, EncabezadoPagina } from "../components/ui";
import GestionSolicitudes from "../components/GestionSolicitudes";
import GestionFerias from "../components/GestionFerias";
import GestionEdiciones from "../components/GestionEdiciones";
import GestionArtesanos from "../components/GestionArtesanos";
import GestionLugares from "../components/GestionLugares";

function Estadistica({ etiqueta, valor, cargando, destacada = false }) {
    return (
        <div
            className={`rounded-2xl border border-t-4 p-4 shadow-sm ${
                destacada ? "border-amber-200 border-t-ocre-400 bg-ocre-50" : "border-gray-200 border-t-brand-500 bg-white"
            }`}
        >
            <p className="text-xs text-gray-500">{etiqueta}</p>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
                {cargando ? <Esqueleto className="h-8 w-10" /> : valor}
            </div>
        </div>
    );
}

function PanelAdministrador() {
    const { usuario } = useAuth();

    const [pestana, setPestana] = useState("solicitudes");

    const [solicitudes, setSolicitudes] = useState([]);
    const [artesanos, setArtesanos] = useState([]);
    const [ferias, setFerias] = useState([]);
    const [lugares, setLugares] = useState([]);
    const [ediciones, setEdiciones] = useState([]);
    const [ocupaciones, setOcupaciones] = useState({});

    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState(null);

    async function recargar() {
        try {
            const [datosSolicitudes, datosArtesanos, datosFerias, datosLugares, datosEdiciones] =
                await Promise.all([
                    consultarTodasLasSolicitudes(usuario.token),
                    consultarTodosLosArtesanos(usuario.token),
                    consultarTodasLasFerias(usuario.token),
                    consultarLugares(),
                    consultarTodasLasEdiciones(usuario.token),
                ]);

            const listaOcupaciones = await Promise.all(
                datosEdiciones.map((edicion) => consultarOcupacion(edicion.id))
            );
            const mapa = {};
            datosEdiciones.forEach((edicion, i) => {
                mapa[edicion.id] = listaOcupaciones[i];
            });

            setSolicitudes(datosSolicitudes);
            setArtesanos(datosArtesanos);
            setFerias(datosFerias);
            setLugares(datosLugares);
            setEdiciones(datosEdiciones);
            setOcupaciones(mapa);
            setErrorCarga(null);
        } catch (err) {
            setErrorCarga(err.message);
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        void recargar();
    }, []);

    const pendientes = solicitudes.filter((s) => s.estado === "PENDIENTE").length;

    const pestanas = [
        {
            id: "solicitudes",
            etiqueta: "Solicitudes",
            contador: pendientes > 0 ? pendientes : undefined,
        },
        { id: "ferias", etiqueta: "Ferias y ediciones" },
        {
            id: "artesanos",
            etiqueta: "Artesanos",
            contador: cargando ? undefined : artesanos.length,
        },
        {
            id: "lugares",
            etiqueta: "Lugares",
            contador: cargando ? undefined : lugares.length,
        },
    ];

    return (
        <>
        <EncabezadoPagina
            foto="panel"
            ancho="max-w-5xl"
            titulo="Panel de administrador"
            descripcion={`Hola, ${usuario.nombre}. Gestiona las ferias, las solicitudes y los artesanos.`}
        />
        <div className="max-w-5xl mx-auto px-6 py-10">
            {errorCarga && (
                <Alerta tipo="error" className="mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <span>{errorCarga}</span>
                        <Boton variante="secundario" tamano="sm" onClick={recargar}>
                            Reintentar
                        </Boton>
                    </div>
                </Alerta>
            )}

            <div className="grid grid-cols-2 gap-3 mb-8 md:grid-cols-4">
                <Estadistica
                    etiqueta="Solicitudes pendientes"
                    valor={pendientes}
                    cargando={cargando}
                    destacada={!cargando && pendientes > 0}
                />
                <Estadistica
                    etiqueta="Ferias activas"
                    valor={ferias.filter((f) => f.activo).length}
                    cargando={cargando}
                />
                <Estadistica
                    etiqueta="Ediciones activas"
                    valor={ediciones.filter((e) => e.activo).length}
                    cargando={cargando}
                />
                <Estadistica
                    etiqueta="Artesanos activos"
                    valor={artesanos.filter((a) => a.activo).length}
                    cargando={cargando}
                />
            </div>

            <Pestanas
                idBase="panel-admin"
                pestanas={pestanas}
                activa={pestana}
                onCambiar={setPestana}
            />

            <div className="mt-6">
                <PanelPestana idBase="panel-admin" id="solicitudes" activa={pestana}>
                    <GestionSolicitudes
                        solicitudes={solicitudes}
                        artesanos={artesanos}
                        ediciones={ediciones}
                        ferias={ferias}
                        lugares={lugares}
                        ocupaciones={ocupaciones}
                        cargando={cargando}
                        onCambio={recargar}
                    />
                </PanelPestana>

                <PanelPestana idBase="panel-admin" id="ferias" activa={pestana}>
                    <GestionFerias
                        ferias={ferias}
                        ediciones={ediciones}
                        cargando={cargando}
                        onCambio={recargar}
                    />
                    <GestionEdiciones
                        ferias={ferias}
                        lugares={lugares}
                        ediciones={ediciones}
                        ocupaciones={ocupaciones}
                        cargando={cargando}
                        onCambio={recargar}
                    />
                </PanelPestana>

                <PanelPestana idBase="panel-admin" id="artesanos" activa={pestana}>
                    <GestionArtesanos
                        artesanos={artesanos}
                        cargando={cargando}
                        onCambio={recargar}
                    />
                </PanelPestana>

                <PanelPestana idBase="panel-admin" id="lugares" activa={pestana}>
                    <GestionLugares
                        ediciones={ediciones}
                        lugares={lugares}
                        cargando={cargando}
                        onCambio={recargar}
                    />
                </PanelPestana>
            </div>
        </div>
        </>
    );
}

export default PanelAdministrador;