const escenas = [
  {

    texto: "Había una vez un príncipe que caminaba cada día mirando el horizonte, sintiendo que algo le faltaba.",
    duracionLectura: 5000,
    accion: () => {
      document.querySelector(".principe").classList.add("entrar-escena");

      // Partículas: Hojas o polvo brillante sutil
      crearParticulasAmbientales("luciernaga", 10, 8000, true);
    }
  },
  {
    // 1: La princesa a lo lejos
    texto: "Muy lejos de allí, una princesa observaba el mismo cielo, preguntándose si alguien pensaba en ella.",
    duracionLectura: 6000,
    accion: () => {
      document.getElementById("escenaPrincipal").classList.add("paisaje-lejano");
      const princesa = document.querySelector(".princesa");
      princesa.classList.add("entrar-escena", "mirando-lejos");

      crearBrisaEstelar(princesa, 20);
    }
  },
  {
    // 2: Vínculo
    texto: "Una noche, sin saber cómo, sus miradas se encontraron a través de las estrellas.",
    duracionLectura: 7000,
    accion: () => {
      const escena = document.getElementById("escenaPrincipal");
      escena.classList.remove("paisaje-lejano");
      escena.classList.add("noche-estrellada");

      const principe = document.querySelector(".principe");
      const princesa = document.querySelector(".princesa");

      princesa.classList.remove("mirando-lejos");
      principe.classList.add("miradas-cruzadas");
      princesa.classList.add("miradas-cruzadas");

      // Disparo de estrellas fugaces dramáticas
      crearLluviaEstrellas();

      // Hilo rojo vibrante
      setTimeout(() => {
        const hilo = document.getElementById("hiloRelacion");
        hilo.style.display = "block";
        setTimeout(() => hilo.style.opacity = "1", 100);
      }, 2500);
    }
  },
  {
    // 3: Obstáculo
    texto: "Pero el camino no era sencillo. La distancia se interpuso entre ellos.",
    duracionLectura: 7000,
    accion: () => {
      const escena = document.getElementById("escenaPrincipal");
      escena.classList.remove("noche-estrellada");
      escena.classList.add("distancia-fria");

      const principe = document.querySelector(".principe");
      const princesa = document.querySelector(".princesa");

      principe.classList.remove("miradas-cruzadas");
      princesa.classList.remove("miradas-cruzadas");

      principe.classList.add("aislados");
      princesa.classList.add("aislados");

      // Desvanecer el hilo
      const hilo = document.getElementById("hiloRelacion");
      hilo.style.opacity = "0";
      setTimeout(() => hilo.style.display = "none", 4000);

      // Nieve / Ceniza fría bajando
      crearParticulasAmbientales("nieve-fria", 50, 6000, false);

      // Levantar muro con retraso dramático
      setTimeout(() => {
        const muro = document.getElementById("muroDistancia");
        muro.classList.add("levantar");
      }, 2000);
    }
  },
  {
    // 4: Esperanza
    texto: "Aun así, prometieron encontrarse algún día, sin importar cuánto tardara.",
    duracionLectura: 6500,
    accion: () => {
      const escena = document.getElementById("escenaPrincipal");
      escena.classList.remove("distancia-fria");
      escena.classList.add("reencuentro-dorado");

      // Derretir Muro brutalmente
      const muro = document.getElementById("muroDistancia");
      muro.classList.add("derretir");

      const principe = document.querySelector(".principe");
      const princesa = document.querySelector(".princesa");

      principe.classList.remove("aislados");
      princesa.classList.remove("aislados");
      principe.classList.add("esperanza");
      princesa.classList.add("esperanza");

      // Limpiar nieve, añadir chispas de suelo
      limpiarParticulas();
      crearChispasPromesa();
    }
  },
  {
    // 5: Clímax de Amor
    texto: "Porque algunas historias no se escriben con pasos, sino con paciencia, fe y amor.",
    duracionLectura: 8000,
    accion: () => {
      const principe = document.querySelector(".principe");
      const princesa = document.querySelector(".princesa");

      principe.classList.remove("esperanza");
      princesa.classList.remove("esperanza");

      principe.classList.add("juntos");
      princesa.classList.add("juntos");

      crearExplosionAmor(principe, princesa);
    }
  },
  {
    // 6: Final
    texto: "Este libro aún tiene páginas vacías… esperando ser llenadas juntos.",
    duracionLectura: 6000,
    accion: () => {
      setTimeout(() => {
        window.location.href = "../Menu/menu.html";
      }, 4000);
    }
  }
];

let escenaActual = 0;
const textoElemento = document.getElementById("historiaTexto");
const contenedorParticulas = document.getElementById("contenedorParticulas");

function revelarTextoTransicion(texto, callback, duracionOpcional) {
  textoElemento.classList.remove("mostrar");

  setTimeout(() => {
    textoElemento.innerHTML = texto;
    textoElemento.classList.add("mostrar");

    setTimeout(() => {
      callback();
    }, duracionOpcional || 4500);

  }, 1500); // 1.5 segundo fade out extra lento
}

function siguienteEscena() {
  if (escenaActual >= escenas.length) return;

  const escena = escenas[escenaActual];

  revelarTextoTransicion(escena.texto, () => {
    escenaActual++;

    if (escenaActual < escenas.length) {
      setTimeout(siguienteEscena, 1000);
    }
  }, escena.duracionLectura);

  setTimeout(() => {
    escena.accion();
  }, 2000); // Retraso de acción teatral
}

// Iniciar magia
setTimeout(siguienteEscena, 1500);


/* ===========================
   SISTEMA DE PARTÍCULAS CINEMÁTICO 
=========================== */

function crearParticulasAmbientales(clase, cantidad, duracionPromedio, infinito = false) {
  const funcionGenerar = () => {
    const p = document.createElement("div");
    p.classList.add(clase);

    if (clase === 'luciernaga') {
      p.style.left = (Math.random() * 100) + "vw";
      p.style.bottom = "-20px";
      p.style.setProperty('--ox', (Math.random() * 200 - 100) + "px"); // Onda X
      p.style.setProperty('--fx', (Math.random() * 400 - 200) + "px"); // Fin X
      p.style.setProperty('--duracion', (duracionPromedio / 1000 + Math.random() * 4) + "s");
    } else if (clase === 'nieve-fria') {
      p.style.left = (Math.random() * 100) + "vw";
      p.style.top = "-20px";
      const size = Math.random() * 3 + 2;
      p.style.width = size + "px"; p.style.height = size + "px";
      p.style.setProperty('--duracion', (duracionPromedio / 1000 + Math.random() * 5) + "s");
    }

    contenedorParticulas.appendChild(p);

    setTimeout(() => {
      p.remove();
      if (infinito && document.querySelector(".escena:not(.distancia-fria)")) funcionGenerar();
    }, duracionPromedio + Math.random() * 3000);
  };

  for (let i = 0; i < cantidad; i++) {
    setTimeout(funcionGenerar, Math.random() * 3000);
  }
}

function limpiarParticulas() {
  contenedorParticulas.innerHTML = "";
}

function crearBrisaEstelar(elemento, cantidad) {
  const rect = elemento.getBoundingClientRect();
  for (let i = 0; i < cantidad; i++) {
    setTimeout(() => {
      const chispa = document.createElement("div");
      chispa.classList.add("chispa-promesa");
      chispa.style.left = (rect.left - 80 + Math.random() * (rect.width + 160)) + "px";
      chispa.style.top = (rect.top + Math.random() * rect.height) + "px";
      chispa.style.setProperty('--duracion', (Math.random() * 2 + 3) + "s");

      contenedorParticulas.appendChild(chispa);
      setTimeout(() => chispa.remove(), 5000);
    }, i * 300);
  }
}

function crearLluviaEstrellas() {
  for (let i = 0; i < 25; i++) {
    setTimeout(() => {
      const rayo = document.createElement("div");
      rayo.classList.add("estrella-vinculo");

      rayo.style.left = (Math.random() * 100) + "vw";
      rayo.style.top = (Math.random() * 40 - 10) + "vh";

      rayo.style.setProperty('--finX', (Math.random() * 600 + 200) + "px");
      rayo.style.setProperty('--finY', (Math.random() * 600 + 200) + "px");
      rayo.style.setProperty('--tiempo', (Math.random() * 1.5 + 1.2) + "s");

      contenedorParticulas.appendChild(rayo);
      setTimeout(() => rayo.remove(), 4000);
    }, i * 150);
  }
}

function crearChispasPromesa() {
  const intervalo = setInterval(() => {
    const chispa = document.createElement("div");
    chispa.classList.add("chispa-promesa");
    chispa.style.left = (Math.random() * 100) + "vw";
    chispa.style.bottom = "-20px";
    chispa.style.setProperty('--duracion', (Math.random() * 3 + 4) + "s");

    contenedorParticulas.appendChild(chispa);
    setTimeout(() => chispa.remove(), 7000);
  }, 100);

  setTimeout(() => clearInterval(intervalo), 7000);
}

function crearExplosionAmor(p1, p2) {
  setTimeout(() => {
    for (let i = 0; i < 80; i++) {
      const chispa = document.createElement("div");
      chispa.classList.add("chispa-promesa");

      chispa.style.left = "50vw";
      chispa.style.bottom = "200px";
      chispa.style.background = i % 2 === 0 ? "#ffd166" : "#ff99c8";
      chispa.style.boxShadow = `0 0 30px ${i % 2 === 0 ? 'white' : 'hotpink'}`;

      const angle = (Math.random() * Math.PI * 2);
      const dist = 400 + Math.random() * 600; // Gran expansión
      chispa.style.setProperty('--targetX', Math.cos(angle) * dist + 'px');
      chispa.style.setProperty('--targetY', Math.sin(angle) * dist + 'px');

      chispa.style.animation = `explosion radial ${Math.random() * 2 + 3}s cubic-bezier(0.1, 0.8, 0.2, 1) forwards`;

      contenedorParticulas.appendChild(chispa);
      setTimeout(() => chispa.remove(), 6000);
    }

    if (!document.getElementById("animacionExplosion")) {
      const style = document.createElement('style');
      style.id = "animacionExplosion";
      style.innerHTML = `
        @keyframes explosion {
          0% { transform: translate(0, 0) scale(0.2); opacity: 1; filter: brightness(2); }
          100% { transform: translate(var(--targetX), var(--targetY)) scale(2); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

  }, 1000);
}
