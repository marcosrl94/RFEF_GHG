# Calculadora de Huella de Carbono — RFEF

Herramienta web para calcular la huella de carbono **Scope 3** de eventos y competiciones deportivas, basada en la metodología de la **UEFA Carbon Accounting Methodology** (diciembre 2024) y el **GHG Protocol Corporate Standard**.

## Áreas que cubre

Siguiendo las cuatro áreas del marco UEFA:

1. **Movilidad** — Desplazamientos de aficionados, equipos, árbitros, staff RFEF y prensa
2. **Instalaciones** — Emisiones upstream del consumo energético del estadio (Scope 3 cat. 3)
3. **Bienes y servicios adquiridos** — Catering, merchandising, materiales, servicios técnicos
4. **Logística** — Transporte de mercancías y gestión de residuos

## Stack técnico

- [Next.js 14](https://nextjs.org/) (App Router)
- [React 18](https://react.dev/)
- [Recharts](https://recharts.org/) para visualización de datos
- [Lucide React](https://lucide.dev/) para iconografía
- Despliegue en [Vercel](https://vercel.com/)

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Arrancar servidor de desarrollo
npm run dev
```

La app estará disponible en [http://localhost:3000](http://localhost:3000).

## Build de producción

```bash
npm run build
npm start
```

## Despliegue

El proyecto está conectado a Vercel. Cada push a `main` despliega automáticamente a producción. Los pushes a otras ramas generan previews.

## Factores de emisión

Los factores por defecto provienen de:

- **DEFRA 2024** — UK Government GHG Conversion Factors for Company Reporting
- **MITECO** — Ministerio para la Transición Ecológica (España)
- **IDAE** — Instituto para la Diversificación y Ahorro de la Energía
- **REE** — Mix eléctrico nacional

Todos los factores son editables desde la pestaña "Factores" de la UI sin necesidad de tocar código.

## Estructura

```
huella-rfef/
├── app/
│   ├── layout.js          # Layout raíz (fuentes, metadata)
│   ├── page.js            # Página principal
│   └── globals.css        # Estilos globales
├── components/
│   └── Calculadora.jsx    # Componente principal de la calculadora
├── lib/                   # (futura lógica reutilizable)
├── public/                # Assets estáticos
└── package.json
```

## Roadmap

- [ ] Persistencia: guardar histórico de eventos calculados
- [ ] Comparativa entre escenarios (antes/después de medidas de mitigación)
- [ ] Módulo de retransmisión (huella digital broadcast)
- [ ] Exportación a PDF con informe ejecutivo
- [ ] Multi-idioma (ES / EN / CA)
- [ ] Integración con UEFA Carbon Footprint Calculator API (cuando esté disponible)

## Limitaciones actuales

- Los factores upstream de instalaciones aplican coeficientes aproximados (17 % electricidad, 15 % gas, 18 % diésel). Para reporte oficial conviene usar factores DEFRA "WTT" (Well-to-Tank) específicos.
- No incluye huella digital de retransmisión (categoría emergente, no estandarizada).
- Para auditoría externa verificable, se recomienda complementar con la **UEFA Carbon Footprint Calculator** oficial: `carboncalculator@uefa.ch`.

## Licencia

Propiedad de la Real Federación Española de Fútbol. Uso interno.
