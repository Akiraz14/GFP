// Catálogos propuestos para E03-D4 y E03-D5; su contenido requiere la aprobación del
// responsable antes de la primera entrega de la Etapa 03.

export type DocumentTypeSeed = { code: string; name: string };

export type SecurityQuestionSeed = {
  id: string;
  prompt: string;
  similarityGroup: string;
  options: ReadonlyArray<{ id: string; label: string }>;
};

export const PROPOSED_DOCUMENT_TYPES: readonly DocumentTypeSeed[] = [
  { code: 'CC', name: 'Cédula de ciudadanía' },
  { code: 'CE', name: 'Cédula de extranjería' },
  { code: 'PA', name: 'Pasaporte' },
  { code: 'PPT', name: 'Permiso por protección temporal' },
  { code: 'NIT', name: 'NIT' },
];

export const PROPOSED_SECURITY_QUESTIONS: readonly SecurityQuestionSeed[] = [
  {
    id: 'favorite-color',
    prompt: '¿Cuál es tu color favorito?',
    similarityGroup: 'color',
    options: [
      { id: 'red', label: 'Rojo' },
      { id: 'blue', label: 'Azul' },
      { id: 'green', label: 'Verde' },
      { id: 'yellow', label: 'Amarillo' },
      { id: 'orange', label: 'Naranja' },
      { id: 'purple', label: 'Morado' },
      { id: 'pink', label: 'Rosado' },
      { id: 'black', label: 'Negro' },
      { id: 'white', label: 'Blanco' },
      { id: 'gray', label: 'Gris' },
      { id: 'brown', label: 'Café' },
    ],
  },
  {
    id: 'first-pet',
    prompt: '¿Qué tipo de animal fue tu primera mascota?',
    similarityGroup: 'pets',
    options: [
      { id: 'dog', label: 'Perro' },
      { id: 'cat', label: 'Gato' },
      { id: 'fish', label: 'Pez' },
      { id: 'bird', label: 'Ave' },
      { id: 'rabbit', label: 'Conejo' },
      { id: 'hamster', label: 'Hámster' },
      { id: 'turtle', label: 'Tortuga' },
      { id: 'horse', label: 'Caballo' },
      { id: 'other-animal', label: 'Otro animal' },
      { id: 'no-pet', label: 'Nunca tuve mascota' },
    ],
  },
  {
    id: 'favorite-sport',
    prompt: '¿Cuál es tu deporte favorito?',
    similarityGroup: 'sports',
    options: [
      { id: 'football', label: 'Fútbol' },
      { id: 'basketball', label: 'Baloncesto' },
      { id: 'volleyball', label: 'Voleibol' },
      { id: 'tennis', label: 'Tenis' },
      { id: 'swimming', label: 'Natación' },
      { id: 'cycling', label: 'Ciclismo' },
      { id: 'athletics', label: 'Atletismo' },
      { id: 'baseball', label: 'Béisbol' },
      { id: 'chess', label: 'Ajedrez' },
      { id: 'no-sport', label: 'Ninguno' },
    ],
  },
  {
    id: 'favorite-dish',
    prompt: '¿Cuál es tu plato favorito?',
    similarityGroup: 'food',
    options: [
      { id: 'bandeja-paisa', label: 'Bandeja paisa' },
      { id: 'ajiaco', label: 'Ajiaco' },
      { id: 'sancocho', label: 'Sancocho' },
      { id: 'arepa', label: 'Arepa' },
      { id: 'empanada', label: 'Empanada' },
      { id: 'tamal', label: 'Tamal' },
      { id: 'pizza', label: 'Pizza' },
      { id: 'hamburger', label: 'Hamburguesa' },
      { id: 'pasta', label: 'Pasta' },
      { id: 'sushi', label: 'Sushi' },
    ],
  },
  {
    id: 'favorite-fruit',
    prompt: '¿Cuál es tu fruta favorita?',
    similarityGroup: 'food',
    options: [
      { id: 'mango', label: 'Mango' },
      { id: 'banana', label: 'Banano' },
      { id: 'strawberry', label: 'Fresa' },
      { id: 'apple', label: 'Manzana' },
      { id: 'pineapple', label: 'Piña' },
      { id: 'passion-fruit', label: 'Maracuyá' },
      { id: 'lulo', label: 'Lulo' },
      { id: 'soursop', label: 'Guanábana' },
      { id: 'papaya', label: 'Papaya' },
      { id: 'grape', label: 'Uva' },
    ],
  },
  {
    id: 'favorite-drink',
    prompt: '¿Cuál es tu bebida favorita?',
    similarityGroup: 'food',
    options: [
      { id: 'coffee', label: 'Café' },
      { id: 'tea', label: 'Té' },
      { id: 'hot-chocolate', label: 'Chocolate' },
      { id: 'fruit-juice', label: 'Jugo natural' },
      { id: 'soda', label: 'Gaseosa' },
      { id: 'water', label: 'Agua' },
      { id: 'herbal-tea', label: 'Aromática' },
      { id: 'lemonade', label: 'Limonada' },
      { id: 'avena', label: 'Avena' },
      { id: 'kumis', label: 'Kumis' },
    ],
  },
  {
    id: 'favorite-music-genre',
    prompt: '¿Cuál es tu género musical favorito?',
    similarityGroup: 'music',
    options: [
      { id: 'salsa', label: 'Salsa' },
      { id: 'vallenato', label: 'Vallenato' },
      { id: 'reggaeton', label: 'Reguetón' },
      { id: 'rock', label: 'Rock' },
      { id: 'pop', label: 'Pop' },
      { id: 'merengue', label: 'Merengue' },
      { id: 'bachata', label: 'Bachata' },
      { id: 'classical', label: 'Clásica' },
      { id: 'electronic', label: 'Electrónica' },
      { id: 'jazz', label: 'Jazz' },
      { id: 'rap', label: 'Rap' },
    ],
  },
  {
    id: 'dream-destination',
    prompt: '¿Qué región del mundo te gustaría conocer primero?',
    similarityGroup: 'travel',
    options: [
      { id: 'europe', label: 'Europa' },
      { id: 'asia', label: 'Asia' },
      { id: 'africa', label: 'África' },
      { id: 'north-america', label: 'Norteamérica' },
      { id: 'south-america', label: 'Suramérica' },
      { id: 'central-america-caribbean', label: 'Centroamérica y el Caribe' },
      { id: 'oceania', label: 'Oceanía' },
      { id: 'antarctica', label: 'Antártida' },
    ],
  },
  {
    id: 'school-transport',
    prompt: '¿Cómo ibas normalmente a la escuela primaria?',
    similarityGroup: 'childhood',
    options: [
      { id: 'walking', label: 'Caminando' },
      { id: 'school-bus', label: 'Bus escolar' },
      { id: 'public-transport', label: 'Transporte público' },
      { id: 'family-car', label: 'Carro familiar' },
      { id: 'bicycle', label: 'Bicicleta' },
      { id: 'motorcycle', label: 'Moto' },
      { id: 'other-transport', label: 'Otro medio' },
    ],
  },
  {
    id: 'favorite-school-subject',
    prompt: '¿Cuál era tu materia favorita en el colegio?',
    similarityGroup: 'education',
    options: [
      { id: 'mathematics', label: 'Matemáticas' },
      { id: 'spanish-language', label: 'Lengua castellana' },
      { id: 'natural-sciences', label: 'Ciencias naturales' },
      { id: 'social-sciences', label: 'Ciencias sociales' },
      { id: 'english', label: 'Inglés' },
      { id: 'physical-education', label: 'Educación física' },
      { id: 'arts', label: 'Artes' },
      { id: 'music-class', label: 'Música' },
      { id: 'technology', label: 'Tecnología e informática' },
      { id: 'ethics', label: 'Ética y valores' },
    ],
  },
];
