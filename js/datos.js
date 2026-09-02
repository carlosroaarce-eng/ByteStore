const PRODUCTOS_BASE = [
  { id: 1, codigo: 'KB001', nombre: 'Teclado Mecánico RGB', descripcion: 'Teclado mecánico con retroiluminación RGB y switches táctiles.', precio: 45000, stock: 15, stockCritico: 3, categoria: 'Periféricos', imagen: 'https://images.pexels.com/photos/36203652/pexels-photo-36203652.jpeg?auto=compress&cs=tinysrgb&w=900' },
  { id: 2, codigo: 'MS002', nombre: 'Mouse Gamer 16000 DPI', descripcion: 'Mouse ergonómico de alto rendimiento para gaming y productividad.', precio: 25000, stock: 12, stockCritico: 2, categoria: 'Periféricos', imagen: 'https://images.pexels.com/photos/4665064/pexels-photo-4665064.jpeg?auto=compress&cs=tinysrgb&w=900' },
  { id: 3, codigo: 'MN003', nombre: 'Monitor Gamer 144 Hz', descripcion: 'Monitor de alta frecuencia para una experiencia fluida y precisa.', precio: 180000, stock: 5, stockCritico: 1, categoria: 'Monitores', imagen: 'https://images.pexels.com/photos/13988977/pexels-photo-13988977.jpeg?auto=compress&cs=tinysrgb&w=900' },
  { id: 4, codigo: 'NB004', nombre: 'Notebook Pro 15', descripcion: 'Notebook para estudio, desarrollo y trabajo diario.', precio: 699000, stock: 7, stockCritico: 2, categoria: 'Computadores', imagen: 'https://images.pexels.com/photos/3987013/pexels-photo-3987013.jpeg?auto=compress&cs=tinysrgb&w=900' },
  { id: 5, codigo: 'HS005', nombre: 'Headset Gaming', descripcion: 'Audífonos con micrófono y diseño cómodo para largas sesiones.', precio: 39000, stock: 10, stockCritico: 2, categoria: 'Audio', imagen: 'https://images.pexels.com/photos/164829/pexels-photo-164829.jpeg?auto=compress&cs=tinysrgb&w=900' },
  { id: 6, codigo: 'PC006', nombre: 'Setup RGB Gamer', descripcion: 'Accesorios para complementar un escritorio gamer moderno.', precio: 99000, stock: 4, stockCritico: 1, categoria: 'Accesorios', imagen: 'https://images.pexels.com/photos/3971609/pexels-photo-3971609.jpeg?auto=compress&cs=tinysrgb&w=900' }
];

const REGIONES = {
  arica: ['Arica', 'Camarones', 'Putre'],
  tarapaca: ['Iquique', 'Alto Hospicio', 'Pozo Almonte'],
  antofagasta: ['Antofagasta', 'Calama', 'Taltal'],
  atacama: ['Copiapó', 'Caldera', 'Vallenar'],
  coquimbo: ['La Serena', 'Coquimbo', 'Ovalle'],
  valparaiso: ['Valparaíso', 'Viña del Mar', 'Quilpué'],
  ohiggins: ['Rancagua', 'San Fernando', 'Pichilemu'],
  maule: ['Talca', 'Curicó', 'Linares'],
  nuble: ['Chillán', 'San Carlos', 'Bulnes'],
  biobio: ['Concepción', 'Los Ángeles', 'Talcahuano'],
  araucania: ['Temuco', 'Villarrica', 'Angol'],
  rios: ['Valdivia', 'La Unión', 'Panguipulli'],
  lagos: ['Puerto Montt', 'Osorno', 'Castro'],
  aysen: ['Coyhaique', 'Aysén', 'Chile Chico'],
  magallanes: ['Punta Arenas', 'Puerto Natales', 'Porvenir'],
  metropolitana: ['Maipú', 'Santiago', 'Puente Alto', 'Las Condes', 'Providencia']
};
