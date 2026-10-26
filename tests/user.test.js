import { RepositorioUsuarios } from "../src/models/repositorioUsuarios.js";
import { Cliente } from "../src/models/Cliente.js";
import { Propietario } from "../src/models/Propietario.js";

describe("RepositorioUsuarios", () => {
  let repositorio;

  beforeEach(() => {
    repositorio = new RepositorioUsuarios();
  });

  test("Añadir distintos tipos de usuarios", () => {
    const user1 = { nombre: "Juan", correo: "juan@gmail.com", contrasena: "1234/aAa", tipo: "Cliente" };
    const user2 = { nombre: "Maria", correo: "maria@gmail.com", contrasena: "5678/BbB", tipo: "Propietario" };
    const usuarios = [user1, user2];
    repositorio.cargarDesde(usuarios);
    expect(repositorio.usuarios[0]).toBeInstanceOf(Cliente);
    expect(repositorio.usuarios[1]).toBeInstanceOf(Propietario);
  });


  test("probar error al agregar usuario con correo inválido", async () => {
    await expect(repositorio.agregarUsuario({"nombre": "Juan", "correo": "", "contrasena": "1234/aAa", "tipo": "Cliente"})).rejects.toThrow("El correo es obligatorio");
    await expect(repositorio.agregarUsuario({"nombre": "Maria", "correo": "mariagmail", "contrasena": "1234/aAa", "tipo": "Propietario"})).rejects.toThrow("El correo no es válido");
  });

  test("probar error al agregar usuario con contraseña débil o invalida", async () => {
    await expect(repositorio.agregarUsuario({"nombre": "Juan", "correo": "juan@gmail.com", "contrasena": "", "tipo": "Cliente"})).rejects.toThrow("La contraseña es obligatoria");
    await expect(repositorio.agregarUsuario({"nombre": "Maria", "correo": "maria@gmail.com", "contrasena": "1234", "tipo": "Propietario"})).rejects.toThrow("La contraseña no es segura, debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo");
  })

  test("probar error al agregar usuario con nombre invalido", async () => {
    await expect(repositorio.agregarUsuario({"nombre": "", "correo": "juan@gmail.com", "contrasena": "1234/aAa", "tipo": "Cliente"})).rejects.toThrow("El nombre es obligatorio");
    await expect(repositorio.agregarUsuario({"nombre": "Ma", "correo": "maria@gmail.com", "contrasena": "1234/aAa", "tipo": "Propietario"})).rejects.toThrow("El nombre debe tener entre 3 y 30 caracteres");
  });

    test("probar error al cargar usuarios con correos duplicados", async () => {
        repositorio.agregarUsuario({"nombre": "Juan", "correo": "juan@gmail.com", "contrasena": "1234/aAa", "tipo": "Cliente"});
        await expect(repositorio.agregarUsuario({"nombre": "Maria", "correo": "juan@gmail.com", "contrasena": "5678/BbB", "tipo": "Propietario"})).rejects.toThrow("El correo juan@gmail.com ya está registrado");
    });
});