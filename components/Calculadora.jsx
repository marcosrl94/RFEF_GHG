'use client';
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plane, Bus, Car, Train, Building2, Package, Truck, Users, Trophy, Download, Info, ChevronRight, Leaf, Zap, Hotel, Trash2 } from 'lucide-react';

// ============================================================
// FACTORES DE EMISIÓN (kg CO2e por unidad)
// Fuentes: DEFRA 2024, MITECO, IDAE, UEFA Carbon Accounting Methodology
// Editables por el usuario en el panel "Factores"
// ============================================================
const DEFAULT_FACTORS = {
  // Transporte de aficionados (kg CO2e por pasajero-km)
  car_petrol: 0.170,
  car_diesel: 0.168,
  car_electric: 0.047,
  bus_urban: 0.103,
  bus_coach: 0.027,
  train_high_speed: 0.0035,  // AVE España (mix REE)
  train_regional: 0.041,
  metro: 0.028,
  flight_short: 0.156,        // <1500 km
  flight_medium: 0.139,       // 1500-3700 km
  flight_long: 0.149,         // >3700 km
  motorbike: 0.114,
  walking_bike: 0,

  // Alojamiento (kg CO2e por noche)
  hotel_spain: 9.6,
  hotel_europe: 14.2,
  hotel_intl: 22.5,

  // Catering (kg CO2e por unidad)
  meal_omnivore: 3.8,
  meal_vegetarian: 1.6,
  meal_vegan: 1.0,
  beverage_alcoholic: 0.85,
  beverage_soft: 0.35,

  // Energía y combustibles (kg CO2e por kWh o L)
  electricity_spain: 0.19,    // Mix REE 2023
  diesel_generator: 2.68,     // por litro
  natural_gas: 0.202,         // por kWh

  // Residuos (kg CO2e por kg residuo)
  waste_landfill: 0.458,
  waste_recycling: 0.021,
  waste_composting: 0.011,
  waste_incineration: 0.218,

  // Bienes y servicios (kg CO2e por € gastado - método spend-based)
  merchandising: 0.45,
  printed_materials: 1.84,
  technical_services: 0.31,
  catering_services: 0.55,

  // Logística (kg CO2e por tonelada-km)
  freight_truck: 0.107,
  freight_van: 0.241,
  freight_air: 1.13,
};

const FACTOR_LABELS = {
  car_petrol: 'Coche gasolina (pas-km)',
  car_diesel: 'Coche diésel (pas-km)',
  car_electric: 'Coche eléctrico (pas-km)',
  bus_urban: 'Autobús urbano (pas-km)',
  bus_coach: 'Autocar largo recorrido (pas-km)',
  train_high_speed: 'AVE / Alta velocidad (pas-km)',
  train_regional: 'Tren regional (pas-km)',
  metro: 'Metro / Cercanías (pas-km)',
  flight_short: 'Vuelo corto <1500 km (pas-km)',
  flight_medium: 'Vuelo medio 1500-3700 km (pas-km)',
  flight_long: 'Vuelo largo >3700 km (pas-km)',
  motorbike: 'Moto (pas-km)',
  walking_bike: 'A pie / bici (pas-km)',
  hotel_spain: 'Hotel en España (noche)',
  hotel_europe: 'Hotel en Europa (noche)',
  hotel_intl: 'Hotel internacional (noche)',
  meal_omnivore: 'Comida omnívora',
  meal_vegetarian: 'Comida vegetariana',
  meal_vegan: 'Comida vegana',
  beverage_alcoholic: 'Bebida alcohólica',
  beverage_soft: 'Refresco / agua',
  electricity_spain: 'Electricidad España (kWh)',
  diesel_generator: 'Diésel generador (L)',
  natural_gas: 'Gas natural (kWh)',
  waste_landfill: 'Residuo a vertedero (kg)',
  waste_recycling: 'Residuo reciclado (kg)',
  waste_composting: 'Residuo compostado (kg)',
  waste_incineration: 'Residuo incinerado (kg)',
  merchandising: 'Merchandising (€)',
  printed_materials: 'Material impreso (€)',
  technical_services: 'Servicios técnicos (€)',
  catering_services: 'Servicios catering (€)',
  freight_truck: 'Camión (t-km)',
  freight_van: 'Furgoneta (t-km)',
  freight_air: 'Carga aérea (t-km)',
};

// Paleta para gráficos — austera, derivada del sistema RFEF
const CHART_COLORS = {
  mobility: '#E30613',
  accommodation: '#0A0A0A',
  facilities: '#FFD700',
  goods: '#8B1A1A',
  logistics: '#5A5A5A',
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function HuellaCarbonoRFEF() {
  const [activeTab, setActiveTab] = useState('evento');
  const [factors, setFactors] = useState(DEFAULT_FACTORS);

  // --- Datos del evento
  const [eventName, setEventName] = useState('Final Copa del Rey');
  const [eventDate, setEventDate] = useState('2026-04-25');
  const [attendees, setAttendees] = useState(60000);

  // --- MOVILIDAD: Aficionados (% del total de asistentes por modo y distancia media ida-vuelta km)
  const [fanMobility, setFanMobility] = useState({
    car_petrol: { pct: 35, km: 220 },
    car_diesel: { pct: 15, km: 220 },
    car_electric: { pct: 2, km: 220 },
    bus_coach: { pct: 8, km: 250 },
    train_high_speed: { pct: 18, km: 400 },
    train_regional: { pct: 5, km: 80 },
    metro: { pct: 6, km: 20 },
    flight_short: { pct: 6, km: 800 },
    flight_medium: { pct: 3, km: 2200 },
    flight_long: { pct: 1, km: 5000 },
    motorbike: { pct: 1, km: 50 },
    walking_bike: { pct: 0, km: 5 },
  });
  const [carOccupancy, setCarOccupancy] = useState(2.4);

  // --- MOVILIDAD: Equipos, árbitros, staff
  const [teamTravel, setTeamTravel] = useState({
    flights_short_pax: 80,
    flights_short_km: 600,
    flights_medium_pax: 0,
    flights_medium_km: 0,
    bus_pax: 50,
    bus_km: 400,
    car_pax: 30,
    car_km: 200,
  });

  // --- ALOJAMIENTO
  const [accommodation, setAccommodation] = useState({
    nights_spain: 450,
    nights_europe: 80,
    nights_intl: 20,
  });

  // --- INSTALACIONES (Scope 3 cat. 8 - activos arrendados upstream + cat. 3 upstream de energía)
  const [facilities, setFacilities] = useState({
    electricity_kwh: 85000,
    gas_kwh: 12000,
    diesel_l: 2500,
    water_m3: 800,
  });

  // --- BIENES Y SERVICIOS
  const [goods, setGoods] = useState({
    merchandising_eur: 45000,
    printed_eur: 8000,
    technical_eur: 120000,
    catering_eur: 95000,
    meals_omni: 5000,
    meals_veg: 800,
    meals_vegan: 200,
    bev_alc: 12000,
    bev_soft: 25000,
  });

  // --- LOGÍSTICA Y RESIDUOS
  const [logistics, setLogistics] = useState({
    truck_tkm: 1800,
    van_tkm: 600,
    air_tkm: 50,
    waste_landfill_kg: 4500,
    waste_recycle_kg: 3200,
    waste_compost_kg: 1100,
  });

  // ============================================================
  // CÁLCULOS
  // ============================================================
  const calculations = useMemo(() => {
    // 1. MOVILIDAD AFICIONADOS
    let fanEmissions = 0;
    const fanBreakdown = {};
    Object.entries(fanMobility).forEach(([mode, data]) => {
      const pax = (attendees * data.pct) / 100;
      const occupancy = mode.startsWith('car_') ? carOccupancy : 1;
      const vehicleKm = pax / occupancy;
      const paxKm = pax * data.km;
      const emissions = paxKm * factors[mode];
      fanEmissions += emissions;
      fanBreakdown[mode] = emissions;
    });

    // 2. MOVILIDAD EQUIPOS / STAFF
    const teamEmissions =
      teamTravel.flights_short_pax * teamTravel.flights_short_km * factors.flight_short +
      teamTravel.flights_medium_pax * teamTravel.flights_medium_km * factors.flight_medium +
      teamTravel.bus_pax * teamTravel.bus_km * factors.bus_coach +
      teamTravel.car_pax * teamTravel.car_km * factors.car_petrol;

    const mobilityTotal = fanEmissions + teamEmissions;

    // 3. ALOJAMIENTO
    const accommodationTotal =
      accommodation.nights_spain * factors.hotel_spain +
      accommodation.nights_europe * factors.hotel_europe +
      accommodation.nights_intl * factors.hotel_intl;

    // 4. INSTALACIONES (sólo upstream de energía - Scope 3 cat. 3, ~17% del consumo eléctrico)
    const facilitiesTotal =
      facilities.electricity_kwh * factors.electricity_spain * 0.17 +  // upstream T&D
      facilities.gas_kwh * factors.natural_gas * 0.15 +
      facilities.diesel_l * factors.diesel_generator * 0.18;

    // 5. BIENES Y SERVICIOS
    const cateringMeals =
      goods.meals_omni * factors.meal_omnivore +
      goods.meals_veg * factors.meal_vegetarian +
      goods.meals_vegan * factors.meal_vegan +
      goods.bev_alc * factors.beverage_alcoholic +
      goods.bev_soft * factors.beverage_soft;

    const goodsTotal =
      goods.merchandising_eur * factors.merchandising +
      goods.printed_eur * factors.printed_materials +
      goods.technical_eur * factors.technical_services +
      goods.catering_eur * factors.catering_services +
      cateringMeals;

    // 6. LOGÍSTICA
    const logisticsTransport =
      logistics.truck_tkm * factors.freight_truck +
      logistics.van_tkm * factors.freight_van +
      logistics.air_tkm * factors.freight_air;

    const wasteTotal =
      logistics.waste_landfill_kg * factors.waste_landfill +
      logistics.waste_recycle_kg * factors.waste_recycling +
      logistics.waste_compost_kg * factors.waste_composting;

    const logisticsTotal = logisticsTransport + wasteTotal;

    const grandTotal = mobilityTotal + accommodationTotal + facilitiesTotal + goodsTotal + logisticsTotal;
    const perAttendee = attendees > 0 ? grandTotal / attendees : 0;

    return {
      fanEmissions,
      fanBreakdown,
      teamEmissions,
      mobilityTotal,
      accommodationTotal,
      facilitiesTotal,
      goodsTotal,
      logisticsTotal,
      logisticsTransport,
      wasteTotal,
      grandTotal,
      perAttendee,
    };
  }, [attendees, fanMobility, carOccupancy, teamTravel, accommodation, facilities, goods, logistics, factors]);

  const formatT = (kg) => (kg / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 });
  const formatKg = (kg) => kg.toLocaleString('es-ES', { maximumFractionDigits: 0 });

  // Datos para gráficos
  const areaData = [
    { name: 'Movilidad', value: calculations.mobilityTotal / 1000, color: CHART_COLORS.mobility },
    { name: 'Alojamiento', value: calculations.accommodationTotal / 1000, color: CHART_COLORS.accommodation },
    { name: 'Instalaciones', value: calculations.facilitiesTotal / 1000, color: CHART_COLORS.facilities },
    { name: 'Bienes y servicios', value: calculations.goodsTotal / 1000, color: CHART_COLORS.goods },
    { name: 'Logística y residuos', value: calculations.logisticsTotal / 1000, color: CHART_COLORS.logistics },
  ];

  const fanChartData = Object.entries(calculations.fanBreakdown)
    .map(([mode, em]) => ({ name: FACTOR_LABELS[mode].split(' (')[0], value: em / 1000 }))
    .filter(d => d.value > 0.001)
    .sort((a, b) => b.value - a.value);

  // Exportar CSV
  const exportCSV = () => {
    const rows = [
      ['Evento', eventName],
      ['Fecha', eventDate],
      ['Asistentes', attendees],
      [],
      ['ÁREA', 'tCO2e', '% del total'],
      ['Movilidad', formatT(calculations.mobilityTotal), ((calculations.mobilityTotal / calculations.grandTotal) * 100).toFixed(1) + '%'],
      ['  - Aficionados', formatT(calculations.fanEmissions), ((calculations.fanEmissions / calculations.grandTotal) * 100).toFixed(1) + '%'],
      ['  - Equipos/staff', formatT(calculations.teamEmissions), ((calculations.teamEmissions / calculations.grandTotal) * 100).toFixed(1) + '%'],
      ['Alojamiento', formatT(calculations.accommodationTotal), ((calculations.accommodationTotal / calculations.grandTotal) * 100).toFixed(1) + '%'],
      ['Instalaciones (upstream)', formatT(calculations.facilitiesTotal), ((calculations.facilitiesTotal / calculations.grandTotal) * 100).toFixed(1) + '%'],
      ['Bienes y servicios', formatT(calculations.goodsTotal), ((calculations.goodsTotal / calculations.grandTotal) * 100).toFixed(1) + '%'],
      ['Logística y residuos', formatT(calculations.logisticsTotal), ((calculations.logisticsTotal / calculations.grandTotal) * 100).toFixed(1) + '%'],
      [],
      ['TOTAL tCO2e', formatT(calculations.grandTotal)],
      ['Por asistente kgCO2e', calculations.perAttendee.toFixed(1)],
    ];
    const csv = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `huella-${eventName.replace(/\s+/g, '-').toLowerCase()}.csv`;
    a.click();
  };

  // ============================================================
  // RENDER
  // ============================================================
  const tabs = [
    { id: 'evento', label: 'Evento', icon: Trophy },
    { id: 'movilidad', label: 'Movilidad', icon: Plane },
    { id: 'alojamiento', label: 'Alojamiento', icon: Hotel },
    { id: 'instalaciones', label: 'Instalaciones', icon: Zap },
    { id: 'bienes', label: 'Bienes y servicios', icon: Package },
    { id: 'logistica', label: 'Logística', icon: Truck },
    { id: 'factores', label: 'Factores', icon: Info },
    { id: 'resultados', label: 'Resultados', icon: Leaf },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
      <style>{`
        .input-field {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #E5E5E5;
          border-radius: 0;
          background: #FFFFFF;
          font-family: inherit;
          font-size: 14px;
          color: #0A0A0A;
          transition: border-color 0.15s;
        }
        .input-field:focus {
          outline: none;
          border-color: #E30613;
          box-shadow: 0 0 0 2px rgba(227, 6, 19, 0.15);
        }
        .input-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #5A5A5A;
          margin-bottom: 6px;
        }
        .panel {
          background: #FFFFFF;
          border: 1px solid #E5E5E5;
          padding: 32px;
        }
        .h-display {
          font-family: var(--font-display), var(--font-inter), system-ui, sans-serif;
          letter-spacing: -0.01em;
          text-transform: uppercase;
        }
        .eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .btn-primary {
          padding: 12px 22px;
          background: #E30613;
          color: #FFFFFF;
          border: none;
          border-radius: 0;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-family: inherit;
          transition: background 0.15s;
        }
        .btn-primary:hover { background: #B8050F; }
        .btn-secondary {
          padding: 11px 20px;
          background: #0A0A0A;
          color: #FFFFFF;
          border: none;
          border-radius: 0;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-family: inherit;
        }
        .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 768px) {
          .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* HEADER */}
      <header style={{ background: '#E30613', color: '#FFFFFF', padding: '28px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, maxWidth: 1400, margin: '0 auto', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div className="h-display" style={{ fontSize: 38, lineHeight: 1, padding: '14px 18px', background: '#FFFFFF', color: '#E30613' }}>
              RFEF
            </div>
            <div>
              <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 6 }}>
                Real Federación Española de Fútbol
              </div>
              <h1 className="h-display" style={{ fontSize: 32, margin: 0, lineHeight: 1.05 }}>
                Huella de Carbono
              </h1>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 6, letterSpacing: '0.04em' }}>
                Scope 3 · Metodología UEFA / GHG Protocol
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="eyebrow" style={{ color: '#FFD700' }}>Total estimado</div>
            <div className="h-display" style={{ fontSize: 44, lineHeight: 1, marginTop: 6 }}>
              {formatT(calculations.grandTotal)} <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)' }}>tCO₂e</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>
              {calculations.perAttendee.toFixed(1)} kgCO₂e / asistente
            </div>
          </div>
        </div>
      </header>

      {/* TABS */}
      <nav style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E5E5', padding: '0 40px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 0, maxWidth: 1400, margin: '0 auto' }}>
          {tabs.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '18px 22px',
                  background: 'none',
                  border: 'none',
                  borderBottom: active ? '3px solid #E30613' : '3px solid transparent',
                  color: active ? '#E30613' : '#5A5A5A',
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s, border-color 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* CONTENT */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 40px' }}>
        {/* TAB: EVENTO */}
        {activeTab === 'evento' && (
          <div className="panel">
            <h2 className="h-display" style={{ fontSize: 26, color: '#0A0A0A', marginTop: 0, marginBottom: 8 }}>
              Datos del evento
            </h2>
            <p style={{ color: '#5A5A5A', fontSize: 14, marginBottom: 24 }}>
              Información general del evento o competición que se va a evaluar.
            </p>
            <div className="grid-3">
              <div>
                <label className="input-label">Nombre del evento</label>
                <input className="input-field" value={eventName} onChange={e => setEventName(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Fecha</label>
                <input type="date" className="input-field" value={eventDate} onChange={e => setEventDate(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Asistentes (aforo real)</label>
                <input type="number" className="input-field" value={attendees} onChange={e => setAttendees(+e.target.value)} />
              </div>
            </div>

            <div style={{ marginTop: 32, padding: 24, background: '#F4F4F4', borderLeft: '4px solid #E30613' }}>
              <div className="eyebrow" style={{ color: '#E30613', marginBottom: 10 }}>
                Cómo funciona
              </div>
              <p style={{ fontSize: 14, color: '#0A0A0A', lineHeight: 1.6, margin: 0 }}>
                Esta herramienta sigue las cuatro áreas de la metodología UEFA: <strong>movilidad</strong>, <strong>instalaciones</strong>,{' '}
                <strong>bienes y servicios adquiridos</strong> y <strong>logística</strong>. Rellena cada pestaña con los datos disponibles —
                las celdas vienen precargadas con valores tipo de una final de Copa para que puedas iterar rápido. Los factores de emisión
                por defecto provienen de DEFRA 2024 y MITECO; puedes ajustarlos en la pestaña &laquo;Factores&raquo;.
              </p>
            </div>

            <div className="grid-4" style={{ marginTop: 24 }}>
              {[
                { label: 'Movilidad', value: calculations.mobilityTotal, icon: Plane },
                { label: 'Bienes y servicios', value: calculations.goodsTotal, icon: Package },
                { label: 'Logística', value: calculations.logisticsTotal, icon: Truck },
                { label: 'Resto', value: calculations.accommodationTotal + calculations.facilitiesTotal, icon: Building2 },
              ].map((c, idx) => {
                const Icon = c.icon;
                const pct = calculations.grandTotal > 0 ? (c.value / calculations.grandTotal) * 100 : 0;
                const isStar = idx === 0;
                return (
                  <div
                    key={c.label}
                    style={{
                      padding: 22,
                      background: isStar ? '#E30613' : '#FFFFFF',
                      color: isStar ? '#FFFFFF' : '#0A0A0A',
                      border: isStar ? 'none' : '1px solid #E5E5E5',
                    }}
                  >
                    <Icon size={20} style={{ color: isStar ? '#FFFFFF' : '#E30613' }} />
                    <div className="eyebrow" style={{ color: isStar ? 'rgba(255,255,255,0.85)' : '#5A5A5A', marginTop: 12 }}>
                      {c.label}
                    </div>
                    <div className="h-display" style={{ fontSize: 28, marginTop: 6, lineHeight: 1 }}>
                      {formatT(c.value)} <span style={{ fontSize: 12, color: isStar ? 'rgba(255,255,255,0.85)' : '#5A5A5A' }}>tCO₂e</span>
                    </div>
                    <div style={{ fontSize: 12, color: isStar ? 'rgba(255,255,255,0.85)' : '#5A5A5A', marginTop: 6 }}>{pct.toFixed(1)}% del total</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: MOVILIDAD */}
        {activeTab === 'movilidad' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="panel">
              <h2 className="h-display" style={{ fontSize: 26, color: '#0A0A0A', marginTop: 0, marginBottom: 8 }}>
                Movilidad de aficionados
              </h2>
              <p style={{ color: '#5A5A5A', fontSize: 14, marginBottom: 24 }}>
                Reparto modal y distancia ida-vuelta media. Habitualmente se obtiene mediante encuestas a asistentes.
                La suma de porcentajes debería aproximarse al 100%.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label className="input-label">Ocupación media del coche (pasajeros/vehículo)</label>
                <input type="number" step="0.1" className="input-field" style={{ maxWidth: 200 }}
                  value={carOccupancy} onChange={e => setCarOccupancy(+e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, alignItems: 'center', padding: '12px 12px', background: '#0A0A0A', color: '#FFFFFF', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                <div>Modo de transporte</div>
                <div>% asistentes</div>
                <div>km ida-vuelta</div>
                <div style={{ textAlign: 'right' }}>tCO₂e</div>
              </div>
              {Object.entries(fanMobility).map(([mode, data], i) => {
                const pax = (attendees * data.pct) / 100;
                const emissions = pax * data.km * factors[mode] / 1000;
                return (
                  <div key={mode} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #E5E5E5', background: i % 2 === 0 ? '#FFFFFF' : '#F9F9F9' }}>
                    <div style={{ fontSize: 13, color: '#0A0A0A' }}>{FACTOR_LABELS[mode].replace(' (pas-km)', '')}</div>
                    <input type="number" className="input-field" style={{ padding: '6px 10px' }}
                      value={data.pct} onChange={e => setFanMobility({ ...fanMobility, [mode]: { ...data, pct: +e.target.value } })} />
                    <input type="number" className="input-field" style={{ padding: '6px 10px' }}
                      value={data.km} onChange={e => setFanMobility({ ...fanMobility, [mode]: { ...data, km: +e.target.value } })} />
                    <div className="h-display" style={{ textAlign: 'right', color: '#E30613', fontSize: 16 }}>
                      {emissions.toFixed(1)}
                    </div>
                  </div>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 16px', marginTop: 8, background: '#F4F4F4' }}>
                <div className="eyebrow" style={{ color: '#0A0A0A' }}>
                  Suma %: {Object.values(fanMobility).reduce((s, d) => s + d.pct, 0)}%
                </div>
                <div>
                  <span className="eyebrow" style={{ color: '#5A5A5A', marginRight: 10 }}>Subtotal</span>
                  <span className="h-display" style={{ fontSize: 22, color: '#E30613' }}>
                    {formatT(calculations.fanEmissions)} tCO₂e
                  </span>
                </div>
              </div>
            </div>

            <div className="panel">
              <h2 className="h-display" style={{ fontSize: 26, color: '#0A0A0A', marginTop: 0, marginBottom: 8 }}>
                Movilidad de equipos, árbitros y staff
              </h2>
              <p style={{ color: '#5A5A5A', fontSize: 14, marginBottom: 24 }}>
                Desplazamientos de jugadores, cuerpo técnico, árbitros, delegados RFEF y prensa acreditada.
              </p>
              <div className="grid-2">
                <div>
                  <label className="input-label">Vuelos cortos · pasajeros</label>
                  <input type="number" className="input-field" value={teamTravel.flights_short_pax}
                    onChange={e => setTeamTravel({ ...teamTravel, flights_short_pax: +e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Vuelos cortos · km totales (ida-vuelta)</label>
                  <input type="number" className="input-field" value={teamTravel.flights_short_km}
                    onChange={e => setTeamTravel({ ...teamTravel, flights_short_km: +e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Vuelos medios · pasajeros</label>
                  <input type="number" className="input-field" value={teamTravel.flights_medium_pax}
                    onChange={e => setTeamTravel({ ...teamTravel, flights_medium_pax: +e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Vuelos medios · km totales</label>
                  <input type="number" className="input-field" value={teamTravel.flights_medium_km}
                    onChange={e => setTeamTravel({ ...teamTravel, flights_medium_km: +e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Autocar · pasajeros</label>
                  <input type="number" className="input-field" value={teamTravel.bus_pax}
                    onChange={e => setTeamTravel({ ...teamTravel, bus_pax: +e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Autocar · km totales</label>
                  <input type="number" className="input-field" value={teamTravel.bus_km}
                    onChange={e => setTeamTravel({ ...teamTravel, bus_km: +e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Coches/VTC · pasajeros</label>
                  <input type="number" className="input-field" value={teamTravel.car_pax}
                    onChange={e => setTeamTravel({ ...teamTravel, car_pax: +e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Coches/VTC · km totales</label>
                  <input type="number" className="input-field" value={teamTravel.car_km}
                    onChange={e => setTeamTravel({ ...teamTravel, car_km: +e.target.value })} />
                </div>
              </div>
              <div style={{ marginTop: 16, padding: '16px 18px', background: '#F4F4F4', textAlign: 'right' }}>
                <span className="eyebrow" style={{ color: '#5A5A5A', marginRight: 10 }}>Subtotal</span>
                <span className="h-display" style={{ fontSize: 22, color: '#E30613' }}>
                  {formatT(calculations.teamEmissions)} tCO₂e
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ALOJAMIENTO */}
        {activeTab === 'alojamiento' && (
          <div className="panel">
            <h2 className="h-display" style={{ fontSize: 26, color: '#0A0A0A', marginTop: 0, marginBottom: 8 }}>
              Alojamiento
            </h2>
            <p style={{ color: '#5A5A5A', fontSize: 14, marginBottom: 24 }}>
              Pernoctaciones de equipos, árbitros, staff RFEF, prensa, VIPs y aficionados desplazados (si se contabilizan).
            </p>
            <div className="grid-3">
              <div>
                <label className="input-label">Noches en hotel · España</label>
                <input type="number" className="input-field" value={accommodation.nights_spain}
                  onChange={e => setAccommodation({ ...accommodation, nights_spain: +e.target.value })} />
                <div style={{ fontSize: 11, color: '#5A5A5A', marginTop: 4 }}>{factors.hotel_spain} kgCO₂e/noche</div>
              </div>
              <div>
                <label className="input-label">Noches en hotel · Europa</label>
                <input type="number" className="input-field" value={accommodation.nights_europe}
                  onChange={e => setAccommodation({ ...accommodation, nights_europe: +e.target.value })} />
                <div style={{ fontSize: 11, color: '#5A5A5A', marginTop: 4 }}>{factors.hotel_europe} kgCO₂e/noche</div>
              </div>
              <div>
                <label className="input-label">Noches en hotel · Internacional</label>
                <input type="number" className="input-field" value={accommodation.nights_intl}
                  onChange={e => setAccommodation({ ...accommodation, nights_intl: +e.target.value })} />
                <div style={{ fontSize: 11, color: '#5A5A5A', marginTop: 4 }}>{factors.hotel_intl} kgCO₂e/noche</div>
              </div>
            </div>
            <div style={{ marginTop: 24, padding: '16px 18px', background: '#F4F4F4', textAlign: 'right' }}>
              <span className="eyebrow" style={{ color: '#5A5A5A', marginRight: 10 }}>Subtotal alojamiento</span>
              <span className="h-display" style={{ fontSize: 24, color: '#E30613' }}>
                {formatT(calculations.accommodationTotal)} tCO₂e
              </span>
            </div>
          </div>
        )}

        {/* TAB: INSTALACIONES */}
        {activeTab === 'instalaciones' && (
          <div className="panel">
            <h2 className="h-display" style={{ fontSize: 26, color: '#0A0A0A', marginTop: 0, marginBottom: 8 }}>
              Instalaciones — emisiones upstream
            </h2>
            <p style={{ color: '#5A5A5A', fontSize: 14, marginBottom: 24 }}>
              Aquí se contabilizan únicamente las emisiones <strong>indirectas upstream</strong> de la energía consumida en el estadio
              (Scope 3 categoría 3: extracción, refino y T&D). Las emisiones directas del consumo eléctrico van en Scope 2.
            </p>
            <div className="grid-4">
              <div>
                <label className="input-label">Electricidad consumida (kWh)</label>
                <input type="number" className="input-field" value={facilities.electricity_kwh}
                  onChange={e => setFacilities({ ...facilities, electricity_kwh: +e.target.value })} />
              </div>
              <div>
                <label className="input-label">Gas natural (kWh)</label>
                <input type="number" className="input-field" value={facilities.gas_kwh}
                  onChange={e => setFacilities({ ...facilities, gas_kwh: +e.target.value })} />
              </div>
              <div>
                <label className="input-label">Diésel generadores (L)</label>
                <input type="number" className="input-field" value={facilities.diesel_l}
                  onChange={e => setFacilities({ ...facilities, diesel_l: +e.target.value })} />
              </div>
              <div>
                <label className="input-label">Agua (m³)</label>
                <input type="number" className="input-field" value={facilities.water_m3}
                  onChange={e => setFacilities({ ...facilities, water_m3: +e.target.value })} />
              </div>
            </div>
            <div style={{ marginTop: 24, padding: '16px 18px', background: '#F4F4F4', textAlign: 'right' }}>
              <span className="eyebrow" style={{ color: '#5A5A5A', marginRight: 10 }}>Subtotal instalaciones (upstream)</span>
              <span className="h-display" style={{ fontSize: 24, color: '#E30613' }}>
                {formatT(calculations.facilitiesTotal)} tCO₂e
              </span>
            </div>
          </div>
        )}

        {/* TAB: BIENES Y SERVICIOS */}
        {activeTab === 'bienes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="panel">
              <h2 className="h-display" style={{ fontSize: 26, color: '#0A0A0A', marginTop: 0, marginBottom: 8 }}>
                Bienes y servicios — método económico
              </h2>
              <p style={{ color: '#5A5A5A', fontSize: 14, marginBottom: 24 }}>
                Cálculo basado en el gasto en € (método spend-based). Útil cuando no se dispone de datos físicos detallados.
              </p>
              <div className="grid-4">
                <div>
                  <label className="input-label">Merchandising (€)</label>
                  <input type="number" className="input-field" value={goods.merchandising_eur}
                    onChange={e => setGoods({ ...goods, merchandising_eur: +e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Material impreso (€)</label>
                  <input type="number" className="input-field" value={goods.printed_eur}
                    onChange={e => setGoods({ ...goods, printed_eur: +e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Servicios técnicos (€)</label>
                  <input type="number" className="input-field" value={goods.technical_eur}
                    onChange={e => setGoods({ ...goods, technical_eur: +e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Servicios catering (€)</label>
                  <input type="number" className="input-field" value={goods.catering_eur}
                    onChange={e => setGoods({ ...goods, catering_eur: +e.target.value })} />
                </div>
              </div>
            </div>

            <div className="panel">
              <h2 className="h-display" style={{ fontSize: 26, color: '#0A0A0A', marginTop: 0, marginBottom: 8 }}>
                Catering — desglose por unidades
              </h2>
              <p style={{ color: '#5A5A5A', fontSize: 14, marginBottom: 24 }}>
                Si se conoce el número de comidas/bebidas servidas, se obtiene un cálculo más preciso que con el método económico.
              </p>
              <div className="grid-3">
                <div>
                  <label className="input-label">Comidas omnívoras</label>
                  <input type="number" className="input-field" value={goods.meals_omni}
                    onChange={e => setGoods({ ...goods, meals_omni: +e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Comidas vegetarianas</label>
                  <input type="number" className="input-field" value={goods.meals_veg}
                    onChange={e => setGoods({ ...goods, meals_veg: +e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Comidas veganas</label>
                  <input type="number" className="input-field" value={goods.meals_vegan}
                    onChange={e => setGoods({ ...goods, meals_vegan: +e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Bebidas alcohólicas</label>
                  <input type="number" className="input-field" value={goods.bev_alc}
                    onChange={e => setGoods({ ...goods, bev_alc: +e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Refrescos / agua</label>
                  <input type="number" className="input-field" value={goods.bev_soft}
                    onChange={e => setGoods({ ...goods, bev_soft: +e.target.value })} />
                </div>
              </div>
              <div style={{ marginTop: 24, padding: '16px 18px', background: '#F4F4F4', textAlign: 'right' }}>
                <span className="eyebrow" style={{ color: '#5A5A5A', marginRight: 10 }}>Subtotal bienes y servicios</span>
                <span className="h-display" style={{ fontSize: 24, color: '#E30613' }}>
                  {formatT(calculations.goodsTotal)} tCO₂e
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB: LOGÍSTICA */}
        {activeTab === 'logistica' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="panel">
              <h2 className="h-display" style={{ fontSize: 26, color: '#0A0A0A', marginTop: 0, marginBottom: 8 }}>
                Transporte de mercancías
              </h2>
              <p style={{ color: '#5A5A5A', fontSize: 14, marginBottom: 24 }}>
                Movimiento upstream y downstream de equipaciones, material de TV, mobiliario, catering, etc. Unidad: <strong>tonelada-kilómetro</strong> (peso × distancia).
              </p>
              <div className="grid-3">
                <div>
                  <label className="input-label">Camión (t·km)</label>
                  <input type="number" className="input-field" value={logistics.truck_tkm}
                    onChange={e => setLogistics({ ...logistics, truck_tkm: +e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Furgoneta (t·km)</label>
                  <input type="number" className="input-field" value={logistics.van_tkm}
                    onChange={e => setLogistics({ ...logistics, van_tkm: +e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Carga aérea (t·km)</label>
                  <input type="number" className="input-field" value={logistics.air_tkm}
                    onChange={e => setLogistics({ ...logistics, air_tkm: +e.target.value })} />
                </div>
              </div>
            </div>

            <div className="panel">
              <h2 className="h-display" style={{ fontSize: 26, color: '#0A0A0A', marginTop: 0, marginBottom: 8 }}>
                Residuos generados
              </h2>
              <p style={{ color: '#5A5A5A', fontSize: 14, marginBottom: 24 }}>
                Toneladas de residuos por destino final. Datos habituales del proveedor de limpieza/gestor de residuos.
              </p>
              <div className="grid-3">
                <div>
                  <label className="input-label">Vertedero (kg)</label>
                  <input type="number" className="input-field" value={logistics.waste_landfill_kg}
                    onChange={e => setLogistics({ ...logistics, waste_landfill_kg: +e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Reciclaje (kg)</label>
                  <input type="number" className="input-field" value={logistics.waste_recycle_kg}
                    onChange={e => setLogistics({ ...logistics, waste_recycle_kg: +e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Compostaje (kg)</label>
                  <input type="number" className="input-field" value={logistics.waste_compost_kg}
                    onChange={e => setLogistics({ ...logistics, waste_compost_kg: +e.target.value })} />
                </div>
              </div>
              <div style={{ marginTop: 24, padding: '16px 18px', background: '#F4F4F4', textAlign: 'right' }}>
                <span className="eyebrow" style={{ color: '#5A5A5A', marginRight: 10 }}>Subtotal logística</span>
                <span className="h-display" style={{ fontSize: 24, color: '#E30613' }}>
                  {formatT(calculations.logisticsTotal)} tCO₂e
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB: FACTORES */}
        {activeTab === 'factores' && (
          <div className="panel">
            <h2 className="h-display" style={{ fontSize: 26, color: '#0A0A0A', marginTop: 0, marginBottom: 8 }}>
              Factores de emisión
            </h2>
            <p style={{ color: '#5A5A5A', fontSize: 14, marginBottom: 24 }}>
              Valores por defecto basados en DEFRA 2024 GHG Conversion Factors y MITECO. Edítalos si dispones de factores
              específicos o si necesitas alinearlos con la metodología UEFA Carbon Footprint Calculator.
            </p>
            <div className="grid-2" style={{ gap: 12 }}>
              {Object.entries(factors).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F4F4F4', border: '1px solid #E5E5E5' }}>
                  <div style={{ flex: 1, fontSize: 13, color: '#0A0A0A' }}>{FACTOR_LABELS[key]}</div>
                  <input type="number" step="0.001" className="input-field" style={{ width: 110, padding: '6px 10px' }}
                    value={val} onChange={e => setFactors({ ...factors, [key]: +e.target.value })} />
                </div>
              ))}
            </div>
            <button onClick={() => setFactors(DEFAULT_FACTORS)} className="btn-secondary" style={{ marginTop: 24 }}>
              Restaurar valores por defecto
            </button>
          </div>
        )}

        {/* TAB: RESULTADOS */}
        {activeTab === 'resultados' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: '#E30613', color: '#FFFFFF', padding: 36 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
                <div>
                  <div className="eyebrow" style={{ color: '#FFD700' }}>Resumen del evento</div>
                  <h2 className="h-display" style={{ fontSize: 36, margin: '10px 0 0 0', lineHeight: 1.05 }}>
                    {eventName}
                  </h2>
                  <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 6, letterSpacing: '0.04em' }}>
                    {eventDate} · {attendees.toLocaleString('es-ES')} asistentes
                  </div>
                </div>
                <button onClick={exportCSV} style={{
                  padding: '14px 24px', background: '#FFFFFF', color: '#E30613', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
                }}>
                  <Download size={16} /> Exportar CSV
                </button>
              </div>

              <div className="grid-3">
                <div style={{ borderTop: '4px solid #FFFFFF', paddingTop: 16 }}>
                  <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.85)' }}>Total</div>
                  <div className="h-display" style={{ fontSize: 56, lineHeight: 1, marginTop: 8 }}>
                    {formatT(calculations.grandTotal)}
                  </div>
                  <div className="eyebrow" style={{ color: '#FFD700', marginTop: 6 }}>tCO₂e</div>
                </div>
                <div style={{ borderTop: '4px solid #FFD700', paddingTop: 16 }}>
                  <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.85)' }}>Por asistente</div>
                  <div className="h-display" style={{ fontSize: 56, lineHeight: 1, marginTop: 8 }}>
                    {calculations.perAttendee.toFixed(1)}
                  </div>
                  <div className="eyebrow" style={{ color: '#FFD700', marginTop: 6 }}>kgCO₂e / persona</div>
                </div>
                <div style={{ borderTop: '4px solid rgba(255,255,255,0.4)', paddingTop: 16 }}>
                  <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.85)' }}>Equivalencia</div>
                  <div className="h-display" style={{ fontSize: 56, lineHeight: 1, marginTop: 8 }}>
                    {Math.round(calculations.grandTotal / 1000 / 5.1).toLocaleString('es-ES')}
                  </div>
                  <div className="eyebrow" style={{ color: '#FFD700', marginTop: 6 }}>coches/año</div>
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="panel">
                <h3 className="h-display" style={{ fontSize: 18, color: '#0A0A0A', marginTop: 0, marginBottom: 16 }}>
                  Distribución por área UEFA
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={areaData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50}>
                      {areaData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${v.toFixed(1)} tCO₂e`} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="panel">
                <h3 className="h-display" style={{ fontSize: 18, color: '#0A0A0A', marginTop: 0, marginBottom: 16 }}>
                  Movilidad de aficionados por modo
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={fanChartData} layout="vertical" margin={{ left: 40 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                    <Tooltip formatter={(v) => `${v.toFixed(1)} tCO₂e`} />
                    <Bar dataKey="value" fill="#E30613" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel">
              <h3 className="h-display" style={{ fontSize: 18, color: '#0A0A0A', marginTop: 0, marginBottom: 16 }}>
                Desglose detallado
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#0A0A0A', color: '#FFFFFF' }}>
                    <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Categoría</th>
                    <th style={{ textAlign: 'right', padding: '14px 12px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>tCO₂e</th>
                    <th style={{ textAlign: 'right', padding: '14px 12px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>% total</th>
                    <th style={{ textAlign: 'right', padding: '14px 12px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>kg/asistente</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Movilidad — Aficionados', value: calculations.fanEmissions, indent: false },
                    { name: 'Movilidad — Equipos / staff', value: calculations.teamEmissions, indent: false },
                    { name: 'Alojamiento', value: calculations.accommodationTotal, indent: false },
                    { name: 'Instalaciones (upstream)', value: calculations.facilitiesTotal, indent: false },
                    { name: 'Bienes y servicios', value: calculations.goodsTotal, indent: false },
                    { name: 'Logística — Transporte', value: calculations.logisticsTransport, indent: true },
                    { name: 'Logística — Residuos', value: calculations.wasteTotal, indent: true },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #E5E5E5', background: i % 2 === 0 ? '#FFFFFF' : '#F9F9F9' }}>
                      <td style={{ padding: '12px', paddingLeft: row.indent ? 28 : 12, color: '#0A0A0A' }}>{row.name}</td>
                      <td className="h-display" style={{ padding: '12px', textAlign: 'right', color: '#E30613', fontSize: 16 }}>
                        {formatT(row.value)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#5A5A5A' }}>
                        {calculations.grandTotal > 0 ? ((row.value / calculations.grandTotal) * 100).toFixed(1) : '0'}%
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#5A5A5A' }}>
                        {(row.value / Math.max(attendees, 1)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '3px solid #E30613', background: '#F4F4F4' }}>
                    <td className="h-display" style={{ padding: '16px 12px', color: '#0A0A0A', fontSize: 14 }}>Total</td>
                    <td className="h-display" style={{ padding: '16px 12px', textAlign: 'right', fontSize: 18, color: '#E30613' }}>
                      {formatT(calculations.grandTotal)}
                    </td>
                    <td className="h-display" style={{ padding: '16px 12px', textAlign: 'right', color: '#0A0A0A' }}>100%</td>
                    <td className="h-display" style={{ padding: '16px 12px', textAlign: 'right', color: '#0A0A0A' }}>
                      {calculations.perAttendee.toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer style={{ background: '#0A0A0A', color: 'rgba(255,255,255,0.7)', padding: '28px 40px', marginTop: 48, fontSize: 12 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div className="eyebrow" style={{ color: '#FFFFFF' }}>RFEF · Sostenibilidad</div>
          <div>
            Calculadora basada en GHG Protocol Corporate Standard y UEFA Carbon Accounting Methodology (Dic 2024).
          </div>
          <div>
            Factores: DEFRA 2024 · MITECO · IDAE · REE
          </div>
        </div>
      </footer>
    </div>
  );
}
