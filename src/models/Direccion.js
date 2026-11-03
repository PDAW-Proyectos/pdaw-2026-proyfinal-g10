export class Direccion {
  constructor(calle, altura, localidad) {
    this.calle = calle;
    this.altura = altura;
    this.localidad = localidad;
  }

  comoTextoBusqueda() {
    return [[this.calle, this.altura].filter(Boolean).join(" "), this.localidad]
      .filter(Boolean)
      .join(", ");
  }
}