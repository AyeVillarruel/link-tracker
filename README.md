# 📌 Link Tracker API

Esta es una API para acortar enlaces y redirigirlos a sus URLs originales. Incluye autenticación opcional mediante contraseña y estadísticas de uso.

## 🚀 Configuración del Proyecto

### 📦 Instalación

1. **Clonar el repositorio:**
   ```sh
   git clone https://github.com/AyeVillarruel/link-tracker.git
   cd link-tracker
   ```

2. **Instalar dependencias:**
   ```sh
   npm install
   ```

3. **Configurar variables de entorno:**
   - Copia el archivo de ejemplo y renómbralo a `.env`:
     ```sh
     cp .env.example .env
     ```
   - Edita el archivo `.env` y reemplaza los valores con tus credenciales de MySQL:
     ```sh
     DB_HOST=localhost
     DB_PORT=3306
     DB_USER=tu_usuario
     DB_PASSWORD=tu_contraseña
     DB_NAME=link_tracker_db
     ```

## 🟩 Configuración de la Base de Datos

Antes de ejecutar el proyecto, necesitas crear una base de datos en MySQL. Asegúrete de tener MySQL instalado y en ejecución.

### **📌 Creación de la base de datos en MySQL**

1. **Abre MySQL desde la terminal o consola:**  
   ```sh
   mysql -u root -p
   ```
   *(Si tu usuario no es `root`, reemplázalo con el usuario correcto).*

2. **Crea la base de datos:**  
   ```sql
   CREATE DATABASE link_tracker_db;
   ```

3. **Verifica que la base de datos se creó correctamente:**  
   ```sql
   SHOW DATABASES;
   ```

4. **Cierra MySQL escribiendo:**  
   ```sql
   EXIT;
   ```

## 🏃‍♀️ Ejecución del Proyecto

Para iniciar el servidor en modo desarrollo:
```sh
npm run start
```

Para ver la documentación Swagger, accede a:
```
http://localhost:3000/api
```

## 🛠️ Endpoints

### **Crear un enlace acortado**
- **Método:** `POST /links`
- **Cuerpo:**
  ```json
  {
    "originalUrl": "https://www.ejemplo.com",
    "password": "opcional",
    "expirationDate": "2025-12-31"
  }
  ```
- **Respuesta exitosa:**
  ```json
  {
    "shortenedUrl": "abc123",
    "link": "http://localhost:3000/links/abc123",
    "target": "https://www.ejemplo.com",
    "valid": true
  }
  ```

### **Redirigir a la URL original**
- **Método:** `GET /links/{shortenedUrl}`
- **Parámetro:** `shortenedUrl` (Código acortado del enlace)
- **Query param:** `password` (opcional, si el enlace está protegido)
- **Respuesta:** Redirección 302 a la URL original

#### ⚠️ Posibles Errores:
| Código | Mensaje |
|--------|---------|
| 404 | "The link does not exist." |
| 403 | "This link has been invalidated." |
| 403 | "This link has expired." |
| 403 | "This link is password protected. Please provide a password." |
| 403 | "Incorrect password." |

---

### **Obtener estadísticas de un enlace**
- **Método:** `GET /links/{shortenedUrl}/stats`
- **Respuesta exitosa:**
  ```json
  {
    "shortenedUrl": "abc123",
    "originalUrl": "https://www.ejemplo.com",
    "clicks": 10,
    "isValid": true,
    "createdAt": "2025-02-19T12:00:00Z",
    "expirationDate": "2025-12-31T00:00:00Z"
  }
  ```

- **Posibles Errores:**
  ```json
  {
    "statusCode": 404,
    "error": "Not Found",
    "message": "The link does not exist."
  }
  ```

---

### **Invalidar un enlace**
- **Método:** `PUT /links/{shortenedUrl}/invalidate`
- **Parámetro:** `shortenedUrl`
- **Respuesta exitosa:**
  ```json
  {
    "message": "The link has been successfully invalidated."
  }
  ```
- **Error si el enlace no existe:**
  ```json
  {
    "statusCode": 404,
    "error": "Not Found",
    "message": "The link does not exist."
  }
  ```

---

## 🧩 **Testing**

### **Ejecutar pruebas unitarias**
```sh
npm run test
```

### **Ejecutar pruebas e2e (End-to-End)**
```sh
npm run test:e2e
```

📀 **Nota:** En los test unitarios y testeo e2e, se ha configurado el entorno `NODE_ENV` como `test` para deshabilitar la ejecución de código de sistema externo (como abrir el navegador).

---

## ⚠️ Notas Importantes

- **Redirección con `res.redirect()`:** La mejor práctica para redireccionar es usar `res.redirect()` en una aplicación web. Sin embargo, para facilitar pruebas en Postman y Swagger, se ha añadido una opción para abrir la URL en el sistema.
- **Swagger:** Se agregó para mejorar la experiencia de testeo y evaluación de los endpoints.
- **Testing:** Se recomienda agregar pruebas para validar la funcionalidad de los enlaces acortados y la seguridad de las contraseñas.


