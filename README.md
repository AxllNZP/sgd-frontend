```markdown id="frontend-perfect-readme"
# 🌐 SGD Frontend - Enterprise Web Application

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React-blue?style=for-the-badge&logo=react"/>
  <img src="https://img.shields.io/badge/Build-Vite-purple?style=for-the-badge&logo=vite"/>
  <img src="https://img.shields.io/badge/Language-TypeScript-blue?style=for-the-badge&logo=typescript"/>
  <img src="https://img.shields.io/badge/UI-TailwindCSS-38B2AC?style=for-the-badge&logo=tailwindcss"/>
  <img src="https://img.shields.io/badge/State-Context_API-orange?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/API-REST-green?style=for-the-badge"/>
</p>

---

## 🧾 Descripción

**SGD Frontend** es una aplicación web moderna diseñada para interactuar con el sistema de gestión documental (SGD Backend).

Permite a los usuarios:
- Autenticarse de forma segura
- Gestionar documentos
- Visualizar y ejecutar derivaciones
- Administrar usuarios y áreas
- Consultar historial y trazabilidad

Construida con un enfoque **modular, escalable y altamente mantenible**, siguiendo principios de arquitectura limpia en frontend.

---

## 🧠 Arquitectura

### 🔷 Enfoque
- **Component-Based Architecture**
- Separación de responsabilidades:
  - UI (Componentes)
  - Lógica (Hooks / Services)
  - Estado global (Context / Store)
  - Comunicación API (Axios / Fetch layer)

### 🔷 Flujo de datos

```

UI → Hooks → Services → API → Backend
↓
State Management

````id="flow-frontend"

---

## 🧰 Stack Tecnológico

### Core
- React
- TypeScript
- Vite

### UI / UX
- TailwindCSS
- Headless UI / Component patterns

### Estado
- React Context API
- Custom Hooks

### Networking
- Axios (cliente HTTP)
- Interceptors para JWT

### Seguridad
- Manejo de tokens JWT
- Protección de rutas (Private Routes)

### Dev Tools
- ESLint
- Prettier

---

## ⚙️ Requisitos Previos

| Herramienta | Versión |
|------------|--------|
| Node.js    | 18+    |
| npm / yarn | Latest |
| Git        | Latest |

Opcional:
- Docker

---

## 📦 Instalación

### 1. Clonar repositorio

```bash
git clone <REPO_URL>
cd sgd-frontend
````

---

### 2. Instalar dependencias

```bash
npm install
```

---

### 3. Variables de entorno

Crear archivo `.env`:

```env id="env-frontend"
VITE_API_URL=http://localhost:8080
VITE_APP_NAME=SGD Frontend
```

---

### 4. Ejecutar entorno de desarrollo

```bash
npm run dev
```

---

### 5. Build producción

```bash
npm run build
```

---

### 6. Preview producción

```bash
npm run preview
```

---

## 🌍 Acceso

| Entorno   | URL                                            |
| --------- | ---------------------------------------------- |
| Local Dev | [http://localhost:5173](http://localhost:5173) |

---

## 🐳 Docker (Opcional)

### Dockerfile

```dockerfile id="dockerfile-frontend"
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "run", "preview"]
```

---

## 🗂️ Estructura del Proyecto

```id="structure-frontend"
sgd-frontend/
├── src/
│   ├── assets/          # Recursos estáticos
│   ├── components/      # Componentes reutilizables
│   ├── pages/           # Vistas principales
│   ├── hooks/           # Custom hooks
│   ├── services/        # Llamadas API
│   ├── context/         # Estado global
│   ├── routes/          # Configuración de rutas
│   ├── utils/           # Helpers
│   ├── App.tsx
│   └── main.tsx
├── public/
├── .env
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🧩 Componentes Clave

### 🔐 Autenticación

* LoginForm
* AuthProvider
* ProtectedRoute

### 📄 Documentos

* DocumentList
* DocumentDetail
* DocumentForm

### 🔄 Derivaciones

* DerivationList
* DerivationForm

### 👤 Usuarios

* UserList
* UserForm

### 🏢 Áreas

* AreaList
* AreaForm

### 📜 Historial

* HistoryView

---

## 🔌 Integración con Backend

### Configuración base

````ts
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});
``` id="api-config"

### Interceptor JWT

```ts
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
``` id="jwt-interceptor"

---

## 🔐 Seguridad

- Protección de rutas privadas
- Almacenamiento de token en localStorage
- Interceptores HTTP
- Manejo de expiración de sesión

---

## ⚡ Performance

- Code splitting
- Lazy loading de páginas
- Memoización con React hooks
- Optimización de render

---

## 🧪 Testing

```bash
npm run test
````

Recomendado:

* Vitest / Jest
* React Testing Library

---

## 🔄 CI/CD (Ejemplo)

````yaml
name: Frontend CI

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm install
      - name: Build project
        run: npm run build
``` id="ci-frontend"

---

## 📊 Roadmap

- [ ] Implementación de Redux Toolkit
- [ ] Dark mode
- [ ] Internacionalización (i18n)
- [ ] PWA support
- [ ] WebSockets (real-time updates)

---

## 🧩 Buenas Prácticas

- Componentes desacoplados
- Hooks reutilizables
- Tipado fuerte con TypeScript
- Separación de lógica y UI
- Consumo centralizado de API

---

## 📄 Licencia

MIT License

---

## 👨‍💻 Autor

Frontend Engineering - Sistema de Gestión Documental

---

## ⭐ Contribuciones

Pull requests son bienvenidos. Para cambios mayores, abrir un issue primero.

---

## 📬 Contacto

- Email: axellzurita1003@gmail.com

