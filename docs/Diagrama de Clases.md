---
config:
  layout: elk
---

classDiagram

class Vehiculo {
String tipo
String patente
String marca
String modelo
int anio
}

class Propiedad {
String tipo
Direccion direccion
}

class Direccion {
String calle
int altura
String Piso
String Departamento
}

class Producto {
int idProducto
string nombre
int promedioValoracion
Imagen imagen

}

class Usuario {
int idUsuario
String nombre
String email
String contrasenaHash
String telefono
Date fechaRegistro
iniciarSesion(email, contrasena)
cerrarSesion()
editarPerfil()
consultarHistorial()
}
class Propietario {
string tipo
[Publicacion] publicaciones
[Producto] productos

}
class Cliente {
string tipo
ValoracionCliente(propietario)
}

class Publicacion {
int idPublicacion
String titulo
String descripcion
String direccion
Decimal precio
String disponibilidad
string estado
Date fechaCreacion
crear()
editar()
desactivar()
consultarDetalle()
valorarPublicacion()
}

class Alquiler {
int idAlquiler
Date fechaInicio
Date fechaFin
Decimal precioTotal
string estado
Date fechaSolicitud
crearSolicitud()
cancelar()
finalizar()
}

class Valoracion {
Usuario emisor  
int puntuacion
String comentario
Date fecha
}
class RepoUsuarios {
[Usuario] usuarios
buscarPorEmail()
buscarUsuarioActivo()
cargarDesdeJSON(datos)
agregarUsuario(nombre,correo,contraseña)
agregarCliente(nombre,correo,contraseña)
agregarProveedor(nombre,correo,contraseña)
}
class RepoPublicaciones {
[Publicacion] publicaciones
buscarPorId()
buscarPublicacionActivo()
cargarDesdeJSON(datos)
}

class Reporte {
int idReporte
String motivo
String descripcion
Date fecha
string estado
registrar()
consultarEstado()
}

Usuario <|-- Propietario
Usuario <|-- Cliente
Producto <|-- Vehiculo
Producto <|-- Propiedad
Reporte --> Usuario
Propiedad --> "1" Direccion
Propietario --> "0..1" Producto : tiene
Propietario --> "0..1" Publicacion : tiene
RepoPublicaciones --> "0.._" Publicacion
RepoUsuarios --> "0.._" Usuario

Cliente "1" --> "0.._" Alquiler
Publicacion "1" --> "0.._" Alquiler : se alquila en
Propietario "1" --> "0.._" Valoracion : autor
Alquiler "1" --> "0..1" Valoracion : recibe
Cliente "1" --> "0.._" Valoracion : cliente valorado
Propietario "1" --> "0.._" Valoracion : propietario evaluador
Alquiler "1" --> "0..1" Valoracion : genera
Usuario "1" --> "0.._" Reporte : reportante
Publicacion "1" --> "0..\*" Reporte : reportada
