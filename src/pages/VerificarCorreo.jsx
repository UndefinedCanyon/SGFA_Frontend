import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verificarCorreo } from "../services/api";
import { Alerta, Esqueleto } from "../components/ui";
import ReenviarVerificacion from "../components/ReenviarVerificacion";

const MENSAJE_INCOMPLETO =
    "El enlace está incompleto. Abre el enlace completo del correo o pide uno nuevo.";

function VerificarCorreo() {
    const [parametros] = useSearchParams();
    const token = parametros.get("token");
    const intentado = useRef(false);

    const [estado, setEstado] = useState(token ? "cargando" : "error");
    const [mensaje, setMensaje] = useState(token ? "" : MENSAJE_INCOMPLETO);

    useEffect(() => {
        if (!token || intentado.current) return;
        intentado.current = true;

        verificarCorreo(token)
            .then((respuesta) => {
                setEstado("exito");
                setMensaje(respuesta.mensaje);
            })
            .catch((err) => {
                setEstado("error");
                setMensaje(err.message);
            });
    }, [token]);

    return (
        <div className="flex justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
                    {estado === "cargando" && (
                        <div aria-live="polite">
                            <h2 className="text-xl font-semibold text-gray-900">Confirmando tu correo...</h2>
                            <div className="mt-4 flex flex-col items-center gap-2">
                                <Esqueleto className="h-4 w-48" />
                                <Esqueleto className="h-4 w-32" />
                            </div>
                        </div>
                    )}

                    {estado === "exito" && (
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900">¡Correo confirmado!</h2>
                            <Alerta tipo="exito" className="mt-4">{mensaje}</Alerta>
                            <Link
                                to="/login"
                                state={{ verificado: true }}
                                className="mt-5 inline-flex items-center justify-center rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                            >
                                Iniciar sesión
                            </Link>
                        </div>
                    )}

                    {estado === "error" && (
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900">No pudimos confirmar tu correo</h2>
                            <Alerta tipo="error" className="mt-4">{mensaje}</Alerta>

                            <p className="mt-5 text-sm font-medium text-gray-700">
                                ¿Necesitas un enlace nuevo?
                            </p>
                            <ReenviarVerificacion />

                            <Link
                                to="/login"
                                className="mt-4 inline-block text-sm font-medium text-green-700 hover:underline"
                            >
                                Ir a iniciar sesión
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VerificarCorreo;