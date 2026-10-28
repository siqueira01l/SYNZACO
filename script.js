// ===== Original: intro + fundo animado =====
var intro = document.getElementById('intro');
var loop  = document.getElementById('loop');

var pular = document.getElementById('pular');

function fim() {
  if (intro.classList.contains('fim')) return;
  intro.classList.add('fim');          // some com fade
  pular.classList.add('off');          // esconde o botão "Pular intro"
  loop.currentTime = 0;
  loop.play().catch(function () {});   // começa o fundo animado
}

intro.addEventListener('ended', fim);
intro.addEventListener('error', fim);

// Se o navegador bloquear o autoplay, um clique em qualquer lugar inicia a intro
intro.play().catch(function () {
  document.addEventListener('click', function () {
    if (intro.classList.contains('fim')) return;   // já foi pulada
    intro.play().catch(fim);
  }, { once: true });
});

// Botão "Pular intro": interrompe o vídeo e dispara o mesmo fluxo do fim natural
pular.addEventListener('click', function (e) {
  e.stopPropagation();
  intro.pause();
  intro.dispatchEvent(new Event('ended'));   // fim() e a interface (mostrar) escutam este evento
});

// ===== Synza: interface aparece ao fim da intro + scroll suave =====
(function () {
  var ui = document.getElementById('ui');
  var vid = document.getElementById('intro');
  function mostrar() { ui.classList.add('on'); document.documentElement.classList.add('pronto'); }
  vid.addEventListener('ended', mostrar);
  vid.addEventListener('error', mostrar);

  // Scroll suave: "Início" volta ao topo; os demais rolam até a seção com o mesmo id (se existir)
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-form')) return;   // botões do formulário têm tratamento próprio
    e.preventDefault();
    var id = a.getAttribute('href').slice(1);
    if (id === 'inicio') {
      ui.scrollTo({ top: 0, behavior: 'smooth' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    var alvo = document.getElementById(id);
    // se a seção está escondida (ex.: "Serviços" no celular), rola até o "Sobre"
    if (alvo && !alvo.getClientRects().length) alvo = document.getElementById('sobre');
    if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();


// ===== Synza: seção Sobre (parallax, fade in, header) =====
(function () {
  var topo = document.querySelector('#ui .topo');

  // Header ganha fundo desfocado ao rolar a página
  function marcarTopo() { topo.classList.toggle('sc', window.scrollY > 40); }

  // Parallax
  //  data-speed   : negativo = move mais devagar que a página (fundo); positivo = mais rápido (frente)
  //  data-axis="x": desloca na horizontal
  //  data-desk    : só aplica em telas grandes (> 900px)
  var itens = [].slice.call(document.querySelectorAll('#sobre [data-speed]')).map(function (el) {
    return {
      el: el,
      speed: parseFloat(el.getAttribute('data-speed')) || 0,
      x: el.getAttribute('data-axis') === 'x',
      desk: el.hasAttribute('data-desk'),
      host: el.closest('.sx') || el.parentElement
    };
  });

  var aguardando = false;
  function parallax() {
    var vh = window.innerHeight;
    var pequena = window.innerWidth <= 900;
    itens.forEach(function (it) {
      if (it.desk && pequena) { it.el.style.transform = ''; return; }
      var r = it.host.getBoundingClientRect();
      var dist = (r.top + r.height / 2) - vh / 2;
      var t = dist * it.speed;
      it.el.style.transform = it.x
        ? 'translate3d(' + t.toFixed(1) + 'px,0,0)'
        : 'translate3d(0,' + t.toFixed(1) + 'px,0)';
    });
    aguardando = false;
  }
  function aoRolar() {
    marcarTopo();
    if (!aguardando) { aguardando = true; requestAnimationFrame(parallax); }
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  window.addEventListener('resize', aoRolar);
  window.addEventListener('load', aoRolar);
  aoRolar();

  // Fade in ao entrar na tela
  var rv = document.querySelectorAll('#sobre .rv');
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { obs.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
  }
})();


// ===== Synza: formulário de contato (abre só ao clicar em "Fale conosco") =====
(function () {
  var EMAIL_DESTINO = 'synzatech@outlook.com';
  var ENDPOINT = 'https://formsubmit.co/ajax/' + EMAIL_DESTINO;

  var modal  = document.getElementById('contatoModal');
  var form   = document.getElementById('formContato');
  var vForm  = document.getElementById('mcForm');
  var vOk    = document.getElementById('mcOk');
  var status = document.getElementById('mcStatus');
  var btn    = document.getElementById('mcEnviar');
  var html   = document.documentElement;
  var enviando = false;
  var fechando = false;

  function abrir() {
    modal.classList.remove('saindo'); fechando = false;
    vOk.hidden = true; vForm.hidden = false;
    limparErros(); status.textContent = '';
    modal.showModal();
    html.classList.add('mc-aberto');
    document.getElementById('mcNome').focus();
  }
  // Fecha com animação de saída (260ms), depois fecha de verdade
  function fechar() {
    if (!modal.open || fechando) return;
    fechando = true;
    modal.classList.add('saindo');
    setTimeout(function () {
      modal.classList.remove('saindo');
      fechando = false;
      modal.close();
    }, 260);
  }

  // Abre ao clicar em qualquer botão marcado com data-form
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-form]');
    if (!a) return;
    e.preventDefault();
    abrir();
  });

  // Fechar: botão X, botão "Fechar", clique no fundo escuro ou tecla Esc
  modal.addEventListener('click', function (e) {
    if (e.target === modal || e.target.closest('[data-fechar]')) fechar();
  });
  // Esc também passa pela animação de saída
  modal.addEventListener('cancel', function (e) { e.preventDefault(); fechar(); });
  modal.addEventListener('close', function () {
    html.classList.remove('mc-aberto');
    if (vForm.hidden) form.reset();   // depois de enviar, limpa os campos
  });

  // Validação
  function erro(id, msg) {
    var campo = document.getElementById(id);
    document.querySelector('[data-erro="' + id + '"]').textContent = msg;
    campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) {                       // campo com erro treme
      campo.classList.remove('tremer');
      void campo.offsetWidth;        // reinicia a animação
      campo.classList.add('tremer');
    }
  }
  function limparErros() {
    ['mcNome', 'mcEmail', 'mcMsg'].forEach(function (id) { erro(id, ''); });
  }
  function validar() {
    limparErros();
    var ok = true, primeiro = null;
    var nome = form.nome.value.trim(), mail = form.email.value.trim(), msg = form.mensagem.value.trim();
    if (nome.length < 2) { erro('mcNome', 'Informe o seu nome.'); ok = false; primeiro = primeiro || form.nome; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { erro('mcEmail', 'Informe um e-mail válido, como nome@empresa.com.'); ok = false; primeiro = primeiro || form.email; }
    if (msg.length < 10) { erro('mcMsg', 'Escreva uma mensagem com pelo menos 10 caracteres.'); ok = false; primeiro = primeiro || form.mensagem; }
    if (primeiro) primeiro.focus();
    return ok;
  }
  form.addEventListener('input', function (e) {
    if (e.target.id && e.target.getAttribute('aria-invalid') === 'true') erro(e.target.id, '');
  });

  // Envio
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (enviando || !validar()) return;

    // robô preencheu o campo escondido: finge sucesso e não envia
    if (form._honey.value) { vForm.hidden = true; vOk.hidden = false; return; }

    enviando = true;
    btn.disabled = true;
    btn.classList.add('carregando');
    btn.querySelector('span').textContent = 'Enviando…';
    status.className = 'mc-status'; status.textContent = '';

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        nome: form.nome.value.trim(),
        email: form.email.value.trim(),
        mensagem: form.mensagem.value.trim(),
        _subject: 'Novo contato pelo site da Synza',
        _template: 'table',
        _captcha: 'false'
      })
    })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (res) {
      if (!res.ok || String(res.d.success) === 'false') throw new Error(res.d.message || 'falha');
      vForm.hidden = true; vOk.hidden = false;
      vOk.querySelector('button').focus();
    })
    .catch(function () {
      status.className = 'mc-status err';
      status.innerHTML = 'Não foi possível enviar agora. Tente novamente ou escreva direto para <a href="mailto:' + EMAIL_DESTINO + '">' + EMAIL_DESTINO + '</a>.';
    })
    .then(function () {
      enviando = false;
      btn.disabled = false;
      btn.classList.remove('carregando');
      btn.querySelector('span').textContent = 'Enviar mensagem';
    });
  });
})();


// ===== Synza: menu do celular (hambúrguer) =====
(function () {
  var topo   = document.querySelector('#ui .topo');
  var btn    = topo.querySelector('.burger');
  var painel = document.getElementById('menuMovel');

  function definir(aberto) {
    topo.classList.toggle('aberto', aberto);
    btn.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    btn.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
  }

  btn.addEventListener('click', function () { definir(!topo.classList.contains('aberto')); });
  painel.addEventListener('click', function (e) { if (e.target.closest('a')) definir(false); });          // escolheu um link
  document.addEventListener('click', function (e) { if (!topo.contains(e.target)) definir(false); });     // clicou fora
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && topo.classList.contains('aberto')) { definir(false); btn.focus(); }
  });
  window.addEventListener('scroll', function () { if (topo.classList.contains('aberto')) definir(false); }, { passive: true });
  window.addEventListener('resize', function () { if (window.innerWidth > 900) definir(false); });
})();


// ===== Synza: seção Serviços (abas) =====
(function () {
  var lista = document.querySelector('#servicos .sv-abas');
  if (!lista) return;
  var abas = [].slice.call(lista.querySelectorAll('[role="tab"]'));
  var paineis = abas.map(function (a) { return document.getElementById(a.getAttribute('aria-controls')); });

  function ativar(i, foco) {
    abas.forEach(function (a, k) {
      var on = k === i;
      a.setAttribute('aria-selected', on ? 'true' : 'false');
      a.tabIndex = on ? 0 : -1;
      paineis[k].hidden = !on;
    });
    if (foco) abas[i].focus();
    // no celular as abas rolam na horizontal: centraliza a escolhida
    if (lista.scrollWidth > lista.clientWidth) {
      lista.scrollTo({ left: abas[i].offsetLeft - (lista.clientWidth - abas[i].offsetWidth) / 2, behavior: 'smooth' });
    }
  }

  abas.forEach(function (a, i) {
    a.addEventListener('click', function () { ativar(i); });
    a.addEventListener('keydown', function (e) {   // setas, Home e End navegam entre as abas
      var n = abas.length, k = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') k = (i + 1) % n;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') k = (i - 1 + n) % n;
      else if (e.key === 'Home') k = 0;
      else if (e.key === 'End') k = n - 1;
      if (k === null) return;
      e.preventDefault();
      ativar(k, true);
    });
  });
})();


// ===== Synza: seção Projetos (clicar para expandir detalhes e imagens) =====
(function () {
  var projetos = [].slice.call(document.querySelectorAll('#projetos .proj'));

  projetos.forEach(function (proj) {
    var topo = proj.querySelector('.proj-topo');
    var btn  = proj.querySelector('.proj-btn');
    var rot  = btn.querySelector('span');

    function definir(aberto) {
      proj.classList.toggle('aberto', aberto);
      btn.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      rot.textContent = aberto ? 'Fechar detalhes' : 'Ver detalhes';
    }

    // Clicar em qualquer parte do cabeçalho do projeto (ou no botão) abre/fecha.
    // O botão é o controle para teclado e leitor de tela; o clique dele sobe até aqui.
    topo.addEventListener('click', function () {
      definir(!proj.classList.contains('aberto'));
    });

    // Imagem que não carregou: mostra o espaço reservado "Imagem em breve"
    [].forEach.call(proj.querySelectorAll('.proj-galeria img'), function (img) {
      function semImagem() { img.parentNode.classList.add('vazio'); }
      img.addEventListener('error', semImagem);
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) semImagem();
    });
  });
})();

