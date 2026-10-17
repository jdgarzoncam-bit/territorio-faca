let map = null;
let geojsonLayer = null;
let datosOriginales = null;
let puestosLayerGroup = L.layerGroup();
let searchMarkersGroup = L.layerGroup();
let capaSeleccionada = null;
let barriosFiltroEstado = {};
let puestosFiltroEstado = {};

// Lista Oficial con Coordenadas Reales de Puestos de Votación en Facatativá
const listaPuestosVotacion = [
    { id: 1, nombre: "Colegio Silveria Espinosa", direccion: "Calle 18B No. 4-21", lat: 4.8211, lon: -74.3524 },
    { id: 2, nombre: "El Portal de Tus Sueños", direccion: "Calle 21C # 1-25 Sur", lat: 4.8015, lon: -74.3468 },
    { id: 3, nombre: "Esc. Prim. SD San Crist. John F. Kennedy", direccion: "Carrera 1A Sur No. 10A-04", lat: 4.8062, lon: -74.3491 },
    { id: 4, nombre: "Colegio SD Molinos Manuela Ayala", direccion: "Carrera 4 No. 14-40", lat: 4.8175, lon: -74.3541 },
    { id: 5, nombre: "Col. Cartagenita Bloque D Sede Primaria", direccion: "Transversal 3 Sur No. 3A Sur-15", lat: 4.7968, lon: -74.3435 },
    { id: 6, nombre: "Centro de Discapacidad Manuel González C.", direccion: "Carrera 1 No. 13-28", lat: 4.8160, lon: -74.3495 },
    { id: 7, nombre: "Instituto Técnico Industrial", direccion: "Carrera 5 # 9-45", lat: 4.8128, lon: -74.3551 },
    { id: 8, nombre: "Escuela Rafael Pombo", direccion: "Carrera 3 No. 8-134", lat: 4.8112, lon: -74.3538 },
    { id: 9, nombre: "Colegio Santa Rita", direccion: "Carrera 10 # 9-50", lat: 4.8135, lon: -74.3582 },
    { id: 10, nombre: "Colegio Nacional Emilio Cifuentes", direccion: "Carrera 11 con calle 2", lat: 4.8085, lon: -74.3575 },
    { id: 11, nombre: "Industrial Sede Talleres", direccion: "Piedras del Tunjo, sector 19, sector 800", lat: 4.8142, lon: -74.3498 },
    { id: 12, nombre: "Centro Educativo La Concepción", direccion: "Carrera 14 con calle 13, esquina", lat: 4.8228, lon: -74.3536 },
    { id: 13, nombre: "Universidad de Cundinamarca", direccion: "Calle 15 No. 17-44", lat: 4.8245, lon: -74.3591 },
    { id: 14, nombre: "Colegio Arboleda Sede Arboleda", direccion: "Carrera 7A No. 3-22 Este", lat: 4.8095, lon: -74.3451 },
    { id: 15, nombre: "Colegio Juan XXIII", direccion: "Vereda El Prado, km 4 vía Facatativá–El Rosal", lat: 4.8321, lon: -74.3395 },
    { id: 16, nombre: "Escuela Antigua Mancilla", direccion: "Vereda Mancilla, km 3 vía Ecopetrol", lat: 4.8385, lon: -74.3512 }
];

function validarAcceso() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('loginError');

    if (user === 'admin' && pass === 'FacaDemo2026!') {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        inicializarSistemaMapa();
    } else {
        errorMsg.style.display = 'block';
    }
}

document.getElementById('loginBtn').addEventListener('click', validarAcceso);
document.getElementById('password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') validarAcceso();
});

function inicializarSistemaMapa() {
    if (map) return;

    map = L.map('map', { zoomControl: false }).setView([4.8123, -74.3542], 14);
    L.control.zoom({ position: 'topright' }).addTo(map);

    // SERVIDOR DE MAPAS GRATUITO Y SIN MARCA DE AGUA (Esri World Dark Gray)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Cartografía Territorial Facatativá',
        maxZoom: 16
    }).addTo(map);

    puestosLayerGroup.addTo(map);
    searchMarkersGroup.addTo(map);

    fetch('./barrios.geojson')
        .then(response => {
            if (!response.ok) throw new Error('No se pudo encontrar barrios.geojson');
            return response.json();
        })
        .then(data => {
            datosOriginales = data;
            generarListaBarrios();
            actualizarMapa();

            if (geojsonLayer && geojsonLayer.getBounds().isValid()) {
                map.fitBounds(geojsonLayer.getBounds(), { padding: [60, 60] });
            }
        })
        .catch(error => {
            console.error('Error cargando el GeoJSON:', error);
            document.getElementById('barrios-checkbox-container').innerHTML = 
                '<p style="color: #f87171; font-size: 0.8rem;">Error al cargar barrios.geojson.</p>';
        });

    generarListaPuestos();
    cargarPuestosEnMapa();

    function obtenerNombreBarrio(feature, index) {
        if (feature && feature.properties) {
            return feature.properties.nombre || feature.properties.Barrio || feature.properties['Barrio / sector'] || `Sector ${index + 1}`;
        }
        return `Sector ${index + 1}`;
    }

    function generarListaBarrios() {
        const container = document.getElementById('barrios-checkbox-container');
        container.innerHTML = '';

        if (!datosOriginales || !datosOriginales.features) return;

        datosOriginales.features.forEach((feature, index) => {
            const nombreBarrio = obtenerNombreBarrio(feature, index);
            const idCheck = `barrio-cb-${index}`;
            
            barriosFiltroEstado[nombreBarrio] = true;

            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" class="chk-barrio" id="${idCheck}" data-nombre="${nombreBarrio}" checked> ${nombreBarrio}`;
            container.appendChild(label);

            label.querySelector('input').addEventListener('change', function(e) {
                const bNombre = e.target.getAttribute('data-nombre');
                barriosFiltroEstado[bNombre] = e.target.checked;
                actualizarMapa();
            });
        });

        const selectAllBarrios = document.getElementById('select-all-barrios');
        selectAllBarrios.addEventListener('change', function() {
            const isChecked = this.checked;
            document.querySelectorAll('.chk-barrio').forEach(chk => {
                chk.checked = isChecked;
                const bNombre = chk.getAttribute('data-nombre');
                barriosFiltroEstado[bNombre] = isChecked;
            });
            actualizarMapa();
        });
    }

    function generarListaPuestos() {
        const container = document.getElementById('puestos-checkbox-container');
        container.innerHTML = '';

        listaPuestosVotacion.forEach(puesto => {
            puestosFiltroEstado[puesto.id] = true;

            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" class="chk-puesto" data-id="${puesto.id}" checked> ${puesto.nombre}`;
            container.appendChild(label);

            label.querySelector('input').addEventListener('change', function(e) {
                puestosFiltroEstado[puesto.id] = e.target.checked;
                cargarPuestosEnMapa();
            });
        });

        document.getElementById('select-all-puestos').addEventListener('change', function() {
            const isChecked = this.checked;
            document.querySelectorAll('.chk-puesto').forEach(chk => {
                chk.checked = isChecked;
                const id = chk.getAttribute('data-id');
                puestosFiltroEstado[id] = isChecked;
            });
            cargarPuestosEnMapa();
        });
    }

    function cargarPuestosEnMapa() {
        puestosLayerGroup.clearLayers();

        listaPuestosVotacion.forEach(puesto => {
            if (puestosFiltroEstado[puesto.id] === false) return;

            const pin3DIcon = L.divIcon({
                className: 'custom-pin-3d-wrapper',
                html: `
                    <div style="
                        position: relative;
                        width: 42px;
                        height: 50px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        filter: drop-shadow(0px 8px 16px rgba(56, 189, 248, 0.55));
                        transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
                    " onmouseover="this.style.transform='scale(1.2) translateY(-4px)'" onmouseout="this.style.transform='scale(1) translateY(0)'">
                        <svg width="42" height="50" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="pinGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="#38BDF8" />
                                    <stop offset="100%" stop-color="#1D4ED8" />
                                </linearGradient>
                            </defs>
                            <path d="M50 0 C22.4 0 0 22.4 0 50 C0 80 50 120 50 120 C50 120 100 80 100 50 C100 22.4 77.6 0 50 0 Z" fill="url(#pinGradDark)"/>
                            <circle cx="50" cy="46" r="30" fill="#050817" />
                        </svg>
                        <span style="position: absolute; top: 11px; font-size: 18px; line-height: 1;">🗳️</span>
                    </div>
                `,
                iconSize: [42, 50],
                iconAnchor: [21, 50]
            });

            const marker = L.marker([puesto.lat, puesto.lon], { icon: pin3DIcon });

            marker.bindTooltip(puesto.nombre, {
                permanent: false,
                direction: 'top',
                className: 'leaflet-tooltip-barrio'
            });

            marker.on('click', function() {
                map.setView([puesto.lat, puesto.lon], 16);
                document.getElementById('fichaDetalle').innerHTML = `
                    <h3>🗳️ ${puesto.nombre}</h3>
                    <div class="ficha-item"><strong>Tipo:</strong> Puesto de Votación Oficial</div>
                    <div class="ficha-item"><strong>Dirección:</strong> ${puesto.direccion}</div>
                    <div class="ficha-item" style="margin-top:8px; padding-top:6px; border-top:1px dashed rgba(255,255,255,0.15); color: #38BDF8; font-weight: 600;">Plataforma Territorial Faca</div>
                `;
            });

            puestosLayerGroup.addLayer(marker);
        });
    }

    document.getElementById('select-all-secretarias').addEventListener('change', function() {
        const isChecked = this.checked;
        document.querySelectorAll('.chk-sec').forEach(chk => chk.checked = isChecked);
        actualizarMapa();
    });

    document.getElementById('select-all-poblacion').addEventListener('change', function() {
        const isChecked = this.checked;
        document.querySelectorAll('.chk-poblacion').forEach(chk => chk.checked = isChecked);
        actualizarMapa();
    });

    window.actualizarMapa = function() {
        if (!datosOriginales) return;

        if (geojsonLayer) {
            map.removeLayer(geojsonLayer);
        }

        geojsonLayer = L.geoJSON(datosOriginales, {
            filter: function(feature) {
                const index = datosOriginales.features.indexOf(feature);
                const nombreBarrio = obtenerNombreBarrio(feature, index);
                if (barriosFiltroEstado[nombreBarrio] === false) return false;
                return true;
            },
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: 6,
                    fillColor: "#38BDF8",
                    color: "#050817",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.9
                });
            },
            onEachFeature: function(feature, layer) {
                const index = datosOriginales.features.indexOf(feature);
                const nombreBarrio = obtenerNombreBarrio(feature, index);

                layer.bindTooltip(nombreBarrio, {
                    permanent: false,
                    direction: 'top',
                    className: 'leaflet-tooltip-barrio'
                });

                layer.on('click', function(e) {
                    if (capaSeleccionada) {
                        capaSeleccionada.setStyle({ fillColor: "#38BDF8", radius: 6 });
                    }
                    capaSeleccionada = e.target;
                    capaSeleccionada.setStyle({ fillColor: "#f97316", radius: 10 });

                    const p = feature.properties || {};
                    document.getElementById('fichaDetalle').innerHTML = `
                        <h3>${nombreBarrio}</h3>
                        <div class="ficha-item"><strong>Zona:</strong> ${p.comuna_zona || 'Facatativá'}</div>
                        <div class="ficha-item"><strong>Presidente JAC:</strong> ${p.jac_presidente || 'Por registrar'}</div>
                        <div class="ficha-item"><strong>Líder Zonal:</strong> ${p.lider_zonal || 'Por registrar'}</div>
                        <div class="ficha-item" style="margin-top:8px; padding-top:6px; border-top:1px dashed rgba(255,255,255,0.15);"><strong>🗳️ Puesto de Votación:</strong><br>${p.puesto_votacion || 'Por asignar'}</div>
                    `;
                });
            }
        }).addTo(map);
    }

    document.querySelectorAll('.chk-poblacion, .chk-sec').forEach(checkbox => {
        checkbox.addEventListener('change', actualizarMapa);
    });

    function realizarBusqueda() {
        const query = document.getElementById('searchInput').value.trim().toLowerCase();
        if (!query) return;

        searchMarkersGroup.clearLayers();

        const puestoEncontrado = listaPuestosVotacion.find(p => p.nombre.toLowerCase().includes(query) || p.direccion.toLowerCase().includes(query));
        if (puestoEncontrado) {
            map.setView([puestoEncontrado.lat, puestoEncontrado.lon], 16);

            document.getElementById('fichaDetalle').innerHTML = `
                <h3>🗳️ ${puestoEncontrado.nombre}</h3>
                <div class="ficha-item"><strong>Tipo:</strong> Puesto de Votación Oficial</div>
                <div class="ficha-item"><strong>Dirección Exacta:</strong> ${puestoEncontrado.direccion}</div>
                <div class="ficha-item" style="margin-top:8px; padding-top:6px; border-top:1px dashed rgba(255,255,255,0.15); color: #38BDF8; font-weight: 600;">Ubicación Encontrada</div>
            `;
            return;
        }

        let sectoresCoincidentes = [];
        if (datosOriginales && datosOriginales.features) {
            datosOriginales.features.forEach((f, idx) => {
                const nombre = obtenerNombreBarrio(f, idx);
                if (nombre.toLowerCase().includes(query)) {
                    sectoresCoincidentes.push({ feature: f, nombre: nombre });
                }
            });
        }

        if (sectoresCoincidentes.length > 0) {
            const coords = sectoresCoincidentes[0].feature.geometry.coordinates;
            map.setView([coords[1], coords[0]], 16);
            return;
        }

        alert("No se encontró el puesto de votación o lugar en Facatativá.");
    }

    document.getElementById('searchBtn').addEventListener('click', realizarBusqueda);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') realizarBusqueda();
    });

    setTimeout(() => { map.invalidateSize(); }, 200);
}