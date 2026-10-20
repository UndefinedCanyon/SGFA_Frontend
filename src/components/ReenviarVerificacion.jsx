import { useEffect, useState } from "react";
import { reenviarVerificacion } from "../services/api";
import { Alerta, Boton, Campo } from "./ui";

const ESPERA_SEGUNDOS = 60;

function ReenviarVerificacion({ correo: correoFijo }) {
    const [correoEscrito, setCorreoEscrito] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [espera, setEspera] = useState(0);
    const [mensaje, setMensaje] = useState(null);
    const [error, setError] = useState(null);

    const correo = correoFijo ?? correoEscrito;

    useEffect(() => {
        if (espera <= 0) return;
        const temporizador = setTimeout(() => setEspera((segundos) => segundos - 1), 1000);
        return () => clearTimeout(temporizador);
    }, [espera]);

    async function reenviar(evento) {
        evento.preventDefault();
        setError(null);
        setMensaje(null);
        setEnviando(true);

        try {
            const respuesta = await reenviarVerificacion(correo);
            setMensaje(respuesta.mensaje);
            setEspera(ESPERA_SEGUNDOS);
        } catch (err) {
            setError(err.message);
        } finally {
            setEnviando(false);
        }
    }

    return (
        <form onSubmit={reenviar} className="mt-4 flex flex-col gap-3 text-left">
            {correoFijo === undefined && (
                <Campo
                    etiqueta="Correo electrónico"
                    type="email"
                    value={correoEscrito}
                    onChange={(e) => setCorreoEscrito(e.target.value)}
                    required
                    autoComplete="email"
                />
            )}

            <Boton
                type="submit"
                variante="secundario"
                cargando={enviando}
                disabled={espera > 0 || !correo.trim()}
            >
                {espera > 0 ? `Reenviar en ${espera} s` : "Reenviar correo de confirmación"}
            </Boton>

            <Alerta tipo="exito">{mensaje}</Alerta>
            <Alerta tipo="error">{error}</Alerta>
        </form>
    );
}

export default ReenviarVerificacion;