/**
 * Mostrar / ocultar senha — event delegation (funciona em qualquer formulário).
 * Marcação: .password-toggle-wrap > input + button.password-toggle-btn
 * Opcional: data-label-show / data-label-hide em aria-label; ícone .fa-eye / .fa-eye-slash
 */
(function () {
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.password-toggle-btn');
    if (!btn || e.button !== 0) {
      return;
    }
    e.preventDefault();
    var wrap = btn.closest('.password-toggle-wrap');
    if (!wrap) {
      return;
    }
    var input = wrap.querySelector('input');
    if (!input) {
      return;
    }
    var icon = btn.querySelector('i');
    var showL = btn.getAttribute('data-label-show');
    var hideL = btn.getAttribute('data-label-hide');
    if (input.getAttribute('type') === 'password') {
      input.setAttribute('type', 'text');
      if (icon) {
        icon.classList.remove('fa-eye', 'glyphicon-eye-open');
        icon.classList.add('fa-eye-slash', 'glyphicon-eye-close');
      }
      if (hideL) {
        btn.setAttribute('aria-label', hideL);
      }
    } else {
      input.setAttribute('type', 'password');
      if (icon) {
        icon.classList.remove('fa-eye-slash', 'glyphicon-eye-close');
        icon.classList.add('fa-eye', 'glyphicon-eye-open');
      }
      if (showL) {
        btn.setAttribute('aria-label', showL);
      }
    }
  });
})();
