import { describe, expect, test } from "@jest/globals";
import { filtrarPublicaciones } from "../public/js/filtrosPublicaciones.js";

describe("filtros de publicaciones", () => {
  const publicaciones = [
    { titulo: "A", precio: 500, calificacion: 4, cantidadValoraciones: 2 },
    { titulo: "B", precio: 250, calificacion: 5, cantidadValoraciones: 1 },
    { titulo: "C", precio: 750, calificacion: 3, cantidadValoraciones: 8 }
  ];

  test("filtra por precio máximo y ordena sin modificar el arreglo original", () => {
    const resultado = filtrarPublicaciones(publicaciones, "500", "menor-precio");

    expect(resultado.map(({ titulo }) => titulo)).toEqual(["B", "A"]);
    expect(publicaciones.map(({ titulo }) => titulo)).toEqual(["A", "B", "C"]);
  });

  test("ordena por calificación y cantidad de valoraciones", () => {
    expect(
      filtrarPublicaciones(publicaciones, "", "mayor-calificacion").map(({ titulo }) => titulo)
    ).toEqual(["B", "A", "C"]);
    expect(
      filtrarPublicaciones(publicaciones, "", "cantidad-valoraciones").map(({ titulo }) => titulo)
    ).toEqual(["C", "A", "B"]);
  });

  test("conserva el orden original si no se selecciona un criterio", () => {
    expect(filtrarPublicaciones(publicaciones).map(({ titulo }) => titulo)).toEqual(["A", "B", "C"]);
  });

  test("filtra las publicaciones propias junto con el precio máximo", () => {
    const conAutores = [
      { titulo: "Propia económica", precio: 200, autor: "dueño@example.com" },
      { titulo: "Propia cara", precio: 600, autor: "DUEÑO@example.com" },
      { titulo: "Ajena", precio: 100, autor: "otra@example.com" }
    ];

    expect(
      filtrarPublicaciones(conAutores, "500", "", true, " dueño@example.com ")
        .map(({ titulo }) => titulo)
    ).toEqual(["Propia económica"]);
  });
});
