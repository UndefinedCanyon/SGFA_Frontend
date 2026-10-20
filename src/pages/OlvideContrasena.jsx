import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { solicitarRecuperacion } from "../services/api";
import { Alerta, Boton, Campo } from "../components/ui";

const ESPERA_SEGUNDOS = 60;

function OlvideContrasena() {
    const [correo, setCorreo] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [espera, setEspera] = useState(0);
    const [mensaje, setMensaje] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (espera <= 0) return;
        const temporizador = setTimeout(() => setEspera((segundos) => segundos - 1), 1000);
        return () => clearTimeout(temporizador);
    }, [espera]);

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setError(null);
        setMensaje(null);
        setEnviando(true);

        try {
            const respuesta = await solicitarRecuperacion(correo);
            setMensaje(respuesta.mensaje);
            setEspera(ESPERA_SEGUNDOS);
        } catch (err) {
            setError(err.message);
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="flex justify-center px-4 py-12">
            <div className="w-full max-w-sm">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">Recupera tu contraseña</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Escribe tu correo y te enviaremos un enlace para elegir una nueva.
                    </p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
                        <Campo
                            etiqueta="Correo electrónico"
                            type="email"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            required
                            autoComplete="email"
                            autoFocus
                        />

                        <Alerta tipo="error">{error}</Alerta>
                        <Alerta tipo="exito">
                            {mensaje && `${mensaje} El enlace vence en 1 hora. Si no llega, mira en spam.`}
                        </Alerta>

                        <Boton type="submit" cargando={enviando} disabled={espera > 0}>
                            {espera > 0
                                ? `Reenviar en ${espera} s`
                                : mensaje
                                  ? "Enviar de nuevo"
                                  : "Enviar enlace"}
                        </Boton>
                    </form>
                </div>

                <p className="mt-6 text-sm text-gray-500 text-center">
                    <Link to="/login" className="text-green-700 font-medium hover:underline">
                        Volver a iniciar sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default OlvideContrasena;