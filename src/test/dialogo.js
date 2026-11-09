// jsdom no implementa showModal() ni close() del elemento <dialog>.
// Esta función los simula marcando el atributo "open", como hace el navegador.
export function instalarDialogo() {
    HTMLDialogElement.prototype.showModal = function showModal() {
        this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function close() {
        this.removeAttribute("open");
    };
}
