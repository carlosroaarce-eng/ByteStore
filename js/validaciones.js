
const DOMINIOS_PERMITIDOS = ['@duoc.cl', '@profesor.duoc.cl', '@gmail.com'];
const emailValido = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && DOMINIOS_PERMITIDOS.some(d => email.toLowerCase().endsWith(d));
const runValido = run => {
  const limpio = String(run).replace(/[^0-9kK]/g,'').toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(limpio)) return false;
  let suma=0, mult=2;
  for (let i=limpio.length-2;i>=0;i--){suma+=Number(limpio[i])*mult;mult=mult===7?2:mult+1;}
  const dv=11-(suma%11); const esperado=dv===11?'0':dv===10?'K':String(dv); return limpio.at(-1)===esperado;
};
function bindLiveValidation(form, rules){
  for(const rule of rules){const input=form.elements[rule.name]; const error=document.getElementById(rule.errorId); if(!input||!error)continue; const validate=()=>{const message=rule.validate(input.value); input.classList.toggle('is-invalid',Boolean(message)); input.classList.toggle('is-valid',!message && input.value!==''); error.textContent=message||''; return !message;}; input.addEventListener('input',validate); input.addEventListener('blur',validate);}
}
function initForms(){
  const contact=document.getElementById('form-contacto');
  if(contact){ const rules=[
    {name:'nombre',errorId:'error-nombre',validate:v=>!v.trim()?'El nombre es obligatorio.':v.trim().length>100?'Máximo 100 caracteres.':''},
    {name:'correo',errorId:'error-correo',validate:v=>!v.trim()?'El correo es obligatorio.':v.length>100?'Máximo 100 caracteres.':!emailValido(v.trim())?'Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.':''},
    {name:'comentario',errorId:'error-comentario',validate:v=>!v.trim()?'El comentario es obligatorio.':v.length>500?'Máximo 500 caracteres.':''}
  ]; bindLiveValidation(contact,rules); contact.addEventListener('submit',e=>{e.preventDefault();const ok=rules.every(r=>!r.validate(contact.elements[r.name].value));if(ok){document.getElementById('mensaje-exito').textContent='Mensaje enviado correctamente.';document.getElementById('mensaje-exito').classList.remove('d-none');contact.reset();contact.querySelectorAll('.is-valid').forEach(x=>x.classList.remove('is-valid'));}}); }
  const login=document.getElementById('form-login');
  if(login){const rules=[
    {name:'correo',errorId:'error-login-correo',validate:v=>!v.trim()?'El correo es obligatorio.':v.length>100?'Máximo 100 caracteres.':!emailValido(v.trim())?'Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.':''},
    {name:'password',errorId:'error-login-password',validate:v=>!v?'La contraseña es obligatoria.':v.length<4||v.length>10?'Debe tener entre 4 y 10 caracteres.':''}
  ]; bindLiveValidation(login,rules); login.addEventListener('submit',e=>{e.preventDefault();const ok=rules.every(r=>!r.validate(login.elements[r.name].value));if(!ok)return;const correo=login.elements.correo.value.trim().toLowerCase();const password=login.elements.password.value;const demos=[{correo:'admin@gmail.com',password:'1234',tipo:'Administrador',nombres:'Admin',apellidos:'ByteStore'},{correo:'vendedor@gmail.com',password:'1234',tipo:'Vendedor',nombres:'Valentina',apellidos:'Vendedor'},{correo:'cliente@gmail.com',password:'1234',tipo:'Cliente',nombres:'Cliente',apellidos:'ByteStore'}];const user=demos.find(x=>x.correo===correo&&x.password===password);if(!user){document.getElementById('mensaje-login-error').textContent='Credenciales de demostración no válidas.';document.getElementById('mensaje-login-error').classList.remove('d-none');return;}setSession(user);document.getElementById('mensaje-login-exito').classList.remove('d-none');setTimeout(()=>location.href=user.tipo==='Cliente'?'index.html':'admin/index.html',500);});}
  const registro=document.getElementById('form-registro');
  if(registro){const rules=[
    {name:'run',errorId:'error-reg-run',validate:v=>!v.trim()?'El RUN es obligatorio.':!runValido(v)?'RUN inválido. Usa formato sin puntos ni guion.':''},
    {name:'nombres',errorId:'error-reg-nombres',validate:v=>!v.trim()?'El nombre es obligatorio.':v.length>50?'Máximo 50 caracteres.':''},
    {name:'apellidos',errorId:'error-reg-apellidos',validate:v=>!v.trim()?'Los apellidos son obligatorios.':v.length>100?'Máximo 100 caracteres.':''},
    {name:'correo',errorId:'error-reg-correo',validate:v=>!v.trim()?'El correo es obligatorio.':v.length>100?'Máximo 100 caracteres.':!emailValido(v.trim())?'Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.':''},
    {name:'direccion',errorId:'error-reg-direccion',validate:v=>!v.trim()?'La dirección es obligatoria.':v.length>300?'Máximo 300 caracteres.':''}
  ];bindLiveValidation(registro,rules);registro.addEventListener('submit',e=>{e.preventDefault();const ok=rules.every(r=>!r.validate(registro.elements[r.name].value));if(!registro.elements.region.value){document.getElementById('error-reg-region').textContent='Selecciona una región.';return;}if(!registro.elements.comuna.value){document.getElementById('error-reg-comuna').textContent='Selecciona una comuna.';return;}if(!ok)return;const usuarios=getUsuarios();usuarios.push({id:Math.max(0,...usuarios.map(u=>u.id))+1,run:registro.elements.run.value.trim().toUpperCase(),nombres:registro.elements.nombres.value.trim(),apellidos:registro.elements.apellidos.value.trim(),correo:registro.elements.correo.value.trim().toLowerCase(),fechaNacimiento:registro.elements.fechaNacimiento.value,tipo:'Cliente',region:registro.elements.region.value,comuna:registro.elements.comuna.value,direccion:registro.elements.direccion.value.trim(),estado:'Activo'});writeJSON(STORAGE.usuarios,usuarios);document.getElementById('mensaje-reg-exito').classList.remove('d-none');registro.reset();});}
  const adminProduct=document.getElementById('form-admin-producto');
  if(adminProduct){bindLiveValidation(adminProduct,[
    {name:'codigo',errorId:'error-prod-codigo',validate:v=>!v.trim()?'El código es obligatorio.':v.trim().length<3?'Mínimo 3 caracteres.':''},
    {name:'nombre',errorId:'error-prod-nombre',validate:v=>!v.trim()?'El nombre es obligatorio.':v.length>100?'Máximo 100 caracteres.':''},
    {name:'descripcion',errorId:'error-prod-descripcion',validate:v=>v.length>500?'Máximo 500 caracteres.':''},
    {name:'precio',errorId:'error-prod-precio',validate:v=>v===''?'El precio es obligatorio.':Number(v)<0?'El precio no puede ser negativo.':''},
    {name:'stock',errorId:'error-prod-stock',validate:v=>v===''?'El stock es obligatorio.':!Number.isInteger(Number(v))||Number(v)<0?'Debe ser un entero ≥ 0.':''},
    {name:'stockCritico',errorId:'error-prod-stock-critico',validate:v=>v!==''&&(!Number.isInteger(Number(v))||Number(v)<0)?'Debe ser un entero ≥ 0.':''}
  ]);}
  const adminUser=document.getElementById('form-admin-usuario');
  if(adminUser){bindLiveValidation(adminUser,[
    {name:'run',errorId:'error-user-run',validate:v=>!runValido(v)?'RUN inválido.':''},
    {name:'nombres',errorId:'error-user-nombres',validate:v=>!v.trim()?'El nombre es obligatorio.':v.length>50?'Máximo 50 caracteres.':''},
    {name:'apellidos',errorId:'error-user-apellidos',validate:v=>!v.trim()?'Los apellidos son obligatorios.':v.length>100?'Máximo 100 caracteres.':''},
    {name:'correo',errorId:'error-user-correo',validate:v=>!v.trim()?'El correo es obligatorio.':v.length>100?'Máximo 100 caracteres.':!emailValido(v.trim())?'Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.':''},
    {name:'direccion',errorId:'error-user-direccion',validate:v=>!v.trim()?'La dirección es obligatoria.':v.length>300?'Máximo 300 caracteres.':''}
  ]);}
}
document.addEventListener('DOMContentLoaded', initForms);
