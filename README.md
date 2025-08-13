# Wiki de Coaching Ontológico

Una wiki minimalista desarrollada en HTML, CSS y JavaScript puro para estudiar conceptos de Coaching Ontológico.

## Características

- ✅ **Sin dependencias**: HTML, CSS y JavaScript puro
- 📱 **Responsive**: Funciona en desktop y móvil  
- 🎯 **Módulos colapsables**: Navegación organizada
- 🧠 **Quiz interactivo**: Verificación de conocimientos
- 📚 **Listas automáticas**: Convierte enumeraciones en listas ordenadas
- 🎨 **Estilo Wikipedia**: Diseño limpio y familiar

## Estructura

```
Wiki/
├── index.html          # Página principal
├── style.css           # Estilos minimalistas  
├── script.js           # Lógica de la aplicación
├── data.json           # Datos de ejemplo (opcional)
├── netlify.toml        # Configuración de Netlify
├── _redirects          # Redirects para SPA
└── README.md           # Este archivo
```

## Cómo usar

### Opción 1: Contenido embebido (recomendado)
El contenido está embebido directamente en `index.html` dentro del div `#embed-html`. Para actualizar:

1. Edita el contenido HTML dentro de `<div id="embed-html">`
2. Usa la estructura: `<h2>` para módulos, `<h3>` para distinciones
3. Preguntas con `<p><strong>P:</strong> texto</p>`
4. Respuestas con `<p><strong>R:</strong> texto</p>`

### Opción 2: Archivo JSON externo
Crea un `data.json` con esta estructura:

```json
{
  "modulos": [
    {
      "titulo": "Nombre del módulo",
      "distinciones": [
        {
          "titulo": "Nombre de la distinción", 
          "qa": [
            {
              "pregunta": "¿Pregunta?",
              "respuesta": "Respuesta..."
            }
          ]
        }
      ]
    }
  ]
}
```

## Deploy en Netlify

### Método 1: Drag & Drop
1. Ve a [netlify.com](https://netlify.com)
2. Arrastra la carpeta `Wiki/` completa al área de deploy
3. ¡Listo! Tu wiki estará online

### Método 2: Git + Auto-deploy
1. Sube tu código a GitHub/GitLab
2. Conecta el repositorio en Netlify
3. Configuración automática gracias a `netlify.toml`
4. Cada push actualizará la wiki automáticamente

### Configuración incluida
- ✅ `netlify.toml`: Configuración de build y headers
- ✅ `_redirects`: Manejo de rutas SPA
- ✅ Headers optimizados para rendimiento
- ✅ CORS habilitado para fetch de JSON

## Funcionalidades

### Navegación
- Menú lateral con módulos colapsables
- Click en título de módulo para expandir/colapsar
- Links directos a cada distinción
- Breadcrumb navigation

### Quiz
- Botón "Verificar conocimientos" en el menú
- Preguntas aleatorias de todo el contenido
- Botón "Ver respuesta" para revelar respuesta
- Botón "Nueva pregunta" para continuar

### Listas automáticas
Las respuestas con formato `1) item 2) item` se convierten automáticamente en listas ordenadas con marcadores `· 1.`

## Desarrollado por
Jorge Casagrande © 2025 