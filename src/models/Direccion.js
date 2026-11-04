export class Direccion {
  constructor(calle, altura, localidad = "Bahía Blanca, Buenos Aires, Argentina") {
    this.calle = calle;
    this.altura = altura;
    this.localidad = localidad;
    this.direccionCompleta = this.comoTextoBusqueda();
  }

  comoTextoBusqueda() {
    return [[this.calle, this.altura].filter(Boolean).join(" "), this.localidad]
      .filter(Boolean)
      .join(", ");
  }
}