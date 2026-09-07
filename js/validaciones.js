const DOMINIOS_PERMITIDOS = ['@duoc.cl', '@profesor.duoc.cl', '@gmail.com'];

const emailValido = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && DOMINIOS_PERMITIDOS.some(domain => email.toLowerCase().endsWith(domain));

const runValido = run => {
  const limpio = String(run).replace(/[^0-9kK]/g, '').toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(limpio)) return false;
  let suma = 0;
  let mult = 2;
  for (let i = limpio.length - 2; i >= 0; i--) {
    suma += Number(limpio[i]) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const dv = 11 - (suma % 11);
  const esperado = dv === 11 ? '0' : dv === 10 ? 'K' : String(dv);
  return limpio.at(-1) === esperado;
};

const SOLO_LETRAS_ESPACIOS = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+(?:\s+[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+)*$/;

const textoNombreValido = value =>
  SOLO_LETRAS_ESPACIOS.test(value.trim());

const fechaNoFutura = value => {
  if (!value) return true;
  const fecha = new Date(`${value}T00:00:00`);
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  return !Number.isNaN(fecha.getTime()) && fecha <= hoy;
};

function bindLiveValidation(form, rules) {
  rules.forEach(rule => {
    const input = form.elements[rule.name];
    const error = document.getElementById(rule.errorId);
    if (!input || !error) return;
    const validate = () => {
      const message = rule.validate(input.value);
      input.classList.toggle('is-invalid', Boolean(message));
      input.classList.toggle('is-valid', !message && input.value !== '');
      error.textContent = message || '';
      return !message;
    };
    input.addEventListener('input', validate);
    input.addEventListener('blur', validate);
    input.addEventListener('change', validate);
  });
}

function runRules(form, rules) {
  let valid = true;
  rules.forEach(rule => {
    const input = form.elements[rule.name];
    if (!input) return;
    const message = rule.validate(input.value);
    const error = document.getElementById(rule.errorId);
    input.classList.toggle('is-invalid', Boolean(message));
    input.classList.toggle('is-valid', !message && input.value !== '');
    if (error) error.textContent = message || '';
    if (message) valid = false;
  });
  return valid;
}

function selectState(select, errorId, message) {
  const invalid = !select.value;
  select.classList.toggle('is-invalid', invalid);
  select.classList.toggle('is-valid', !invalid);
  const error = document.getElementById(errorId);
  if (error) error.textContent = invalid ? message : '';
  return !invalid;
}

function initForms() {
  const contact = document.getElementById('form-contacto');
  if (contact) {
    const rules = [
      {
        name: 'nombre', errorId: 'error-nombre', validate: value => {
          const clean = value.trim();
          if (!clean) return 'El nombre es obligatorio.';
          if (clean.length > 20) return 'Máximo 20 caracteres.';
          if (!textoNombreValido(clean)) return 'El nombre solo puede contener letras y espacios.';
          return '';
        }
      },
      { name: 'correo', errorId: 'error-correo', validate: value => !value.trim() ? 'El correo es obligatorio.' : value.length > 100 ? 'Máximo 100 caracteres.' : !emailValido(value.trim()) ? 'Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.' : '' },
      { name: 'comentario', errorId: 'error-comentario', validate: value => !value.trim() ? 'El comentario es obligatorio.' : value.length > 500 ? 'Máximo 500 caracteres.' : '' }
    ];
    bindLiveValidation(contact, rules);
    contact.addEventListener('submit', event => {
      event.preventDefault();
      if (!runRules(contact, rules)) return;
      document.getElementById('mensaje-exito')?.classList.remove('d-none');
      contact.reset();
      contact.querySelectorAll('.is-valid').forEach(element => element.classList.remove('is-valid'));
    });
  }

  const login = document.getElementById('form-login');
  if (login) {
    const rules = [
      { name: 'correo', errorId: 'error-login-correo', validate: value => !value.trim() ? 'El correo es obligatorio.' : value.length > 100 ? 'Máximo 100 caracteres.' : !emailValido(value.trim()) ? 'Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.' : '' },
      { name: 'password', errorId: 'error-login-password', validate: value => !value ? 'La contraseña es obligatoria.' : value.length < 4 || value.length > 10 ? 'Debe tener entre 4 y 10 caracteres.' : '' }
    ];
    bindLiveValidation(login, rules);
    login.addEventListener('submit', event => {
      event.preventDefault();
      document.getElementById('mensaje-login-error')?.classList.add('d-none');
      if (!runRules(login, rules)) return;
      const correo = login.elements.correo.value.trim().toLowerCase();
      const password = login.elements.password.value;
      const user = getUsuarios().find(entry => entry.correo.toLowerCase() === correo && entry.password === password && entry.estado === 'Activo');
      if (!user) {
        const error = document.getElementById('mensaje-login-error');
        if (error) { error.textContent = 'Correo o contraseña incorrectos.'; error.classList.remove('d-none'); }
        return;
      }
      setSession(user);
      document.getElementById('mensaje-login-exito')?.classList.remove('d-none');
      setTimeout(() => location.href = user.tipo === 'Cliente' ? 'index.html' : 'admin/index.html', 500);
    });
  }

  const registro = document.getElementById('form-registro');
  if (registro) {
    const fields = {
      run: registro.elements.run, nombres: registro.elements.nombres, apellidos: registro.elements.apellidos,
      correo: registro.elements.correo, password: registro.elements.password, passwordConfirm: registro.elements.passwordConfirm,
      fechaNacimiento: registro.elements.fechaNacimiento, region: registro.elements.region,
      comuna: registro.elements.comuna, direccion: registro.elements.direccion
    };
    const rules = [
      { name: 'run', errorId: 'error-reg-run', validate: value => !value.trim() ? 'El RUN es obligatorio.' : !runValido(value) ? 'RUN inválido. Usa formato sin puntos ni guion.' : '' },
      {
        name: 'nombres', errorId: 'error-reg-nombres', validate: value => {
          const clean = value.trim();
          if (!clean) return 'El nombre es obligatorio.';
          if (clean.length > 20) return 'Máximo 20 caracteres.';
          if (!textoNombreValido(clean)) return 'El nombre solo puede contener letras y espacios.';
          return '';
        }
      },
      {
        name: 'apellidos', errorId: 'error-reg-apellidos', validate: value => {
          const clean = value.trim();
          if (!clean) return 'Los apellidos son obligatorios.';
          if (clean.length > 20) return 'Máximo 20 caracteres.';
          if (!textoNombreValido(clean)) return 'Los apellidos solo pueden contener letras y espacios.';
          return '';
        }
      },
      { name: 'correo', errorId: 'error-reg-correo', validate: value => !value.trim() ? 'El correo es obligatorio.' : value.length > 100 ? 'Máximo 100 caracteres.' : !emailValido(value.trim()) ? 'Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.' : '' },
      { name: 'password', errorId: 'error-reg-password', validate: value => !value ? 'La contraseña es obligatoria.' : value.length < 4 || value.length > 10 ? 'Debe tener entre 4 y 10 caracteres.' : '' },
      { name: 'passwordConfirm', errorId: 'error-reg-password-confirm', validate: value => !value ? 'Confirma tu contraseña.' : value !== fields.password.value ? 'Las contraseñas no coinciden.' : '' },
      { name: 'fechaNacimiento', errorId: 'error-reg-fecha', validate: value => !fechaNoFutura(value) ? 'La fecha de nacimiento no puede ser futura.' : '' },
      { name: 'direccion', errorId: 'error-reg-direccion', validate: value => !value.trim() ? 'La dirección es obligatoria.' : value.length > 300 ? 'Máximo 300 caracteres.' : '' }
    ];
    bindLiveValidation(registro, rules);

    fields.region?.addEventListener('change', () => {
      cargarComunas(fields.region.value);
      selectState(fields.region, 'error-reg-region', 'Selecciona una región.');
      selectState(fields.comuna, 'error-reg-comuna', 'Selecciona una comuna.');
    });
    fields.comuna?.addEventListener('change', () => selectState(fields.comuna, 'error-reg-comuna', 'Selecciona una comuna.'));

    registro.addEventListener('submit', event => {
      event.preventDefault();
      const rulesOk = runRules(registro, rules);
      const regionOk = selectState(fields.region, 'error-reg-region', 'Selecciona una región.');
      const comunaOk = selectState(fields.comuna, 'error-reg-comuna', 'Selecciona una comuna.');
      if (!rulesOk || !regionOk || !comunaOk) {
        registro.querySelector('.is-invalid')?.focus();
        return;
      }
      const usuarios = getUsuarios();
      const run = fields.run.value.trim().replace(/[^0-9kK]/g, '').toUpperCase();
      const correo = fields.correo.value.trim().toLowerCase();
      const duplicate = usuarios.find(user => String(user.run).replace(/[^0-9kK]/g, '').toUpperCase() === run || String(user.correo).toLowerCase() === correo);
      if (duplicate) {
        const isEmail = String(duplicate.correo).toLowerCase() === correo;
        const input = isEmail ? fields.correo : fields.run;
        const error = document.getElementById(isEmail ? 'error-reg-correo' : 'error-reg-run');
        input.classList.add('is-invalid'); input.classList.remove('is-valid');
        if (error) error.textContent = isEmail ? 'Ya existe un usuario con este correo.' : 'Ya existe un usuario con este RUN.';
        input.focus();
        return;
      }
      const user = {
        id: Math.max(0, ...usuarios.map(entry => Number(entry.id) || 0)) + 1,
        run, nombres: fields.nombres.value.trim(), apellidos: fields.apellidos.value.trim(), correo,
        password: fields.password.value, fechaNacimiento: fields.fechaNacimiento.value || '', tipo: 'Cliente',
        region: fields.region.value, comuna: fields.comuna.value, direccion: fields.direccion.value.trim(), estado: 'Activo'
      };
      usuarios.push(user);
      writeJSON(STORAGE.usuarios, usuarios);
      const success = document.getElementById('mensaje-reg-exito');
      if (success) { success.textContent = 'Usuario registrado correctamente. Ya puedes iniciar sesión.'; success.classList.remove('d-none'); }
      registro.reset();
      registro.querySelectorAll('.is-valid,.is-invalid').forEach(element => element.classList.remove('is-valid', 'is-invalid'));
      cargarComunas('');
      setTimeout(() => location.href = 'login.html', 1200);
    });
  }

  const productForm = document.getElementById('form-admin-producto');
  if (productForm) {
    const rules = [
      { name: 'codigo', errorId: 'error-prod-codigo', validate: value => !value.trim() ? 'El código es obligatorio.' : value.trim().length < 3 ? 'Mínimo 3 caracteres.' : '' },
      { name: 'nombre', errorId: 'error-prod-nombre', validate: value => !value.trim() ? 'El nombre es obligatorio.' : value.length > 100 ? 'Máximo 100 caracteres.' : '' },
      { name: 'descripcion', errorId: 'error-prod-descripcion', validate: value => value.length > 500 ? 'Máximo 500 caracteres.' : '' },
      { name: 'precio', errorId: 'error-prod-precio', validate: value => value === '' ? 'El precio es obligatorio.' : Number(value) < 0 ? 'El precio no puede ser negativo.' : '' },
      { name: 'stock', errorId: 'error-prod-stock', validate: value => value === '' ? 'El stock es obligatorio.' : !Number.isInteger(Number(value)) || Number(value) < 0 ? 'Debe ser un entero ≥ 0.' : '' },
      { name: 'stockCritico', errorId: 'error-prod-stock-critico', validate: value => value !== '' && (!Number.isInteger(Number(value)) || Number(value) < 0) ? 'Debe ser un entero ≥ 0.' : '' },
      { name: 'categoria', errorId: 'error-prod-categoria', validate: value => !value ? 'Selecciona una categoría.' : '' },
      { name: 'imagen', errorId: 'error-prod-imagen', validate: value => value && !/^https?:\/\//i.test(value) ? 'La imagen debe ser una URL válida.' : '' }
    ];
    bindLiveValidation(productForm, rules);
    productForm.addEventListener('submit', event => {
      const valid = runRules(productForm, rules);
      if (!valid) event.preventDefault();
    });
  }

  const userForm = document.getElementById('form-admin-usuario');
  if (userForm) {
    const rules = [
      { name: 'run', errorId: 'error-user-run', validate: value => !value.trim() ? 'El RUN es obligatorio.' : !runValido(value) ? 'RUN inválido.' : '' },
      {
        name: 'nombres', errorId: 'error-user-nombres', validate: value => {
          const clean = value.trim();
          if (!clean) return 'El nombre es obligatorio.';
          if (clean.length > 20) return 'Máximo 20 caracteres.';
          if (!textoNombreValido(clean)) return 'El nombre solo puede contener letras y espacios.';
          return '';
        }
      },
      {
        name: 'apellidos', errorId: 'error-user-apellidos', validate: value => {
          const clean = value.trim();
          if (!clean) return 'Los apellidos son obligatorios.';
          if (clean.length > 20) return 'Máximo 20 caracteres.';
          if (!textoNombreValido(clean)) return 'Los apellidos solo pueden contener letras y espacios.';
          return '';
        }
      },
      { name: 'correo', errorId: 'error-user-correo', validate: value => !value.trim() ? 'El correo es obligatorio.' : value.length > 100 ? 'Máximo 100 caracteres.' : !emailValido(value.trim()) ? 'Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.' : '' },
      { name: 'password', errorId: 'error-user-password', validate: value => !value ? 'La contraseña es obligatoria.' : value.length < 4 || value.length > 10 ? 'Debe tener entre 4 y 10 caracteres.' : '' },
      { name: 'direccion', errorId: 'error-user-direccion', validate: value => !value.trim() ? 'La dirección es obligatoria.' : value.length > 300 ? 'Máximo 300 caracteres.' : '' },
      { name: 'tipo', errorId: 'error-user-tipo', validate: value => !value ? 'Selecciona un rol.' : '' }
    ];
    bindLiveValidation(userForm, rules);
    userForm.addEventListener('change', () => {
      ['region', 'comuna'].forEach(name => {
        const input = userForm.elements[name];
        if (input) input.classList.toggle('is-invalid', !input.value);
      });
    });
    userForm.addEventListener('submit', event => {
      const rulesOk = runRules(userForm, rules);
      const region = userForm.elements.region;
      const comuna = userForm.elements.comuna;
      const regionOk = selectState(region, 'error-user-region', 'Selecciona una región.');
      const comunaOk = selectState(comuna, 'error-user-comuna', 'Selecciona una comuna.');
      if (!rulesOk || !regionOk || !comunaOk) event.preventDefault();
    });
  }
}

document.addEventListener('DOMContentLoaded', initForms);

function normalizarCampoNombre(input) {
  if (!input) return;
  input.addEventListener('input', () => {
    input.value = input.value
      .replace(/[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ ]/g, '')
      .replace(/\s{2,}/g, ' ')
      .slice(0, 20);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  ['nombre', 'nombres', 'apellidos'].forEach(name => {
    document.querySelectorAll(`input[name="${name}"]`).forEach(normalizarCampoNombre);
  });
});
