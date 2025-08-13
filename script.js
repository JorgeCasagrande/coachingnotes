'use strict';

(function () {
  let datos = null;
  let mapaModuloPorSlug = new Map();
  let todasLasPreguntas = [];
  const menuEl = document.getElementById('menu');
  const detailEl = document.getElementById('detail');
  const breadcrumbEl = document.getElementById('breadcrumb');

  function normalizarATextoBasico(texto) {
    return (texto || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function crearSlugs(datos) {
    const usadosMod = new Set();
    const usadosDistPorMod = new Map();

    (datos.modulos || []).forEach((modulo) => {
      const base = modulo.slug || normalizarATextoBasico(modulo.titulo || modulo.nombre || 'modulo');
      let slug = base;
      let n = 2;
      while (usadosMod.has(slug)) { slug = base + '-' + n++; }
      usadosMod.add(slug);
      modulo._slug = slug;

      const usadosDist = new Set();
      usadosDistPorMod.set(slug, usadosDist);

      (modulo.distinciones || []).forEach((dist) => {
        const baseD = dist.slug || normalizarATextoBasico(dist.titulo || dist.nombre || 'distincion');
        let slugD = baseD;
        let m = 2;
        while (usadosDist.has(slugD)) { slugD = baseD + '-' + m++; }
        usadosDist.add(slugD);
        dist._slug = slugD;
      });
    });
  }

  function construirIndice(datos) {
    mapaModuloPorSlug.clear();
    todasLasPreguntas = [];
    (datos.modulos || []).forEach((modulo) => {
      mapaModuloPorSlug.set(modulo._slug, modulo);
      (modulo.distinciones || []).forEach((dist) => {
        (dist.qa || []).forEach((qa) => {
          todasLasPreguntas.push({
            pregunta: qa.pregunta || qa.q,
            respuesta: qa.respuesta || qa.a,
            modulo: modulo.titulo || modulo.nombre,
            distincion: dist.titulo || dist.nombre
          });
        });
      });
    });
  }

  function crearEnlaceModulo(modulo) {
    const cont = document.createElement('div');
    cont.className = 'module';

    const header = document.createElement('div');
    header.className = 'module-header';
    
    const titulo = document.createElement('div');
    titulo.className = 'module-title';
    titulo.textContent = modulo.titulo || modulo.nombre || 'Módulo';
    
    const toggle = document.createElement('div');
    toggle.className = 'module-toggle';
    toggle.textContent = '▼';
    
    header.appendChild(titulo);
    header.appendChild(toggle);
    cont.appendChild(header);

    const ul = document.createElement('ul');
    ul.className = 'dist-list';

    (modulo.distinciones || []).forEach((dist) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#/' + modulo._slug + '/' + dist._slug;
      a.textContent = dist.titulo || dist.nombre || 'Distinción';
      a.dataset.route = modulo._slug + '/' + dist._slug;
      li.appendChild(a);
      ul.appendChild(li);
    });

    cont.appendChild(ul);
    
    // Añadir funcionalidad de colapsar
    header.addEventListener('click', () => {
      const isCollapsed = ul.classList.contains('collapsed');
      if (isCollapsed) {
        ul.classList.remove('collapsed');
        toggle.classList.remove('collapsed');
      } else {
        ul.classList.add('collapsed');
        toggle.classList.add('collapsed');
      }
    });
    
    return cont;
  }

  function crearBotonQuiz() {
    const button = document.createElement('div');
    button.className = 'quiz-button';
    
    const header = document.createElement('div');
    header.className = 'quiz-button-header';
    header.textContent = 'Herramientas';
    
    const content = document.createElement('div');
    content.className = 'quiz-button-content';
    content.textContent = 'Verificar conocimientos';
    
    button.appendChild(header);
    button.appendChild(content);
    button.addEventListener('click', abrirQuiz);
    return button;
  }

  function construirMenu() {
    menuEl.innerHTML = '';

    const ulRoot = document.createElement('ul');
    (datos.modulos || []).forEach((modulo) => {
      const li = document.createElement('li');
      li.appendChild(crearEnlaceModulo(modulo));
      ulRoot.appendChild(li);
    });
    menuEl.appendChild(ulRoot);
    
    // Añadir botón de quiz
    menuEl.appendChild(crearBotonQuiz());
  }

  function marcarActivo(ruta) {
    const enlaces = menuEl.querySelectorAll('a[data-route]');
    enlaces.forEach((a) => {
      if (a.dataset.route === ruta) a.classList.add('active'); else a.classList.remove('active');
    });
  }

  function renderizarBreadcrumb(modulo, dist) {
    const modTexto = modulo ? (modulo.titulo || modulo.nombre || 'Módulo') : '';
    const distTexto = dist ? (dist.titulo || dist.nombre || 'Distinción') : '';
    if (modulo && dist) {
      breadcrumbEl.innerHTML = '<a href="#">Inicio</a> › ' +
        '<a href="#/' + modulo._slug + '/' + dist._slug + '">' + modTexto + '</a> › ' +
        '<span>' + distTexto + '</span>';
    } else {
      breadcrumbEl.innerHTML = '<span class="muted">Selecciona un elemento del menú</span>';
    }
  }

  function respuestaATextoONodo(respuesta) {
    const texto = (respuesta || '').trim();
    if (!texto) return document.createTextNode('');
    
    // Primero intentar detectar enumeración en líneas separadas
    const lineas = texto.split(/\r?\n/).filter((l) => l.trim() !== '');
    const patron = /^(\d+\)\s*|\d+\.\s*|\d+\s+|\-\s+)/;
    const esEnumeracionLineas = lineas.length > 1 && lineas.every((l) => patron.test(l.trim()));
    
    if (esEnumeracionLineas) {
      const ol = document.createElement('ol');
      ol.className = 'list-enum';
      lineas.forEach((l) => {
        const limpio = l.trim().replace(patron, '');
        const li = document.createElement('li');
        li.textContent = limpio;
        ol.appendChild(li);
      });
      return ol;
    }
    
    // Intentar detectar enumeración en una sola línea con formato "1) ... 2) ... 3) ..."
    const patronInlinea = /(\d+\)\s*[^0-9)]+?)(?=\d+\)|$)/g;
    const matches = Array.from(texto.matchAll(patronInlinea));
    
    if (matches.length > 1) {
      const ol = document.createElement('ol');
      ol.className = 'list-enum';
      matches.forEach((match) => {
        const limpio = match[1].replace(/^\d+\)\s*/, '').trim();
        if (limpio) {
          const li = document.createElement('li');
          li.textContent = limpio;
          ol.appendChild(li);
        }
      });
      return ol;
    }
    
    return document.createTextNode(texto);
  }

  function renderizarDistincion(modulo, dist) {
    renderizarBreadcrumb(modulo, dist);
    detailEl.innerHTML = '';

    if (!modulo || !dist) {
      const div = document.createElement('div');
      div.className = 'placeholder';
      div.textContent = 'Bienvenido. Usa el menú para navegar por módulos y distinciones.';
      detailEl.appendChild(div);
      return;
    }

    const h1 = document.createElement('h1');
    h1.textContent = dist.titulo || dist.nombre || 'Distinción';
    detailEl.appendChild(h1);

    const listaQA = dist.qa || dist.preguntas || [];

    if (!Array.isArray(listaQA) || listaQA.length === 0) {
      const p = document.createElement('p');
      p.className = 'muted';
      p.textContent = 'Sin preguntas por el momento.';
      detailEl.appendChild(p);
      return;
    }

    listaQA.forEach((item, idx) => {
      const cont = document.createElement('section');
      cont.className = 'qa-item';

      const h3 = document.createElement('h3');
      h3.textContent = item.pregunta || item.q || ('Pregunta ' + (idx + 1));
      cont.appendChild(h3);

      const p = document.createElement('p');
      const nodo = respuestaATextoONodo(item.respuesta || item.a || '');
      if (nodo.nodeType === Node.TEXT_NODE) {
        p.appendChild(nodo);
        cont.appendChild(p);
      } else {
        cont.appendChild(nodo);
      }

      detailEl.appendChild(cont);
      if (idx < listaQA.length - 1) {
        const hr = document.createElement('hr');
        detailEl.appendChild(hr);
      }
    });
  }

  function abrirQuiz() {
    if (todasLasPreguntas.length === 0) {
      alert('No hay preguntas disponibles para el quiz.');
      return;
    }

    const modal = crearModal();
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    mostrarPreguntaAleatoria();
  }

  function crearModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cerrarModal();
    });

    const modal = document.createElement('div');
    modal.className = 'modal';

    const header = document.createElement('div');
    header.className = 'modal-header';
    
    const title = document.createElement('h2');
    title.className = 'modal-title';
    title.textContent = 'Quiz de Verificación';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', cerrarModal);
    
    header.appendChild(title);
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'modal-body';
    body.id = 'quiz-body';

    modal.appendChild(header);
    modal.appendChild(body);
    overlay.appendChild(modal);

    return overlay;
  }

  function mostrarPreguntaAleatoria() {
    const preguntaData = todasLasPreguntas[Math.floor(Math.random() * todasLasPreguntas.length)];
    const body = document.getElementById('quiz-body');
    
    body.innerHTML = `
      <div class="quiz-title">${preguntaData.modulo} - ${preguntaData.distincion}</div>
      <div class="quiz-question">${preguntaData.pregunta}</div>
      <div class="quiz-answer" id="quiz-answer">
        ${preguntaData.respuesta.includes('\n') || /^\d+\)/.test(preguntaData.respuesta) 
          ? crearRespuestaFormateada(preguntaData.respuesta)
          : `<p>${preguntaData.respuesta}</p>`}
      </div>
      <div class="quiz-buttons">
        <button class="btn btn-primary" id="show-answer">Ver respuesta</button>
        <button class="btn" id="next-question">Nueva pregunta</button>
      </div>
    `;

    document.getElementById('show-answer').addEventListener('click', () => {
      document.getElementById('quiz-answer').classList.add('show');
      document.getElementById('show-answer').style.display = 'none';
    });

    document.getElementById('next-question').addEventListener('click', mostrarPreguntaAleatoria);
  }

  function crearRespuestaFormateada(respuesta) {
    const nodo = respuestaATextoONodo(respuesta);
    if (nodo.nodeType === Node.TEXT_NODE) {
      return `<p>${respuesta}</p>`;
    } else {
      return nodo.outerHTML;
    }
  }

  function cerrarModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    }
  }

  function parsearHash() {
    const hash = (window.location.hash || '').replace(/^#\/?/, '');
    const partes = hash.split('/').filter(Boolean);
    if (partes.length < 2) return { modulo: null, dist: null };
    return { modulo: partes[0], dist: partes[1] };
  }

  function navegarSegunHash() {
    const { modulo, dist } = parsearHash();
    if (!modulo || !dist) {
      renderizarDistincion(null, null);
      marcarActivo('');
      return;
    }
    const modObj = mapaModuloPorSlug.get(modulo);
    if (!modObj) {
      renderizarDistincion(null, null);
      marcarActivo('');
      return;
    }
    const distObj = (modObj.distinciones || []).find((d) => d._slug === dist);
    if (!distObj) {
      renderizarDistincion(null, null);
      marcarActivo('');
      return;
    }
    renderizarDistincion(modObj, distObj);
    marcarActivo(modulo + '/' + dist);
  }

  function seleccionarPrimeraDistincion() {
    const primerModulo = (datos.modulos || [])[0];
    if (!primerModulo) return;
    const primeraDist = (primerModulo.distinciones || [])[0];
    if (!primeraDist) return;
    window.location.hash = '#/' + primerModulo._slug + '/' + primeraDist._slug;
  }

  function iniciarRuteo() {
    window.addEventListener('hashchange', navegarSegunHash);
    if (!window.location.hash) seleccionarPrimeraDistincion();
    navegarSegunHash();
  }

  function inicializarConDatos(json) {
    datos = json || {};
    crearSlugs(datos);
    construirIndice(datos);
    construirMenu();
    iniciarRuteo();
  }

  function intentarCargarEmbedJSON() {
    try {
      const tag = document.getElementById('embed-data');
      if (!tag) return false;
      const texto = (tag.textContent || '').trim();
      if (!texto) return false;
      const json = JSON.parse(texto);
      inicializarConDatos(json);
      return true;
    } catch (e) {
      return false;
    }
  }

  function parsearMarkdownEmbebido(texto) {
    const lineas = texto.split(/\r?\n/);
    const modulos = [];
    let moduloActual = null;
    let distActual = null;

    function iniciarModulo(titulo) {
      moduloActual = { titulo: titulo.trim(), distinciones: [] };
      modulos.push(moduloActual);
    }

    function iniciarDistincion(titulo) {
      if (!moduloActual) iniciarModulo('General');
      distActual = { titulo: titulo.trim(), qa: [] };
      moduloActual.distinciones.push(distActual);
    }

    function agregarQA(pregunta, respuesta) {
      if (!distActual) iniciarDistincion('General');
      distActual.qa.push({ pregunta: pregunta.trim(), respuesta: respuesta.trim() });
    }

    let i = 0;
    while (i < lineas.length) {
      const linea = lineas[i].trim();
      if (linea.startsWith('## ') && !linea.startsWith('### ')) {
        iniciarModulo(linea.replace(/^##\s+/, ''));
        i++; continue;
      }
      if (linea.startsWith('### ')) {
        iniciarDistincion(linea.replace(/^###\s+/, ''));
        i++; continue;
      }
      if (/^\*\*P:\*\*/i.test(linea)) {
        const q = linea.replace(/^\*\*P:\*\*\s*/i, '');
        i++;
        let respuesta = '';
        while (i < lineas.length && lineas[i].trim() === '') i++;
        if (i < lineas.length && /^\*\*R:\*\*/i.test(lineas[i].trim())) {
          respuesta += lineas[i].trim().replace(/^\*\*R:\*\*\s*/i, '');
          i++;
        }
        while (i < lineas.length) {
          const t = lineas[i];
          const tTrim = t.trim();
          if (tTrim === '' ) { respuesta += '\n'; i++; continue; }
          if (/^\*\*P:\*\*/i.test(tTrim)) break;
          if (tTrim.startsWith('### ') || tTrim.startsWith('## ') || tTrim === '---') break;
          respuesta += (respuesta.endsWith('\n') || respuesta === '' ? '' : '\n') + t;
          i++;
        }
        agregarQA(q, respuesta);
        continue;
      }
      i++;
    }

    return { modulos };
  }

  function intentarCargarMarkdown() {
    const tag = document.getElementById('embed-markdown');
    if (!tag) return false;
    const texto = (tag.textContent || '').trim();
    if (!texto) return false;
    const json = parsearMarkdownEmbebido(texto);
    inicializarConDatos(json);
    return true;
  }

  function parsearHTMLEmbebido(container) {
    const elementos = Array.from(container.querySelectorAll('h2, h3, p, hr'));
    const modulos = [];
    let moduloActual = null;
    let distActual = null;
    let qaActual = null;

    function iniciarModulo(titulo) {
      moduloActual = { titulo: titulo.trim(), distinciones: [] };
      modulos.push(moduloActual);
    }

    function iniciarDistincion(titulo) {
      if (!moduloActual) iniciarModulo('General');
      distActual = { titulo: titulo.trim(), qa: [] };
      moduloActual.distinciones.push(distActual);
      qaActual = null;
    }

    function agregarPregunta(texto) {
      if (!distActual) iniciarDistincion('General');
      qaActual = { pregunta: texto.trim(), respuesta: '' };
      distActual.qa.push(qaActual);
    }

    function agregarRespuesta(texto) {
      if (!qaActual) agregarPregunta('');
      const toAdd = texto;
      if (!qaActual.respuesta) qaActual.respuesta = toAdd; else qaActual.respuesta += (qaActual.respuesta.endsWith('\n') ? '' : '\n') + toAdd;
    }

    elementos.forEach((el) => {
      if (el.tagName === 'H2') {
        iniciarModulo(el.textContent);
        return;
      }
      if (el.tagName === 'H3') {
        iniciarDistincion(el.textContent);
        return;
      }
      if (el.tagName === 'P') {
        const txt = el.textContent.trim();
        const esP = /^P:\s*/i.test(txt) || /^\*\*P:\*\*/i.test(txt) || (el.querySelector('strong') && /^P:\s*/i.test(el.querySelector('strong').textContent.trim()));
        const esR = /^R:\s*/i.test(txt) || /^\*\*R:\*\*/i.test(txt) || (el.querySelector('strong') && /^R:\s*/i.test(el.querySelector('strong').textContent.trim()));
        if (esP) {
          const texto = txt.replace(/^(\*\*P:\*\*|P:)\s*/i, '');
          agregarPregunta(texto);
          return;
        }
        if (esR) {
          const texto = txt.replace(/^(\*\*R:\*\*|R:)\s*/i, '');
          agregarRespuesta(texto);
          return;
        }
      }
    });

    return { modulos };
  }

  function intentarCargarHTML() {
    const cont = document.getElementById('embed-html');
    if (!cont) return false;
    const json = parsearHTMLEmbebido(cont);
    if (!json.modulos || json.modulos.length === 0) return false;
    inicializarConDatos(json);
    return true;
  }

  function iniciar() {
    const esFile = location.protocol === 'file:';
    if (intentarCargarHTML() || intentarCargarEmbedJSON() || intentarCargarMarkdown()) return;

    if (esFile) {
      fetch('data.json')
        .then((r) => r.ok ? r.json() : Promise.reject(new Error('No se pudo cargar data.json')))
        .then((json) => inicializarConDatos(json))
        .catch(() => {
          datos = { modulos: [] };
          construirMenu();
          renderizarDistincion(null, null);
        });
      return;
    }

    fetch('data.json')
      .then((r) => {
        if (!r.ok) throw new Error('No se pudo cargar data.json');
        return r.json();
      })
      .then((json) => inicializarConDatos(json))
      .catch(() => {
        if (intentarCargarHTML() || intentarCargarEmbedJSON() || intentarCargarMarkdown()) return;
        menuEl.innerHTML = '<div class="module"><span class="muted">Error cargando datos</span></div>';
        detailEl.innerHTML = '<p class="muted">No se pudo cargar ni data.json ni el contenido embebido.</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(); 