let map = null;
let geojsonLayer = null;
let datosOriginales = null;
let baseVotantes = [];
let puestosLayerGroup = L.layerGroup();
let searchMarkersGroup = L.layerGroup();
let capaSeleccionada = null;
let barriosFiltroEstado = {};
let puestosFiltroEstado = {};

// 16 Puestos Oficiales con coordenadas reales en Facatativá y su nombre equivalente en el Excel
const listaPuestosVotacion = [
    { id: 1, nombre: "Colegio Silveria Espinosa", matchName: "COLEGIO SILVERIA ESPINOSA", direccion: "Calle 18B No. 4-21", lat: 4.8211, lon: -74.3524 },
    { id: 2, nombre: "El Portal de Tus Sueños", matchName: "EL PORTAL DE TUS SUEÑOS", direccion: "Calle 21C # 1-25 Sur", lat: 4.8015, lon: -74.3468 },
    { id: 3, nombre: "Esc. Prim. San Crist. John F. Kennedy", matchName: "COLEGIO JOHN F. KENNEDY", direccion: "Carrera 1A Sur No. 10A-04", lat: 4.8062, lon: -74.3491 },
    { id: 4, nombre: "Colegio Molinos Manuela Ayala", matchName: "COLEGIO MANUELA AYALA DE GAITÁN", direccion: "Carrera 4 No. 14-40", lat: 4.8175, lon: -74.3541 },
    { id: 5, nombre: "Col. Cartagenita Bloque D Primaria", matchName: "COL. CARTAGENITA BLOQUE D SEDE PRIMARIA", direccion: "Transversal 3 Sur No. 3A Sur-15", lat: 4.7968, lon: -74.3435 },
    { id: 6, nombre: "Centro de Discapacidad Manuel González", matchName: "CENTRO DE DESARROLLO SOCIAL", direccion: "Carrera 1 No. 13-28", lat: 4.8160, lon: -74.3495 },
    { id: 7, nombre: "Instituto Técnico Industrial", matchName: "INSTITUTO TÉCNICO INDUSTRIAL", direccion: "Carrera 5 # 9-45", lat: 4.8128, lon: -74.3551 },
    { id: 8, nombre: "Escuela Rafael Pombo", matchName: "ESCUELA RAFAEL POMBO", direccion: "Carrera 3 No. 8-134", lat: 4.8112, lon: -74.3538 },
    { id: 9, nombre: "Colegio Santa Rita", matchName: "COLEGIO SANTA RITA", direccion: "Carrera 10 No. 9-50", lat: 4.8135, lon: -74.3582 },
    { id: 10, nombre: "Colegio Nacional Emilio Cifuentes", matchName: "COLEGIO NACIONAL EMILIO CIFUENTES", direccion: "Carrera 11 con calle 2", lat: 4.8085, lon: -74.3575 },
    { id: 11, nombre: "Industrial Sede Talleres", matchName: "INDUSTRIAL SEDE TALLERES", direccion: "Piedras del Tunjo", lat: 4.8142, lon: -74.3498 },
    { id: 12, nombre: "Centro Educativo La Concepción", matchName: "CTRO EDU LA CONCEPCION", direccion: "Carrera 14 con calle 13", lat: 4.8228, lon: -74.3536 },
    { id: 13, nombre: "Universidad de Cundinamarca", matchName: "UNIVERSIDAD CUNDINAMARCA", direccion: "Calle 15 No. 17-44", lat: 4.8245, lon: -74.3591 },
    { id: 14, nombre: "Colegio Arboleda Sede Arboleda", matchName: "COLEGIO ARBOLEDA SEDE ARBOLEDA", direccion: "Carrera 7A No. 3-22 Este", lat: 4.8095, lon: -74.3451 },
    { id: 15, nombre: "Colegio Juan XXIII", matchName: "COLEGIO JUAN XXIII", direccion: "Vereda El Prado", lat: 4.8321, lon: -74.3395 },
    { id: 16, nombre: "Escuela Antigua Mancilla", matchName: "ESCUELA ANTIGUA MANCILLA", direccion: "Vereda Mancilla", lat: 4.8385, lon: -74.3512 }
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

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Cartografía Territorial Facatativá',
        maxZoom: 16
    }).addTo(map);

    puestosLayerGroup.addTo(map);
    searchMarkersGroup.addTo(map);

    // Cargar base de electores convertida desde Excel
    fetch('./electores.json')
        .then(res => res.json())
        .then(data => {
            baseVotantes = data;
            generarListaPuestos();
            cargarPuestosEnMapa();
        })
        .catch(err => console.log("Nota: Asegúrate de tener electores.json en la carpeta del proyecto."));

    fetch('./barrios.geojson')
        .then(response => response.json())
        .then(data => {
            datosOriginales = data;
            generarListaBarrios();
            actualizarMapa();
        });

    function obtenerNombreBarrio(feature, index) {
        if (feature && feature.properties) {
            return feature.properties.nombre || feature.properties.Barrio || `Sector ${index + 1}`;
        }
        return `Sector ${index + 1}`;
    }

    function generarListaBarrios() {
        const container = document.getElementById('barrios-checkbox-container');
        container.innerHTML = '';
        if (!datosOriginales || !datosOriginales.features) return;

        datosOriginales.features.forEach((feature, index) => {
            const nombreBarrio = obtenerNombreBarrio(feature, index);
            barriosFiltroEstado[nombreBarrio] = true;
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" class="chk-barrio" data-nombre="${nombreBarrio}" checked> ${nombreBarrio}`;
            container.appendChild(label);

            label.querySelector('input').addEventListener('change', function(e) {
                barriosFiltroEstado[e.target.getAttribute('data-nombre')] = e.target.checked;
                actualizarMapa();
            });
        });

        document.getElementById('select-all-barrios').addEventListener('change', function() {
            const isChecked = this.checked;
            document.querySelectorAll('.chk-barrio').forEach(chk => {
                chk.checked = isChecked;
                barriosFiltroEstado[chk.getAttribute('data-nombre')] = isChecked;
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
                puestosFiltroEstado[chk.getAttribute('data-id')] = isChecked;
            });
            cargarPuestosEnMapa();
        });
    }

    function cargarPuestosEnMapa() {
        puestosLayerGroup.clearLayers();

        listaPuestosVotacion.forEach(puesto => {
            if (puestosFiltroEstado[puesto.id] === false) return;

            const votantesPuesto = baseVotantes.filter(v => 
                v['PUESTO DE VOTACION'] && v['PUESTO DE VOTACION'].trim().toUpperCase() === puesto.matchName
            );
            const totalVotantes = votantesPuesto.length;

            const pin3DIcon = L.divIcon({
                className: 'custom-pin-3d-wrapper',
                html: `
                    <div style="position: relative; width: 44px; height: 52px; display: flex; align-items: center; justify-content: center; cursor: pointer; filter: drop-shadow(0px 8px 16px rgba(56, 189, 248, 0.6));">
                        <svg width="44" height="52" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="pinGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="#38BDF8" />
                                    <stop offset="100%" stop-color="#1D4ED8" />
                                </linearGradient>
                            </defs>
                            <path d="M50 0 C22.4 0 0 22.4 0 50 C0 80 50 120 50 120 C50 120 100 80 100 50 C100 22.4 77.6 0 50 0 Z" fill="url(#pinGradDark)"/>
                            <circle cx="50" cy="46" r="30" fill="#050817" />
                        </svg>
                        <span style="position: absolute; top: 11px; font-size: 16px;">🗳️</span>
                    </div>
                `,
                iconSize: [44, 52],
                iconAnchor: [22, 52]
            });

            const marker = L.marker([puesto.lat, puesto.lon], { icon: pin3DIcon });

            marker.bindTooltip(`${puesto.nombre} (${totalVotantes} votantes)`, {
                permanent: false, direction: 'top', className: 'leaflet-tooltip-barrio'
            });

            marker.on('click', function() {
                map.setView([puesto.lat, puesto.lon], 16);
                mostrarFichaPuesto(puesto, votantesPuesto);
            });

            puestosLayerGroup.addLayer(marker);
        });
    }

    function mostrarFichaPuesto(puesto, votantes) {
        let mesasCount = {};
        votantes.forEach(v => {
            let m = v.MESA || 'Sin Asignar';
            mesasCount[m] = (mesasCount[m] || 0) + 1;
        });

        let htmlMesas = Object.keys(mesasCount).map(m => `<li>Mesa ${m}: <strong>${mesasCount[m]} votantes</strong></li>`).join('');

        document.getElementById('fichaDetalle').innerHTML = `
            <h3>🗳️ ${puesto.nombre}</h3>
            <div class="ficha-item"><strong>Dirección:</strong> ${puesto.direccion}</div>
            <div class="ficha-item" style="color: var(--cyan-glow); font-weight: 600; margin-top: 6px;">Total Inscritos: ${votantes.length} ciudadanos</div>
            <div class="ficha-item" style="margin-top: 6px;"><strong>Distribución por Mesas:</strong></div>
            <ul style="font-size: 0.8rem; padding-left: 16px; max-height: 90px; overflow-y: auto; color: var(--text-muted);">
                ${htmlMesas || '<li>Sin mesas registradas en base</li>'}
            </ul>
            <button id="downloadExcelBtn" class="excel-download-btn">
                📥 Descargar Reporte Excel (${votantes.length})
            </button>
        `;

        document.getElementById('downloadExcelBtn').addEventListener('click', function() {
            exportarExcelPuesto(puesto, votantes);
        });
    }

    function exportarExcelPuesto(puesto, votantes) {
        if (votantes.length === 0) {
            alert("No hay votantes registrados para este puesto.");
            return;
        }

        const datosExportar = votantes.map((v, index) => ({
            "N.º": index + 1,
            "Documento": v.Documento || "",
            "Nombre Completo": v.NOMBRE || "",
            "Puesto de Votación": v['PUESTO DE VOTACION'] || puesto.nombre,
            "Mesa": v.MESA || "S/N",
            "Barrio": v.Barrio || "",
            "Líder / Cuidador": v.cuidador || "",
            "Teléfono": v['Teléfono / s'] || v.Teléfono || ""
        }));

        const worksheet = XLSX.utils.json_to_sheet(datosExportar);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Votantes Puesto");

        XLSX.writeFile(workbook, `Reporte_Votantes_${puesto.nombre.replace(/\s+/g, '_')}.xlsx`);
    }

    window.actualizarMapa = function() {
        if (!datosOriginales) return;
        if (geojsonLayer) map.removeLayer(geojsonLayer);

        geojsonLayer = L.geoJSON(datosOriginales, {
            filter: function(feature) {
                const index = datosOriginales.features.indexOf(feature);
                const nombreBarrio = obtenerNombreBarrio(feature, index);
                return barriosFiltroEstado[nombreBarrio] !== false;
            },
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: 6, fillColor: "#38BDF8", color: "#050817", weight: 2, fillOpacity: 0.9
                });
            },
            onEachFeature: function(feature, layer) {
                const index = datosOriginales.features.indexOf(feature);
                const nombreBarrio = obtenerNombreBarrio(feature, index);
                layer.bindTooltip(nombreBarrio, { permanent: false, direction: 'top', className: 'leaflet-tooltip-barrio' });
            }
        }).addTo(map);
    }

    function realizarBusqueda() {
        const query = document.getElementById('searchInput').value.trim().toLowerCase();
        if (!query) return;

        searchMarkersGroup.clearLayers();

        const puestoEncontrado = listaPuestosVotacion.get ? null : listaPuestosVotacion.find(p => p.nombre.toLowerCase().includes(query) || p.direccion.toLowerCase().includes(query));
        if (puestoEncontrado) {
            map.setView([puestoEncontrado.lat, puestoEncontrado.lon], 16);
            const votantesPuesto = baseVotantes.filter(v => v['PUESTO DE VOTACION'] && v['PUESTO DE VOTACION'].trim().toUpperCase() === puestoEncontrado.matchName);
            mostrarFichaPuesto(puestoEncontrado, votantesPuesto);
            return;
        }

        const ciudadanoEncontrado = baseVotantes.find(v => v.NOMBRE && v.NOMBRE.toLowerCase().includes(query));
        if (ciudadanoEncontrado) {
            const matchPuesto = listaPuestosVotacion.find(p => p.matchName === (ciudadanoEncontrado['PUESTO DE VOTACION'] || '').trim().toUpperCase());
            if (matchPuesto) {
                map.setView([matchPuesto.lat, matchPuesto.lon], 16);
                const votantesPuesto = baseVotantes.filter(v => v['PUESTO DE VOTACION'] === ciudadanoEncontrado['PUESTO DE VOTACION']);
                mostrarFichaPuesto(matchPuesto, votantesPuesto);
                alert(`Ciudadano encontrado: ${ciudadanoEncontrado.NOMBRE} (Puesto: ${matchPuesto.nombre}, Mesa: ${ciudadanoEncontrado.MESA || 'S/N'})`);
                return;
            }
        }

        alert("No se encontró el puesto o ciudadano en la base de datos.");
    }

    document.getElementById('searchBtn').addEventListener('click', realizarBusqueda);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') realizarBusqueda();
    });

    setTimeout(() => { map.invalidateSize(); }, 200);
}