
const STORAGE = { productos: 'bytestore_productos', carrito: 'bytestore_carrito', usuarios: 'bytestore_usuarios', sesion: 'bytestore_sesion', ordenes: 'bytestore_ordenes' };
const money = value => Number(value || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

function readJSON(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } }
function writeJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function getProductos() { const saved = readJSON(STORAGE.productos, null); if (Array.isArray(saved) && saved.length) return saved; writeJSON(STORAGE.productos, PRODUCTOS_BASE); return [...PRODUCTOS_BASE]; }
function getCarrito() { return readJSON(STORAGE.carrito, []); }
function getUsuarios() { return readJSON(STORAGE.usuarios, [
  { id: 1, run: '19011022K', nombres: 'Admin', apellidos: 'ByteStore', correo: 'admin@gmail.com', fechaNacimiento: '1990-01-01', tipo: 'Administrador', region: 'metropolitana', comuna: 'Maipú', direccion: 'Av. Principal 1000', estado: 'Activo' },
  { id: 2, run: '19011023K', nombres: 'Valentina', apellidos: 'Vendedor', correo: 'vendedor@gmail.com', fechaNacimiento: '1995-05-10', tipo: 'Vendedor', region: 'metropolitana', comuna: 'Santiago', direccion: 'Alameda 200', estado: 'Activo' }
]); }
function setFieldError(el, message) { if (!el) return; el.textContent = message || ''; }
function cartCount() { return getCarrito().reduce((sum, item) => sum + item.cantidad, 0); }
function updateCartCount() { document.querySelectorAll('#cart-count').forEach(el => el.textContent = cartCount()); }
function findProduct(id) { return getProductos().find(p => p.id === Number(id)); }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

function productCard(producto) {
  const disabled = producto.stock <= 0 ? 'disabled' : '';
  return `<article class="col"><div class="card h-100 shadow-sm product-card">
    <img src="${escapeHtml(producto.imagen)}" class="card-img-top" alt="${escapeHtml(producto.nombre)}" loading="lazy" onerror="this.src='https://images.pexels.com/photos/574073/pexels-photo-574073.jpeg?auto=compress&cs=tinysrgb&w=900'">
    <div class="card-body d-flex flex-column">
      <span class="badge text-bg-light align-self-start mb-2">${escapeHtml(producto.categoria)}</span>
      <h3 class="h5">${escapeHtml(producto.nombre)}</h3>
      <p class="text-secondary small flex-grow-1">${escapeHtml(producto.descripcion || 'Producto tecnológico de ByteStore.')}</p>
      <div class="d-flex justify-content-between align-items-center gap-2"><strong class="fs-5">${money(producto.precio)}</strong><span class="small ${producto.stock <= producto.stockCritico ? 'text-danger' : 'text-success'}">Stock: ${producto.stock}</span></div>
    </div>
    <div class="card-footer bg-white border-0 d-flex gap-2 p-3">
      <a href="detalle-producto.html?id=${producto.id}" class="btn btn-outline-dark flex-fill">Ver detalle</a>
      <button class="btn btn-primary flex-fill" onclick="agregarAlCarrito(${producto.id})" ${disabled}>Añadir</button>
    </div>
  </div></article>`;
}

function renderProductos(targetId, limit = null) { const target = document.getElementById(targetId); if (!target) return; const items = limit ? getProductos().slice(0, limit) : getProductos(); target.innerHTML = items.map(productCard).join(''); }
function agregarAlCarrito(id) {
  const producto = findProduct(id); if (!producto || producto.stock <= 0) return showToast('Producto sin stock.', 'danger');
  const carrito = getCarrito(); const item = carrito.find(x => x.id === producto.id); const cantidadActual = item?.cantidad || 0;
  if (cantidadActual >= producto.stock) return showToast('No puedes superar el stock disponible.', 'warning');
  if (item) item.cantidad += 1; else carrito.push({ id: producto.id, nombre: producto.nombre, precio: producto.precio, imagen: producto.imagen, cantidad: 1 });
  writeJSON(STORAGE.carrito, carrito); updateCartCount(); renderCarrito(); showToast('Producto añadido al carrito.', 'success');
}
function cambiarCantidad(id, delta) {
  const carrito = getCarrito(); const item = carrito.find(x => x.id === Number(id)); const producto = findProduct(id); if (!item || !producto) return;
  item.cantidad = Math.min(producto.stock, item.cantidad + delta);
  if (item.cantidad <= 0) carrito.splice(carrito.indexOf(item), 1);
  writeJSON(STORAGE.carrito, carrito); updateCartCount(); renderCarrito();
}
function eliminarDelCarrito(id) { const carrito = getCarrito().filter(x => x.id !== Number(id)); writeJSON(STORAGE.carrito, carrito); updateCartCount(); renderCarrito(); }
function vaciarCarrito() { writeJSON(STORAGE.carrito, []); updateCartCount(); renderCarrito(); }
function renderCarrito() {
  const target = document.getElementById('carrito-lista'); const empty = document.getElementById('carrito-vacio'); const summary = document.getElementById('carrito-resumen'); if (!target) return;
  const carrito = getCarrito(); target.innerHTML = '';
  if (!carrito.length) { if (empty) empty.classList.remove('d-none'); if (summary) summary.classList.add('d-none'); return; }
  if (empty) empty.classList.add('d-none'); if (summary) summary.classList.remove('d-none');
  target.innerHTML = carrito.map(item => `<div class="card shadow-sm mb-3"><div class="card-body"><div class="row g-3 align-items-center">
    <div class="col-4 col-md-2"><img class="img-fluid rounded cart-img" src="${escapeHtml(item.imagen)}" alt="${escapeHtml(item.nombre)}"></div>
    <div class="col-8 col-md-4"><h2 class="h6 mb-1">${escapeHtml(item.nombre)}</h2><div class="small text-secondary">${money(item.precio)} c/u</div></div>
    <div class="col-7 col-md-3"><div class="input-group"><button class="btn btn-outline-secondary" onclick="cambiarCantidad(${item.id},-1)">−</button><span class="input-group-text flex-grow-1 justify-content-center">${item.cantidad}</span><button class="btn btn-outline-secondary" onclick="cambiarCantidad(${item.id},1)">+</button></div></div>
    <div class="col-5 col-md-2 text-end fw-bold">${money(item.precio * item.cantidad)}</div>
    <div class="col-12 col-md-1 text-end"><button class="btn btn-sm btn-outline-danger" onclick="eliminarDelCarrito(${item.id})">Eliminar</button></div>
  </div></div></div>`).join('');
  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0); const subtotal = document.getElementById('subtotal-carrito'); const totalEl = document.getElementById('total-carrito'); if (subtotal) subtotal.textContent = money(total); if (totalEl) totalEl.textContent = money(total);
}
function renderDetalle() {
  const target = document.getElementById('detalle-contenedor'); if (!target) return; const product = findProduct(new URLSearchParams(location.search).get('id'));
  if (!product) { target.innerHTML = '<div class="alert alert-warning">Producto no encontrado. <a href="productos.html" class="alert-link">Volver al catálogo</a>.</div>'; return; }
  const disabled = product.stock <= 0 ? 'disabled' : '';
  target.innerHTML = `<div class="row g-4 align-items-center"><div class="col-md-6"><img class="img-fluid rounded-4 shadow-sm w-100 product-detail-img" src="${escapeHtml(product.imagen)}" alt="${escapeHtml(product.nombre)}"></div><div class="col-md-6"><span class="badge text-bg-dark mb-2">${escapeHtml(product.categoria)}</span><h1 class="display-6 fw-bold">${escapeHtml(product.nombre)}</h1><p class="lead text-secondary">${escapeHtml(product.descripcion)}</p><div class="fs-2 fw-bold mb-2">${money(product.precio)}</div><p class="mb-4 ${product.stock <= product.stockCritico ? 'text-danger' : 'text-success'}">${product.stock > 0 ? `${product.stock} unidades disponibles` : 'Agotado'}</p><div class="d-flex flex-wrap gap-2"><button class="btn btn-primary btn-lg" onclick="agregarAlCarrito(${product.id})" ${disabled}>Añadir al carrito</button><a class="btn btn-outline-dark btn-lg" href="productos.html">Volver</a></div></div></div>`;
}

function renderAdminProductos() {
  const target = document.getElementById('tabla-productos-admin'); if (!target) return; const productos = getProductos();
  const canEdit=getSession()?.tipo==='Administrador'; target.innerHTML = productos.map(p => `<tr><td>${escapeHtml(p.codigo)}</td><td><div class="d-flex align-items-center gap-2"><img class="rounded avatar object-fit-cover" src="${escapeHtml(p.imagen)}" alt=""><span>${escapeHtml(p.nombre)}</span></div></td><td>${escapeHtml(p.categoria)}</td><td>${money(p.precio)}</td><td><span class="badge ${p.stock <= p.stockCritico ? 'text-bg-danger' : 'text-bg-success'}">${p.stock}</span></td><td class="text-end">${canEdit ? `<a href="producto-form.html?id=${p.id}" class="btn btn-sm btn-outline-primary">Editar</a> <button class="btn btn-sm btn-outline-danger" onclick="eliminarProducto(${p.id})">Eliminar</button>` : '<span class="text-secondary small">Solo lectura</span>'}</td></tr>`).join('');
}
function guardarProductoDesdeFormulario(e) {
  e.preventDefault(); const f = e.currentTarget; if (!f.checkValidity()) { f.classList.add('was-validated'); return; }
  const data = Object.fromEntries(new FormData(f).entries()); const id = Number(data.id || 0); const productos = getProductos(); const record = { id: id || Math.max(0, ...productos.map(p => p.id)) + 1, codigo: data.codigo.trim(), nombre: data.nombre.trim(), descripcion: data.descripcion.trim(), precio: Number(data.precio), stock: Number(data.stock), stockCritico: Number(data.stockCritico || 0), categoria: data.categoria, imagen: data.imagen.trim() || PRODUCTOS_BASE[0].imagen };
  if (id) { const index = productos.findIndex(p => p.id === id); if (index >= 0) productos[index] = record; } else productos.push(record);
  writeJSON(STORAGE.productos, productos); location.href = 'productos.html?saved=1';
}
function cargarProductoForm() {
  const f = document.getElementById('form-admin-producto'); if (!f) return; const id = Number(new URLSearchParams(location.search).get('id')); if (!id) return;
  const p = findProduct(id); if (!p) return;
  for (const [key, value] of Object.entries({codigo:p.codigo,nombre:p.nombre,descripcion:p.descripcion,precio:p.precio,stock:p.stock,stockCritico:p.stockCritico,categoria:p.categoria,imagen:p.imagen})) { const el = f.elements[key]; if (el) el.value = value; }
  f.elements.id.value = p.id; document.getElementById('form-title').textContent = 'Editar producto';
}
function eliminarProducto(id) { const productos = getProductos().filter(p => p.id !== Number(id)); writeJSON(STORAGE.productos, productos); localStorage.setItem(STORAGE.productos, JSON.stringify(productos)); renderAdminProductos(); renderProductos('contenedor-productos'); }

function renderUsuariosAdmin() {
  const target = document.getElementById('tabla-usuarios-admin'); if (!target) return; target.innerHTML = getUsuarios().map(u => `<tr><td>${escapeHtml(u.run)}</td><td>${escapeHtml(u.nombres)} ${escapeHtml(u.apellidos)}</td><td>${escapeHtml(u.correo)}</td><td>${escapeHtml(u.tipo)}</td><td><span class="badge ${u.estado==='Activo'?'text-bg-success':'text-bg-secondary'}">${escapeHtml(u.estado)}</span></td><td class="text-end"><a class="btn btn-sm btn-outline-primary" href="usuario-form.html?id=${u.id}">Editar</a> <button class="btn btn-sm btn-outline-danger" onclick="eliminarUsuario(${u.id})">Eliminar</button></td></tr>`).join('');
}
function cargarUsuarioForm() {
  const f = document.getElementById('form-admin-usuario'); if (!f) return; const id = Number(new URLSearchParams(location.search).get('id')); if (!id) return; const u = getUsuarios().find(x => x.id===id); if (!u) return;
  for (const [key,val] of Object.entries({run:u.run,nombres:u.nombres,apellidos:u.apellidos,correo:u.correo,fechaNacimiento:u.fechaNacimiento,tipo:u.tipo,region:u.region,comuna:u.comuna,direccion:u.direccion,estado:u.estado})) { const el=f.elements[key]; if(el) el.value=val; }
  f.elements.id.value=id; document.getElementById('usuario-form-title').textContent='Editar usuario'; cargarComunas(f.elements.region.value, f.elements.comuna.value);
}
function guardarUsuario(e) { e.preventDefault(); const f=e.currentTarget; if(!f.checkValidity()){f.classList.add('was-validated');return;} const data=Object.fromEntries(new FormData(f).entries()); const usuarios=getUsuarios(); const id=Number(data.id||0); const record={id:id||Math.max(0,...usuarios.map(u=>u.id))+1, run:data.run.trim().toUpperCase(), nombres:data.nombres.trim(), apellidos:data.apellidos.trim(), correo:data.correo.trim().toLowerCase(), fechaNacimiento:data.fechaNacimiento||'', tipo:data.tipo, region:data.region, comuna:data.comuna, direccion:data.direccion.trim(), estado:data.estado||'Activo'}; if(id){const idx=usuarios.findIndex(u=>u.id===id);if(idx>=0)usuarios[idx]=record;}else usuarios.push(record); writeJSON(STORAGE.usuarios,usuarios); location.href='usuarios.html?saved=1'; }
function eliminarUsuario(id){writeJSON(STORAGE.usuarios,getUsuarios().filter(u=>u.id!==Number(id)));renderUsuariosAdmin();}
function cargarComunas(region, selected='') { document.querySelectorAll('select[data-region-source]').forEach(select=>{ const destId=select.dataset.regionSource; const dest=document.getElementById(destId); if(!dest)return; const communes=REGIONES[select.value]||[]; dest.innerHTML='<option value="">Seleccione una comuna</option>'+communes.map(c=>`<option ${c===selected?'selected':''}>${escapeHtml(c)}</option>`).join(''); }); }

function setSession(user){writeJSON(STORAGE.sesion,user);}
function getSession(){return readJSON(STORAGE.sesion,null);}
function requireAdmin(){ const session=getSession(); if(!session || (session.tipo!=='Administrador' && session.tipo!=='Vendedor')){ location.href='../login.html?acceso=denegado'; return null;} return session; }
function requireRole(roles){ const session=getSession(); const allowed=Array.isArray(roles)?roles:[roles]; if(!session || !allowed.includes(session.tipo)){ const target=session?.tipo==='Cliente'?'../index.html':'../login.html?acceso=denegado'; location.href=target; return null; } return session; }
function applyRoleUI(){ const session=getSession(); document.querySelectorAll('[data-role]').forEach(el=>{const roles=(el.dataset.role||'').split(',').map(x=>x.trim()); el.classList.toggle('d-none',!session || !roles.includes(session.tipo));}); }
function showToast(message,type='success'){let box=document.getElementById('toast-area');if(!box){box=document.createElement('div');box.id='toast-area';box.className='position-fixed top-0 end-0 p-3';box.style.zIndex='1080';document.body.appendChild(box);}const el=document.createElement('div');el.className=`alert alert-${type} shadow mb-2`;el.role='alert';el.textContent=message;box.appendChild(el);setTimeout(()=>el.remove(),3000);}

function init() {
  updateCartCount(); applyRoleUI();
  renderProductos('featured-list', 4); renderProductos('contenedor-productos'); renderDetalle(); renderCarrito(); renderAdminProductos(); renderUsuariosAdmin(); cargarProductoForm(); cargarUsuarioForm();
  const productoForm=document.getElementById('form-admin-producto'); if(productoForm) productoForm.addEventListener('submit',guardarProductoDesdeFormulario);
  const usuarioForm=document.getElementById('form-admin-usuario'); if(usuarioForm) usuarioForm.addEventListener('submit',guardarUsuario);
  document.querySelectorAll('select[data-region-source]').forEach(el=>el.addEventListener('change',()=>cargarComunas(el.value)));
  const session = getSession(); const sessionName=document.getElementById('session-name'); if(sessionName) sessionName.textContent=session?`${session.nombres} · ${session.tipo}`:'Sin sesión';
  const logout=document.getElementById('logout-btn'); if(logout) logout.addEventListener('click',()=>{localStorage.removeItem(STORAGE.sesion); location.href='../index.html';});
  const checkout=document.getElementById('finalizar-compra'); if(checkout) checkout.addEventListener('click',()=>{if(!getCarrito().length)return;const orders=readJSON(STORAGE.ordenes,[]);orders.push({id:Date.now(),fecha:new Date().toLocaleString('es-CL'),total:getCarrito().reduce((s,i)=>s+i.precio*i.cantidad,0),estado:'Pendiente',items:getCarrito()});writeJSON(STORAGE.ordenes,orders);vaciarCarrito();showToast('Compra simulada creada correctamente.','success');});
  const search=document.getElementById('search-productos'); if(search) search.addEventListener('input',()=>{const q=search.value.toLowerCase();const target=document.getElementById('contenedor-productos');if(!target)return;target.innerHTML=getProductos().filter(p=>`${p.nombre} ${p.categoria} ${p.descripcion}`.toLowerCase().includes(q)).map(productCard).join('');});
  const roleLabel=document.getElementById('role-label');if(roleLabel&&session)roleLabel.textContent=session.tipo;
}
window.addEventListener('storage', e=>{ if(Object.values(STORAGE).includes(e.key)){updateCartCount();renderCarrito();renderProductos('featured-list',4);renderProductos('contenedor-productos');renderDetalle();renderAdminProductos();renderUsuariosAdmin();} });
document.addEventListener('DOMContentLoaded', init);
