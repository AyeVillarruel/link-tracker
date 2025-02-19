# Link Tracker - API REST con NestJS

## Descripción 📌
Link Tracker es un sistema para acortar y rastrear URLs. Permite obtener estadísticas sobre la cantidad de veces que se accedió a cada enlace, además de establecer reglas de negocio como la expiración de links o la protección mediante contraseñas.

Este proyecto fue desarrollado en **NestJS** y cuenta con **Swagger** para documentación y **Jest** para pruebas automatizadas.

---

## 🚀 Características

- ✅ **Acortar URLs** mediante un endpoint `POST`
- 🔄 **Redireccionamiento** a la URL original a partir de un enlace corto
- 📊 **Obtener estadísticas** sobre los accesos a un enlace
- 🔐 **Protección con contraseña** para acceder a ciertas URLs
- ⏳ **Expiración de enlaces** configurable
- 🛠 **Invalidación de links** para evitar accesos posteriores
- 📑 **Swagger integrado** para documentación interactiva
- 🧪 **Pruebas automatizadas** con Jest

---

## 📌 Tecnologías utilizadas

- **NestJS** (framework principal)
- **TypeORM** (ORM para la base de datos)
- **MySQL** (base de datos relacional)
- **Swagger** (documentación de API)
- **Jest** (pruebas automatizadas)
- **Bcrypt** (para encriptar contraseñas)
- **UUID** (generación de IDs únicos)

---

## 🛠 Instalación y configuración

### 1️⃣ Clonar el repositorio
```sh
$ git clone https://github.com/AyeVillarruel/link-tracker.git
$ cd link-tracker
```

### 2️⃣ Instalar dependencias
```sh
$ npm install
```

### 3️⃣ Configurar variables de entorno
Crea un archivo **`.env`** en la raíz del proyecto y configura la base de datos:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=link_tracker
```

### 4️⃣ Levantar la base de datos (Docker opcional)
Si tienes Docker instalado, puedes ejecutar:
```sh
$ docker-compose up -d
```
O si deseas correr la base de datos manualmente, asegúrate de que MySQL esté corriendo.

### 5️⃣ Ejecutar migraciones
```sh
$ npm run typeorm migration:run
```

### 6️⃣ Iniciar el servidor
```sh
$ npm run start:dev
```

La API estará disponible en **`http://localhost:3000`**

---

## 🔍 Endpoints disponibles

### 📌 **1. Crear un link acortado**
**Método:** `POST /links`
```json
{
  "originalUrl": "https://www.fierastudio.com",
  "password": "123456",
  "expirationDate": "2025-02-20T23:59:59.000Z"
}
```
✅ **Respuesta esperada:**
```json
{
  "link": "http://localhost:3000/links/aBsJu",
  "shortenedUrl": "aBsJu",
  "target": "https://www.fierastudio.com",
  "valid": true
}
```

### 📌 **2. Redirección a la URL original**
**Método:** `GET /links/:shortenedUrl`

📌 **Importante:** _El redireccionamiento se maneja siempre con `res.redirect(url)`, pero para facilitar pruebas en Swagger y Postman, se agregó una apertura manual del enlace en el sistema._

### 📌 **3. Obtener estadísticas de un link**
**Método:** `GET /links/:shortenedUrl/stats`
✅ **Respuesta esperada:**
```json
{
  "shortenedUrl": "aBsJu",
  "originalUrl": "https://www.fierastudio.com",
  "clicks": 10,
  "isValid": true,
  "createdAt": "2025-02-15T12:00:00.000Z",
  "expirationDate": "2025-02-20T23:59:59.000Z"
}
```

### 📌 **4. Invalidar un link**
**Método:** `PUT /links/:shortenedUrl/invalidate`
✅ **Respuesta esperada:**
```json
{
  "message": "El enlace ha sido invalidado exitosamente."
}
```

---

## 📑 Pruebas
Para ejecutar los tests:
```sh
$ npm run test
```
Para ejecutar las pruebas con cobertura:
```sh
$ npm run test:cov
```

---

## 📌 Swagger - Documentación interactiva
La documentación de la API se encuentra en **`http://localhost:3000/api`**.

Puedes probar los endpoints directamente desde Swagger.

---

## 🚀 Mejoras implementadas para la evaluación
✅ **Testing con Jest para asegurar calidad**
✅ **Swagger documentado con ejemplos de uso**
✅ **Compatibilidad con Swagger y Postman para facilitar el testeo**

---

## 🛠 Autor
Desarrollado por **Ayelen Villarruel* 🚀