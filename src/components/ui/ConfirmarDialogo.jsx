import { useEffect, useRef } from "react";
import Boton from "./Boton";

function ConfirmarDialogo({
    abierto,
    titulo,
    mensaje,
    textoConfirmar = "Confirmar",
    peligro = false,
    cargando = false,
    onConfirmar,
    onCancelar,
}) {
    const ref = useRef(null);

    useEffect(() => {
        const dialogo = ref.current;
        if (!dialogo) return;
        if (abierto && !dialogo.open) dialogo.showModal();
        if (!abierto && dialogo.open) dialogo.close();
    }, [abierto]);

    return (
        <dialog
            ref={ref}
            onCancel={(evento) => {
                evento.preventDefault();
                onCancelar();
            }}
            className="m-auto w-full max-w-md rounded-2xl p-0 shadow-xl backdrop:bg-black/40"
        >
            <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{titulo}</h3>
                <p className="text-sm text-gray-600 mb-6">{mensaje}</p>
                <div className="flex justify-end gap-2">
                    <Boton variante="secundario" onClick={onCancelar}>
                        Cancelar
                    </Boton>
                    <Boton
                        variante={peligro ? "peligro" : "primario"}
                        cargando={cargando}
                        onClick={onConfirmar}
                    >
                        {textoConfirmar}
                    </Boton>
                </div>
            </div>
        </dialog>
    );
}

export default ConfirmarDialogo;