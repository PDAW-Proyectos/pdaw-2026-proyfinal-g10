---
config:
  layout: elk
---

classDiagram

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
RepoPublicaciones

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

class ValoracionPublicacion {
int idValoracion
int puntuacion
String comentario
Date fecha
registrar()
}

class ValoracionCliente {
int idValoracion
int puntuacion
String comentario
Date fecha
registrar()
}
class RepoUsuarios {
array Usuario
buscarPorEmail()
buscarUsuarioActivo()
cargarDesde(datos)
agregarUsuario(nombre,correo,contraseña)
agregarCliente(nombre,correo,contraseña)
agregarProveedor(nombre,correo,contraseña)
}
class RepoPublicaciones {
Array Publicacion
buscarPorId()
buscarPublicacionActivo()
cargarDesde(datos)
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
Reporte --> Usuario
Propietario "1" --> "1" RepoPublicaciones
RepoPublicaciones "1" --> "0.._" Publicacion
RepoUsuarios "1" --> "0.._" Usuario

Cliente "1" --> "0.._" Alquiler
Publicacion "1" --> "0.._" Alquiler : se alquila en
Propietario "1" --> "0.._" ValoracionPublicacion : autor
Alquiler "1" --> "0..1" ValoracionPublicacion : recibe
Cliente "1" --> "0.._" ValoracionCliente : cliente valorado
Propietario "1" --> "0.._" ValoracionCliente : propietario evaluador
Alquiler "1" --> "0..1" ValoracionCliente : genera
Usuario "1" --> "0.._" Reporte : reportante
Publicacion "1" --> "0..\*" Reporte : reportada
