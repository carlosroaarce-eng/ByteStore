const STORAGE = {
  productos: 'bytestore_productos',
  carrito: 'bytestore_carrito',
  usuarios: 'bytestore_usuarios',
  sesion: 'bytestore_sesion',
  ordenes: 'bytestore_ordenes'
};

const money = value => Number(value || 0).toLocaleString('es-CL', {
  style: 'currency', currency: 'CLP', maximumFractionDigits: 0
});

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getProductos() {
  const saved = readJSON(STORAGE.productos, null);
  if (Array.isArray(saved)) return saved;
  const seed = [...PRODUCTOS_BASE];
  writeJSON(STORAGE.productos, seed);
  return seed;
}

function getCarrito() { return readJSON(STORAGE.carrito, []); }

function getUsuarios() {
  const seeded = [
    { id: 1, run: '19011022K', nombres: 'Admin', apellidos: 'ByteStore', correo: 'admin@gmail.com', password: '1234', fechaNacimiento: '1990-01-01', tipo: 'Administrador', region: 'metropolitana', comuna: 'Maipú', direccion: 'Av. Principal 1000', estado: 'Activo' },
    { id: 2, run: '19011023K', nombres: 'Valentina', apellidos: 'Vendedor', correo: 'vendedor@gmail.com', password: '1234', fechaNacimiento: '1995-05-10', tipo: 'Vendedor', region: 'metropolitana', comuna: 'Santiago', direccion: 'Alameda 200', estado: 'Activo' },
    { id: 3, run: '19011024K', nombres: 'Cliente', apellidos: 'ByteStore', correo: 'cliente@gmail.com', password: '1234', fechaNacimiento: '2000-01-01', tipo: 'Cliente', region: 'metropolitana', comuna: 'Maipú', direccion: 'Calle Demo 100', estado: 'Activo' }
  ];
  const saved = readJSON(STORAGE.usuarios, null);
  if (Array.isArray(saved)) return saved;
  writeJSON(STORAGE.usuarios, seeded);
  return seeded;
}

function cartCount() {
  return getCarrito().reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
}

function updateCartCount() {
  document.querySelectorAll('#cart-count').forEach(el => { el.textContent = cartCount(); });
}

function findProduct(id) {
  return getProductos().find(product => product.id === Number(id));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function showToast(message, type = 'success') {
  let box = document.getElementById('toast-area');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toast-area';
    box.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(box);
  }
  const toast = document.createElement('div');
  toast.className = `toast show align-items-center text-bg-${type} border-0`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `<div class="d-flex"><div class="toast-body">${escapeHtml(message)}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Cerrar"></button></div>`;
  toast.querySelector('button').addEventListener('click', () => toast.remove());
  box.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function productCard(producto) {
  const disabled = Number(producto.stock) <= 0 ? 'disabled' : '';
  return `<article class="col">
    <div class="card h-100 shadow-sm product-card border-0">
      <img src="${escapeHtml(producto.imagen)}" class="card-img-top" alt="${escapeHtml(producto.nombre)}" loading="lazy" onerror="this.onerror=null;this.src='https://images.pexels.com/photos/574073/pexels-photo-574073.jpeg?auto=compress&cs=tinysrgb&w=900'">
      <div class="card-body d-flex flex-column">
        <span class="badge text-bg-light align-self-start mb-2">${escapeHtml(producto.categoria)}</span>
        <h2 class="h5">${escapeHtml(producto.nombre)}</h2>
        <p class="text-secondary small flex-grow-1">${escapeHtml(producto.descripcion || 'Producto tecnológico de ByteStore.')}</p>
        <div class="d-flex justify-content-between align-items-center gap-2">
          <strong class="fs-5">${money(producto.precio)}</strong>
          <span class="small ${Number(producto.stock) <= Number(producto.stockCritico || 0) ? 'text-danger' : 'text-success'}" data-stock-product="${producto.id}">Stock: ${Number(producto.stock)}</span>
        </div>
      </div>
      <div class="card-footer bg-white border-0 d-flex flex-column flex-sm-row gap-2 p-3">
        <a href="detalle-producto.html?id=${encodeURIComponent(producto.id)}" class="btn btn-outline-dark flex-fill">Ver detalle</a>
        <button type="button" class="btn btn-primary flex-fill btn-add-cart" data-product-id="${producto.id}" ${disabled}>Añadir</button>
      </div>
    </div>
  </article>`;
}

function renderProductos(targetId, limit = null) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const products = limit ? getProductos().slice(0, limit) : getProductos();
  target.innerHTML = products.map(productCard).join('') || '<div class="col-12"><div class="alert alert-light border">No hay productos disponibles.</div></div>';
  target.querySelectorAll('.btn-add-cart').forEach(button => {
    button.addEventListener('click', () => agregarAlCarrito(Number(button.dataset.productId)));
  });
}

function getProducto(id) { return getProductos().find(product => product.id === Number(id)); }

function abrirModalCantidad(id) {
  const producto = getProducto(id);
  if (!producto || Number(producto.stock) <= 0) {
    showToast('Producto sin stock.', 'danger');
    return;
  }

  let modal = document.getElementById('cantidad-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'cantidad-modal';
    modal.innerHTML = `
      <div class="modal fade" tabindex="-1" aria-labelledby="cantidad-modal-title" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h2 id="cantidad-modal-title" class="modal-title fs-5">Añadir al carrito</h2>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
              <p id="cantidad-modal-producto" class="mb-3"></p>
              <label for="cantidad-modal-input" class="form-label">Cantidad</label>
              <input id="cantidad-modal-input" class="form-control" type="number" min="1" step="1" required>
              <div class="form-text">Máximo disponible: <span id="cantidad-modal-stock"></span> unidades.</div>
              <div id="cantidad-modal-error" class="invalid-feedback"></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" id="cantidad-modal-confirmar" class="btn btn-primary">Añadir</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }

  const modalElement = modal.querySelector('.modal');
  const productoLabel = modal.querySelector('#cantidad-modal-producto');
  const stockLabel = modal.querySelector('#cantidad-modal-stock');
  const input = modal.querySelector('#cantidad-modal-input');
  const error = modal.querySelector('#cantidad-modal-error');
  const confirm = modal.querySelector('#cantidad-modal-confirmar');

  productoLabel.textContent = `${producto.nombre} — ${money(producto.precio)} por unidad`;
  stockLabel.textContent = String(producto.stock);

  const itemActual = getCarrito().find(item => item.id === producto.id);
  const cantidadActual = itemActual ? Number(itemActual.cantidad) : 0;
  const maxPermitido = Math.max(0, Number(producto.stock));
  input.max = String(maxPermitido);
  input.value = String(cantidadActual > 0 ? Math.min(cantidadActual, maxPermitido) : 1);
  input.classList.remove('is-invalid', 'is-valid');
  error.textContent = '';

  const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);

  const validarCantidad = () => {
    const cantidad = Number(input.value);
    const valida = Number.isInteger(cantidad) && cantidad >= 1 && cantidad <= maxPermitido;
    input.classList.toggle('is-invalid', !valida);
    input.classList.toggle('is-valid', valida);
    error.textContent = valida
      ? ''
      : `Ingresa una cantidad entre 1 y ${maxPermitido}.`;
    return valida;
  };

  input.oninput = validarCantidad;
  input.onblur = validarCantidad;

  confirm.onclick = () => {
    if (!validarCantidad()) {
      input.focus();
      return;
    }

    const cantidad = Number(input.value);
    const carrito = getCarrito();
    const item = carrito.find(entry => entry.id === producto.id);

    if (item) {
      item.cantidad = cantidad;
    } else {
      carrito.push({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagen,
        cantidad
      });
    }

    writeJSON(STORAGE.carrito, carrito);
    updateCartCount();
    renderCarrito();
    modalInstance.hide();
    showToast(`${producto.nombre}: ${cantidad} ${cantidad === 1 ? 'unidad añadida' : 'unidades añadidas'} al carrito.`, 'success');
  };

  modalElement.addEventListener('shown.bs.modal', () => {
    input.focus();
    input.select();
  }, { once: true });

  modalInstance.show();
}

function agregarAlCarrito(id) {
  abrirModalCantidad(id);
}

function cambiarCantidad(id, delta) {
  const carrito = getCarrito();
  const item = carrito.find(entry => entry.id === Number(id));
  const producto = findProduct(id);
  if (!item || !producto) return;

  const stockDisponible = Number(producto.stock);
  const next = Math.max(0, Math.min(stockDisponible, Number(item.cantidad) + delta));

  if (next === 0) {
    carrito.splice(carrito.indexOf(item), 1);
  } else {
    item.cantidad = next;
    // Mantiene el precio/nombre actualizados si el producto fue editado en administración.
    item.nombre = producto.nombre;
    item.precio = Number(producto.precio);
    item.imagen = producto.imagen;
  }

  writeJSON(STORAGE.carrito, carrito);
  updateCartCount();
  renderCarrito();
}

function eliminarDelCarrito(id) {
  writeJSON(STORAGE.carrito, getCarrito().filter(item => item.id !== Number(id)));
  updateCartCount();
  renderCarrito();
}

function vaciarCarrito() {
  if (getCarrito().length && !window.confirm('¿Seguro que deseas vaciar el carrito?')) return;
  writeJSON(STORAGE.carrito, []);
  updateCartCount();
  renderCarrito();
}

function renderCarrito() {
  const target = document.getElementById('carrito-lista');
  if (!target) return;
  const empty = document.getElementById('carrito-vacio');
  const summary = document.getElementById('carrito-resumen');
  const carrito = getCarrito();

  target.innerHTML = '';
  if (!carrito.length) {
    empty?.classList.remove('d-none');
    summary?.classList.add('d-none');
    return;
  }
  empty?.classList.add('d-none');
  summary?.classList.remove('d-none');

  target.innerHTML = carrito.map(item => `<div class="card shadow-sm mb-3 border-0">
    <div class="card-body"><div class="row g-3 align-items-center">
      <div class="col-4 col-md-2"><img class="img-fluid rounded cart-img" src="${escapeHtml(item.imagen)}" alt="${escapeHtml(item.nombre)}"></div>
      <div class="col-8 col-md-4"><h2 class="h6 mb-1">${escapeHtml(item.nombre)}</h2><div class="small text-secondary">${money(item.precio)} c/u</div></div>
      <div class="col-7 col-md-3"><div class="input-group">
        <button type="button" class="btn btn-outline-secondary cart-minus" data-id="${item.id}" aria-label="Disminuir cantidad">−</button>
        <span class="input-group-text flex-grow-1 justify-content-center">${item.cantidad}</span>
        <button type="button" class="btn btn-outline-secondary cart-plus" data-id="${item.id}" aria-label="Aumentar cantidad">+</button>
      </div></div>
      <div class="col-5 col-md-2 text-end fw-bold">${money(item.precio * item.cantidad)}</div>
      <div class="col-12 col-md-1 text-md-end"><button type="button" class="btn btn-sm btn-outline-danger cart-remove" data-id="${item.id}">Eliminar</button></div>
    </div></div></div>`).join('');

  target.querySelectorAll('.cart-minus').forEach(b => b.addEventListener('click', () => cambiarCantidad(b.dataset.id, -1)));
  target.querySelectorAll('.cart-plus').forEach(b => b.addEventListener('click', () => cambiarCantidad(b.dataset.id, 1)));
  target.querySelectorAll('.cart-remove').forEach(b => b.addEventListener('click', () => eliminarDelCarrito(b.dataset.id)));

  const total = carrito.reduce((sum, item) => sum + Number(item.precio) * Number(item.cantidad), 0);
  document.getElementById('subtotal-carrito')?.replaceChildren(document.createTextNode(money(total)));
  document.getElementById('total-carrito')?.replaceChildren(document.createTextNode(money(total)));
}

function renderDetalle() {
  const target = document.getElementById('detalle-contenedor');
  if (!target) return;
  const product = findProduct(new URLSearchParams(location.search).get('id'));
  if (!product) {
    target.innerHTML = '<div class="alert alert-warning">Producto no encontrado. <a href="productos.html" class="alert-link">Volver al catálogo</a>.</div>';
    return;
  }
  target.innerHTML = `<div class="row g-4 align-items-center">
    <div class="col-md-6"><img class="img-fluid rounded-4 shadow-sm w-100 product-detail-img" src="${escapeHtml(product.imagen)}" alt="${escapeHtml(product.nombre)}" onerror="this.onerror=null;this.src='https://images.pexels.com/photos/574073/pexels-photo-574073.jpeg?auto=compress&cs=tinysrgb&w=900'"></div>
    <div class="col-md-6"><span class="badge text-bg-dark mb-2">${escapeHtml(product.categoria)}</span><h1 class="display-6 fw-bold">${escapeHtml(product.nombre)}</h1><p class="lead text-secondary">${escapeHtml(product.descripcion)}</p><div class="fs-2 fw-bold mb-2">${money(product.precio)}</div><p class="mb-4 ${Number(product.stock) <= Number(product.stockCritico || 0) ? 'text-danger' : 'text-success'}">${Number(product.stock) > 0 ? `${product.stock} unidades disponibles` : 'Agotado'}</p><div class="d-flex flex-wrap gap-2"><button id="detalle-add" type="button" class="btn btn-primary btn-lg" ${Number(product.stock) <= 0 ? 'disabled' : ''}>Añadir al carrito</button><a class="btn btn-outline-dark btn-lg" href="productos.html">Volver</a></div></div>
  </div>`;
  document.getElementById('detalle-add')?.addEventListener('click', () => agregarAlCarrito(product.id));
}

function renderAdminProductos() {
  const target = document.getElementById('tabla-productos-admin');
  if (!target) return;
  const session = getSession();
  const canEdit = session?.tipo === 'Administrador';
  target.innerHTML = getProductos().map(product => `<tr>
    <td>${escapeHtml(product.codigo)}</td>
    <td><div class="d-flex align-items-center gap-2"><img class="rounded avatar object-fit-cover" src="${escapeHtml(product.imagen)}" alt=""><span>${escapeHtml(product.nombre)}</span></div></td>
    <td>${escapeHtml(product.categoria)}</td><td>${money(product.precio)}</td>
    <td><span class="badge ${Number(product.stock) <= Number(product.stockCritico || 0) ? 'text-bg-danger' : 'text-bg-success'}">${product.stock}</span></td>
    <td class="text-end">${canEdit ? `<a href="producto-form.html?id=${product.id}" class="btn btn-sm btn-outline-primary me-1">Editar</a><button type="button" class="btn btn-sm btn-outline-danger delete-product" data-id="${product.id}">Eliminar</button>` : '<span class="text-secondary small">Solo lectura</span>'}</td>
  </tr>`).join('');
  target.querySelectorAll('.delete-product').forEach(button => button.addEventListener('click', () => eliminarProducto(Number(button.dataset.id))));
}

function guardarProductoDesdeFormulario(event) {
  event.preventDefault();
  const form = event.currentTarget;
  form.classList.add('was-validated');
  if (!form.checkValidity()) return;
  const data = Object.fromEntries(new FormData(form).entries());
  const id = Number(data.id || 0);
  const productos = getProductos();
  const codigo = data.codigo.trim();
  const codigoDuplicado = productos.some(p => p.codigo.toLowerCase() === codigo.toLowerCase() && p.id !== id);
  if (codigoDuplicado) return mostrarErrorGeneral(form, 'Ya existe un producto con ese código.');
  const record = {
    id: id || Math.max(0, ...productos.map(p => Number(p.id) || 0)) + 1,
    codigo,
    nombre: data.nombre.trim(),
    descripcion: data.descripcion.trim(),
    precio: Number(data.precio),
    stock: Number(data.stock),
    stockCritico: data.stockCritico === '' ? 0 : Number(data.stockCritico),
    categoria: data.categoria,
    imagen: data.imagen.trim() || PRODUCTOS_BASE[0].imagen
  };
  if (id) {
    const index = productos.findIndex(p => p.id === id);
    if (index >= 0) productos[index] = record;
  } else productos.push(record);
  writeJSON(STORAGE.productos, productos);
  location.href = 'productos.html?saved=1';
}

function mostrarErrorGeneral(form, message) {
  let alert = form.querySelector('.form-general-error');
  if (!alert) {
    alert = document.createElement('div');
    alert.className = 'alert alert-danger form-general-error mt-3';
    alert.setAttribute('role', 'alert');
    form.prepend(alert);
  }
  alert.textContent = message;
}

function cargarProductoForm() {
  const form = document.getElementById('form-admin-producto');
  if (!form) return;
  const id = Number(new URLSearchParams(location.search).get('id'));
  if (!id) return;
  const product = findProduct(id);
  if (!product) return;
  Object.entries({ codigo: product.codigo, nombre: product.nombre, descripcion: product.descripcion, precio: product.precio, stock: product.stock, stockCritico: product.stockCritico, categoria: product.categoria, imagen: product.imagen }).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value;
  });
  if (form.elements.id) form.elements.id.value = product.id;
  document.getElementById('form-title')?.replaceChildren(document.createTextNode('Editar producto'));
}

function eliminarProducto(id) {
  if (!window.confirm('¿Eliminar este producto?')) return;
  writeJSON(STORAGE.productos, getProductos().filter(product => product.id !== Number(id)));
  renderAdminProductos();
  renderProductos('contenedor-productos');
  showToast('Producto eliminado.', 'success');
}

function renderUsuariosAdmin() {
  const target = document.getElementById('tabla-usuarios-admin');
  if (!target) return;
  target.innerHTML = getUsuarios().map(user => `<tr>
    <td>${escapeHtml(user.run)}</td><td>${escapeHtml(user.nombres)} ${escapeHtml(user.apellidos)}</td><td>${escapeHtml(user.correo)}</td><td>${escapeHtml(user.tipo)}</td>
    <td><span class="badge ${user.estado === 'Activo' ? 'text-bg-success' : 'text-bg-secondary'}">${escapeHtml(user.estado)}</span></td>
    <td class="text-end"><a class="btn btn-sm btn-outline-primary me-1" href="usuario-form.html?id=${user.id}">Editar</a><button type="button" class="btn btn-sm btn-outline-danger delete-user" data-id="${user.id}">Eliminar</button></td>
  </tr>`).join('');
  target.querySelectorAll('.delete-user').forEach(button => button.addEventListener('click', () => eliminarUsuario(Number(button.dataset.id))));
}

function cargarUsuarioForm() {
  const form = document.getElementById('form-admin-usuario');
  if (!form) return;
  const id = Number(new URLSearchParams(location.search).get('id'));
  if (!id) return;
  const user = getUsuarios().find(entry => entry.id === id);
  if (!user) return;
  Object.entries({ run: user.run, nombres: user.nombres, apellidos: user.apellidos, correo: user.correo, password: user.password || '', fechaNacimiento: user.fechaNacimiento, tipo: user.tipo, region: user.region, comuna: user.comuna, direccion: user.direccion, estado: user.estado }).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value;
  });
  if (form.elements.id) form.elements.id.value = id;
  cargarComunas(user.region, user.comuna);
  document.getElementById('usuario-form-title')?.replaceChildren(document.createTextNode('Editar usuario'));
}

function guardarUsuario(event) {
  event.preventDefault();
  const form = event.currentTarget;
  form.classList.add('was-validated');
  if (!form.checkValidity()) return;
  const data = Object.fromEntries(new FormData(form).entries());
  const usuarios = getUsuarios();
  const id = Number(data.id || 0);
  const run = data.run.trim().replace(/[^0-9kK]/g, '').toUpperCase();
  const correo = data.correo.trim().toLowerCase();
  const duplicate = usuarios.find(u => u.id !== id && (String(u.run).replace(/[^0-9kK]/g, '').toUpperCase() === run || String(u.correo).toLowerCase() === correo));
  if (duplicate) return mostrarErrorGeneral(form, 'Ya existe un usuario con ese RUN o correo.');
  const record = {
    id: id || Math.max(0, ...usuarios.map(u => Number(u.id) || 0)) + 1, run,
    nombres: data.nombres.trim(), apellidos: data.apellidos.trim(), correo,
    password: data.password, fechaNacimiento: data.fechaNacimiento || '', tipo: data.tipo,
    region: data.region, comuna: data.comuna, direccion: data.direccion.trim(), estado: data.estado || 'Activo'
  };
  if (id) {
    const index = usuarios.findIndex(u => u.id === id);
    if (index >= 0) usuarios[index] = record;
  } else usuarios.push(record);
  writeJSON(STORAGE.usuarios, usuarios);
  location.href = 'usuarios.html?saved=1';
}

function eliminarUsuario(id) {
  const session = getSession();
  if (session?.id === Number(id)) return showToast('No puedes eliminar el usuario con la sesión activa.', 'warning');
  if (!window.confirm('¿Eliminar este usuario?')) return;
  writeJSON(STORAGE.usuarios, getUsuarios().filter(user => user.id !== Number(id)));
  renderUsuariosAdmin();
  showToast('Usuario eliminado.', 'success');
}

function cargarComunas(regionValue, selected = '') {
  document.querySelectorAll('select[data-region-source]').forEach(select => {
    const destination = document.getElementById(select.dataset.regionSource);
    if (!destination) return;
    const region = select.value || regionValue || '';
    const communes = REGIONES[region] || [];
    destination.innerHTML = '<option value="">Seleccione una comuna</option>' + communes.map(c => `<option value="${escapeHtml(c)}" ${c === selected ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
    destination.disabled = communes.length === 0;
  });
}

function setSession(user) { writeJSON(STORAGE.sesion, user); }
function getSession() { return readJSON(STORAGE.sesion, null); }

function finalizarCompra() {
  const carrito = getCarrito();
  if (!carrito.length) {
    showToast('Tu carrito está vacío.', 'warning');
    return;
  }

  // La compra descuenta el stock persistido de cada producto.
  const productos = getProductos();
  const productosActualizados = productos.map(producto => ({ ...producto }));
  const lineasCompra = [];

  for (const item of carrito) {
    const producto = productosActualizados.find(p => p.id === Number(item.id));
    const cantidad = Number(item.cantidad);

    if (!producto) {
      showToast(`El producto ${item.nombre} ya no está disponible.`, 'danger');
      return;
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0 || cantidad > Number(producto.stock)) {
      showToast(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}.`, 'warning');
      renderProductos('featured-list', 4);
      renderProductos('contenedor-productos');
      renderCarrito();
      return;
    }

    producto.stock = Number(producto.stock) - cantidad;
    lineasCompra.push({
      id: producto.id,
      codigo: producto.codigo,
      nombre: producto.nombre,
      precio: Number(producto.precio),
      cantidad,
      subtotal: Number(producto.precio) * cantidad,
      imagen: producto.imagen
    });
  }

  const total = lineasCompra.reduce((sum, item) => sum + item.subtotal, 0);
  const orders = readJSON(STORAGE.ordenes, []);

  orders.push({
    id: Date.now(),
    fecha: new Date().toLocaleString('es-CL'),
    total,
    estado: 'Pendiente',
    items: lineasCompra
  });

  // Persistencia: stock nuevo + orden + carrito vacío.
  writeJSON(STORAGE.productos, productosActualizados);
  writeJSON(STORAGE.ordenes, orders);
  writeJSON(STORAGE.carrito, []);

  // Notifica también a las páginas abiertas en la misma pestaña/origen.
  window.dispatchEvent(new CustomEvent('bytestore-stock-updated', {
    detail: { productos: productosActualizados }
  }));

  // Renderizado inmediato en la página actual.
  updateCartCount();
  renderProductos('featured-list', 4);
  renderProductos('contenedor-productos');
  renderDetalle();
  renderCarrito();
  renderAdminProductos();

  // Aviso de stock crítico o agotado para la compra recién realizada.
  const criticos = productosActualizados
    .filter(producto => lineasCompra.some(item => item.id === producto.id))
    .filter(producto => Number(producto.stock) <= Number(producto.stockCritico || 0));

  if (criticos.length) {
    showToast(`Compra realizada. ${criticos.map(p => p.stock === 0 ? `${p.nombre} agotado` : `${p.nombre}: ${p.stock} en stock`).join(' · ')}`, 'warning');
  } else {
    showToast('Compra realizada correctamente. El stock fue actualizado.', 'success');
  }
}

function requireRole(roles) {
  const session = getSession();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!session || !allowed.includes(session.tipo) || session.estado === 'Inactivo') {
    location.href = session?.tipo === 'Cliente' ? '../index.html' : '../login.html?acceso=denegado';
    return null;
  }
  return session;
}

function applyRoleUI() {
  const session = getSession();
  document.querySelectorAll('[data-role]').forEach(el => {
    const roles = (el.dataset.role || '').split(',').map(value => value.trim());
    el.classList.toggle('d-none', !session || !roles.includes(session.tipo));
  });
}

function init() {
  updateCartCount();
  applyRoleUI();
  renderProductos('featured-list', 4);
  renderProductos('contenedor-productos');
  renderDetalle();
  renderCarrito();
  renderAdminProductos();
  renderUsuariosAdmin();
  cargarProductoForm();
  cargarUsuarioForm();

  const productoForm = document.getElementById('form-admin-producto');
  if (productoForm) productoForm.addEventListener('submit', guardarProductoDesdeFormulario);
  const usuarioForm = document.getElementById('form-admin-usuario');
  if (usuarioForm) usuarioForm.addEventListener('submit', guardarUsuario);

  document.querySelectorAll('select[data-region-source]').forEach(select => {
    select.addEventListener('change', () => cargarComunas(select.value));
  });

  const session = getSession();
  const sessionName = document.getElementById('session-name');
  if (sessionName) sessionName.textContent = session ? `${session.nombres} · ${session.tipo}` : 'Sin sesión';

  const logout = document.getElementById('logout-btn');
  if (logout) logout.addEventListener('click', () => { localStorage.removeItem(STORAGE.sesion); location.href = '../index.html'; });

  const emptyCartButton = document.getElementById('vaciar-carrito');
  if (emptyCartButton) emptyCartButton.addEventListener('click', vaciarCarrito);

  const checkout = document.getElementById('finalizar-compra');
  if (checkout) checkout.addEventListener('click', finalizarCompra);

  const search = document.getElementById('search-productos');
  if (search) search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    const target = document.getElementById('contenedor-productos');
    if (!target) return;
    const filtered = getProductos().filter(p => `${p.nombre} ${p.categoria} ${p.descripcion}`.toLowerCase().includes(query));
    target.innerHTML = filtered.map(productCard).join('') || '<div class="col-12"><div class="alert alert-light border">No encontramos productos para esa búsqueda.</div></div>';
    target.querySelectorAll('.btn-add-cart').forEach(button => button.addEventListener('click', () => agregarAlCarrito(Number(button.dataset.productId))));
  });

  const roleLabel = document.getElementById('role-label');
  if (roleLabel && session) roleLabel.textContent = session.tipo;
}

function refrescarInterfaz() {
  updateCartCount();
  renderCarrito();
  renderProductos('featured-list', 4);
  renderProductos('contenedor-productos');
  renderDetalle();
  renderAdminProductos();
  renderUsuariosAdmin();
}

window.addEventListener('storage', event => {
  if (Object.values(STORAGE).includes(event.key)) {
    refrescarInterfaz();
  }
});

window.addEventListener('bytestore-stock-updated', () => {
  refrescarInterfaz();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Al volver al catálogo después de comprar, se lee siempre el stock persistido.
    refrescarInterfaz();
  }
});

document.addEventListener('DOMContentLoaded', init);


/* Logout binding from admin/ordenes */
document.addEventListener('DOMContentLoaded', () => {
  const logoutAction = document.getElementById('logout-action');
  if (logoutAction) {
    logoutAction.addEventListener('click', (event) => {
      event.preventDefault();
      localStorage.removeItem('sesionActual');
      window.location.href = '../login.html';
    });
  }
});
