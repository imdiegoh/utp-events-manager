[![eventos.png](https://i.postimg.cc/vHt4LFhf/eventos.png)](https://postimg.cc/fJkWDP6R)

# 🎓 Sistema de Gestión de Eventos UTP

Sistema web para la gestión de eventos de la Universidad Tecnológica de Panamá (UTP). Permite a los administradores crear y gestionar eventos, mientras que los usuarios pueden ver y registrarse en los eventos disponibles.

## 🔑 Acceso Rápido

**Acceso Administrador:**
- Usuario: admin
- Contraseña: 123456

## 🚀 Comenzando

### Para Usuarios
1. Crea una cuenta o inicia sesión
2. Explora los eventos disponibles
3. Haz clic en cualquier evento para ver más detalles
4. Utiliza el botón "Registrarse" para inscribirte en los eventos
5. Visualiza tus eventos registrados en la sección "Mis Eventos"

### Para Administradores
1. Inicia sesión con las credenciales de administrador
2. Crea nuevos eventos usando el botón "Crear Evento"
3. Elimina eventos existentes cuando sea necesario

## 📋 Instalación

### Requisitos Previos
1. Instala [Node.js](https://nodejs.org/) (versión 14.0 o superior)
2. Instala [SQLite](https://www.sqlite.org/download.html)

### Configuración del Proyecto
1. Clona o descarga este repositorio
2. Ejecuta estos comandos en tu terminal:
   ```bash
   npm install
   npm start
   ```
3. Abre `http://localhost:3000` en tu navegador

## 🔄 Control de Versiones

Para subir cambios a GitHub:

1. Si es la primera vez:
   ```bash
   git init
   git add .
   git commit -m "Commit inicial"
   git branch -M main
   git remote add origin [URL-de-tu-repositorio]
   git push -u origin main
   ```

2. Para actualizaciones posteriores:
   ```bash
   git add .
   git commit -m "Descripción de los cambios"
   git push
   ```

### ⚠️ Nota
Asegúrate de no incluir información sensible en el repositorio. El archivo `.gitignore` está configurado para excluir:
- node_modules/
- .env (archivos de configuración)
- uploads/ (archivos subidos por usuarios)