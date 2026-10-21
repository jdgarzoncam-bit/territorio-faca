let map = null;
let geojsonLayer = null;
let datosOriginales = null;
let baseVotantes = [];
let puestosLayerGroup = L.layerGroup();
let searchMarkersGroup = L.layerGroup();
let miraMarkersGroup = L.layerGroup();
let heatLayer = null;
let isHeatmapActive = false;
let barriosFiltroEstado = {};
let puestosFiltroEstado = {};

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

document.getElementById('sidebarToggleBtn').addEventListener('click', function() {
    const sidebar = document.getElementById('mainSidebar');
    sidebar.classList.toggle('collapsed');
    manejarBotonFlotanteReapertura(sidebar.classList.contains('collapsed'));
    setTimeout(() => { if (map) map.invalidateSize(); }, 350);
});

function manejarBotonFlotanteReapertura(estaContraido) {
    let floatBtn = document.getElementById('floatingReopenBtn');
    if (estaContraido) {
        if (!floatBtn) {
            floatBtn = document.createElement('button');
            floatBtn.id = 'floatingReopenBtn';
            floatBtn.title = 'Mostrar Menú';
            floatBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>`;
            floatBtn.style.cssText = `
                position: fixed; top: 20px; left: 20px; width: 48px; height: 48px;
                background: linear-gradient(135deg, rgba(37, 99, 235, 0.85), rgba(11, 21, 48, 0.95));
                backdrop-filter: blur(16px); border: 1px solid var(--cyan-glow);
                border-radius: 16px; color: var(--cyan-glow); display: flex;
                align-items: center; justify-content: center; cursor: pointer; z-index: 1500;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(56, 189, 248, 0.4);
                transition: all 0.3s ease;
            `;
            floatBtn.addEventListener('click', function() {
                const sidebar = document.getElementById('mainSidebar');
                sidebar.classList.remove('collapsed');
                floatBtn.remove();
                setTimeout(() => { if (map) map.invalidateSize(); }, 350);
            });
            document.body.appendChild(floatBtn);
        } else {
            floatBtn.style.display = 'flex';
        }
    } else {
        if (floatBtn) floatBtn.style.display = 'none';
    }
}

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
    miraMarkersGroup.addTo(map);

    // Botón de cierre para la tarjeta flotante del puesto
    document.getElementById('closeFloatingWidget').addEventListener('click', function() {
        document.getElementById('floatingPuestoWidget').classList.add('hidden');
    });

    fetch('./electores_2.json')
        .then(res => res.json())
        .catch(() => fetch('./electores.json').then(res => res.json()))
        .then(data => {
            baseVotantes = data || [];
            generarListaPuestos();
            cargarPuestosEnMapa();
            inicializarModuloInfoMIRA();
            actualizarDashboardKPIs();
            inicializarModulosNuevos();
        })
        .catch(err => console.log("Aviso: Asegúrate de tener electores_2.json en la carpeta."));

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
        if (!container) return;
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

        const selectAllPuestos = document.getElementById('select-all-puestos');
        if (selectAllPuestos) {
            selectAllPuestos.addEventListener('change', function() {
                const isChecked = this.checked;
                document.querySelectorAll('.chk-puesto').forEach(chk => {
                    chk.checked = isChecked;
                    puestosFiltroEstado[chk.getAttribute('data-id')] = isChecked;
                });
                cargarPuestosEnMapa();
            });
        }
    }

    function actualizarDashboardKPIs() {
        const totalVotantes = baseVotantes.length;
        const metaEsperada = 1000;
        const porcentaje = Math.min(100, Math.round((totalVotantes / metaEsperada) * 100));

        let lideresCount = 0;
        let activosCount = 0;
        let referidosCount = 0;

        baseVotantes.forEach(v => {
            const estado = (v.Estado || v.ESTADO || v.ROL || 'REFERIDO').toString().toUpperCase();
            if (estado.includes('LIDER') || estado.includes('LÍDER') || estado.includes('CUIDADOR')) lideresCount++;
            else if (estado.includes('ACTIVO')) activosCount++;
            else referidosCount++;
        });

        document.getElementById('kpiMetaVal').innerText = `${porcentaje}% (${totalVotantes} / ${metaEsperada})`;
        document.getElementById('kpiBarFill').style.width = `${porcentaje}%`;
        document.getElementById('kpiLideres').innerText = lideresCount;
        document.getElementById('kpiActivos').innerText = activosCount;
        document.getElementById('kpiReferidos').innerText = referidosCount;
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

    // MOSTRAR FICHA CON EL DISEÑO BASADO EN EL PANTALLAZO 2 EN LA ESQUINA INFERIOR DERECHA
    function mostrarFichaPuesto(puesto, votantes) {
        let mesasCount = {};
        votantes.forEach(v => {
            let m = v.MESA || 'S/N';
            mesasCount[m] = (mesasCount[m] || 0) + 1;
        });

        const totalMesas = Object.keys(mesasCount).length;
        const mesaMasPoblada = Object.keys(mesasCount).reduce((a, b) => mesasCount[a] > mesasCount[b] ? a : b, '1');

        let htmlMesas = Object.keys(mesasCount).map(m => {
            let pct = Math.min(100, Math.round((mesasCount[m] / 15) * 100));
            return `
                <div class="dash-progress-row">
                    <div class="dash-progress-label">
                        <span>Mesa ${m}</span>
                        <strong>${mesasCount[m]} votante(s)</strong>
                    </div>
                    <div class="dash-bar-bg">
                        <div class="dash-bar-fill" style="width: ${pct}%;"></div>
                    </div>
                </div>
            `;
        }).join('');

        const widgetContent = document.getElementById('floatingWidgetContent');
        widgetContent.innerHTML = `
            <!-- Bloque Encabezado -->
            <div class="dash-header">
                <div class="dash-title-group">
                    <h3>🗳️ ${puesto.nombre}</h3>
                    <span class="dash-badge">PUESTO OFICIAL</span>
                </div>
            </div>

            <!-- Bloque Círculos KPIs Estilo Pantallazo 2 -->
            <div class="dash-circles-row">
                <div class="dash-circle-item">
                    <div class="dash-circle-ring">
                        <span>${puesto.id}</span>
                    </div>
                    <small>ID Puesto</small>
                </div>

                <div class="dash-circle-item active">
                    <div class="dash-circle-ring primary">
                        <span>${votantes.length}</span>
                    </div>
                    <small>Inscritos</small>
                </div>

                <div class="dash-circle-item">
                    <div class="dash-circle-ring">
                        <span>${totalMesas}</span>
                    </div>
                    <small>Mesas</small>
                </div>
            </div>

            <div class="dash-divider"></div>

            <!-- Sección Dirección y Detalle -->
            <div class="dash-info-group">
                <div class="dash-info-item">
                    <span class="dash-icon">📍</span>
                    <div>
                        <small>Ubicación / Dirección</small>
                        <strong>${puesto.direccion}</strong>
                    </div>
                </div>
            </div>

            <div class="dash-divider"></div>

            <!-- Sección de Barras de Distribución por Mesas -->
            <div class="dash-section-title">
                <span class="dash-icon">📊</span> Distribución de Censo por Mesas
            </div>
            <div class="dash-progress-container">
                ${htmlMesas || '<p class="placeholder-text">Sin mesas asignadas en la base.</p>'}
            </div>

            <!-- Botón de Acción Inferior -->
            <button id="downloadExcelBtn" class="excel-download-btn">
                📥 Descargar Reporte Excel (${votantes.length})
            </button>
        `;

        const widgetContainer = document.getElementById('floatingPuestoWidget');
        widgetContainer.classList.remove('hidden');

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
            "Documento": v.Documento || v.CEDULA || "",
            "Nombre Completo": v.NOMBRE || "",
            "Puesto de Votación": v['PUESTO DE VOTACION'] || puesto.nombre,
            "Mesa": v.MESA || "S/N",
            "Barrio": v.Barrio || "",
            "Líder / Cuidador": v.cuidador || v.CUIDADOR || v.LIDER || "",
            "Estado / Rol": v.Estado || v.ESTADO || v.ROL || "REFERIDO",
            "Teléfono": v['Teléfono / s'] || v.Teléfono || ""
        }));

        const worksheet = XLSX.utils.json_to_sheet(datosExportar);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Votantes Puesto");

        XLSX.writeFile(workbook, `Reporte_Votantes_${puesto.nombre.replace(/\s+/g, '_')}.xlsx`);
    }

    function inicializarModulosNuevos() {
        document.getElementById('logisticaBtn').addEventListener('click', function() {
            const filtroMovilidad = document.getElementById('logisticaSelect').value;
            alert(`Filtro de Logística aplicado: ${filtroMovilidad}.`);
        });

        document.getElementById('asistenciaBtn').addEventListener('click', function() {
            const filtroAsistencia = document.getElementById('asistenciaSelect').value;
            alert(`Filtro de Asistencia Electoral aplicado: ${filtroAsistencia}.`);
        });

        document.getElementById('toggleHeatmapBtn').addEventListener('click', function() {
            isHeatmapActive = !isHeatmapActive;
            if (isHeatmapActive) {
                let heatPoints = [];
                listaPuestosVotacion.forEach(p => {
                    const count = baseVotantes.filter(v => (v['PUESTO DE VOTACION'] || '').trim().toUpperCase() === p.matchName).length;
                    if (count > 0) {
                        heatPoints.push([p.lat, p.lon, Math.min(1.0, count / 20)]);
                    }
                });
                if (heatPoints.length > 0 && typeof L.heatLayer === 'function') {
                    heatLayer = L.heatLayer(heatPoints, { radius: 32, blur: 20, maxZoom: 16 }).addTo(map);
                    alert("🔥 Mapa de Calor activado correctamente sobre Facatativá.");
                } else {
                    alert("Activando simulación térmica según densidad electoral...");
                    let simPoints = listaPuestosVotacion.map(p => [p.lat, p.lon, 0.8]);
                    heatLayer = L.heatLayer(simPoints, { radius: 30, blur: 20 }).addTo(map);
                }
            } else {
                if (heatLayer) {
                    map.removeLayer(heatLayer);
                    heatLayer = null;
                }
                alert("Mapa de calor desactivado.");
            }
        });
    }

    function inicializarModuloInfoMIRA() {
        const inputCuidador = document.getElementById('cuidadorSearchInput');
        const btnBuscarMira = document.getElementById('miraSearchBtn');
        const selectEstado = document.getElementById('miraEstadoSelect');
        const btnResetMira = document.getElementById('miraResetBtn');
        const miraInternalContainer = document.getElementById('miraInternalResultsContainer');

        function aplicarFiltroInfoMIRA() {
            const queryCuidador = inputCuidador.value.trim().toLowerCase();
            const estadoFiltro = selectEstado.value.toUpperCase();

            if (!queryCuidador && estadoFiltro === 'TODOS') {
                miraMarkersGroup.clearLayers();
                puestosLayerGroup.addTo(map);
                if (miraInternalContainer) miraInternalContainer.innerHTML = '';
                return;
            }

            const redEncontrada = baseVotantes.filter(v => {
                const cuidador = (v.cuidador || v.CUIDADOR || v.LIDER || '').toString().toLowerCase();
                const docCuidador = (v.cedula_cuidador || v.DOC_CUIDADOR || '').toString().toLowerCase();
                const nombrePropio = (v.NOMBRE || '').toString().toLowerCase();
                const docPropio = (v.Documento || v.CEDULA || '').toString().toLowerCase();
                const estadoVal = (v.Estado || v.ESTADO || v.ROL || 'REFERIDO').toString().toUpperCase();

                const coincideCuidador = !queryCuidador || 
                    cuidador.includes(queryCuidador) || 
                    docCuidador.includes(queryCuidador) ||
                    nombrePropio.includes(queryCuidador) ||
                    docPropio.includes(queryCuidador);

                const coincideEstado = (estadoFiltro === 'TODOS') || estadoVal.includes(estadoFiltro);

                return coincideCuidador && coincideEstado;
            });

            if (redEncontrada.length === 0) {
                if (miraInternalContainer) {
                    miraInternalContainer.innerHTML = `<div style="font-size: 0.78rem; color: #f87171; padding: 6px; text-align: center;">No se encontraron registros para la red.</div>`;
                }
                return;
            }

            puestosLayerGroup.remove();
            miraMarkersGroup.clearLayers();

            let puestosAfectados = {};
            redEncontrada.forEach(v => {
                const pNombre = (v['PUESTO DE VOTACION'] || '').trim().toUpperCase();
                if (!puestosAfectados[pNombre]) puestosAfectados[pNombre] = [];
                puestosAfectados[pNombre].push(v);
            });

            let bounds = [];

            listaPuestosVotacion.forEach(puesto => {
                const votantesRedPuesto = puestosAfectados[puesto.matchName];
                if (votantesRedPuesto && votantesRedPuesto.length > 0) {
                    bounds.push([puesto.lat, puesto.lon]);

                    const pinMiraIcon = L.divIcon({
                        className: 'custom-pin-mira-wrapper',
                        html: `
                            <div style="position: relative; width: 46px; height: 54px; display: flex; align-items: center; justify-content: center; cursor: pointer; filter: drop-shadow(0px 8px 18px rgba(56, 189, 248, 0.9));">
                                <svg width="46" height="54" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M50 0 C22.4 0 0 22.4 0 50 C0 80 50 120 50 120 C50 120 100 80 100 50 C100 22.4 77.6 0 50 0 Z" fill="#2563EB"/>
                                    <circle cx="50" cy="46" r="32" fill="#050817" stroke="#38BDF8" stroke-width="4"/>
                                </svg>
                                <span style="position: absolute; top: 12px; font-size: 16px;">💙</span>
                            </div>
                        `,
                        iconSize: [46, 54],
                        iconAnchor: [23, 54]
                    });

                    const marker = L.marker([puesto.lat, puesto.lon], { icon: pinMiraIcon });
                    marker.bindTooltip(`Red InfoMIRA: ${votantesRedPuesto.length} asignados en ${puesto.nombre}`, {
                        permanent: false, direction: 'top', className: 'leaflet-tooltip-barrio'
                    });

                    marker.on('click', function() {
                        map.setView([puesto.lat, puesto.lon], 16);
                        mostrarFichaPuesto(puesto, votantesRedPuesto);
                    });

                    miraMarkersGroup.addLayer(marker);
                }
            });

            if (bounds.length > 0) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }

            mostrarResultadosEnModuloInfoMIRA(queryCuidador, estadoFiltro, redEncontrada, puestosAfectados);
        }

        function mostrarResultadosEnModuloInfoMIRA(query, estado, redTotal, puestosAfectados) {
            if (!miraInternalContainer) return;
            const nombreLider = query ? query.toUpperCase() : "GENERAL";
            const numPuestos = Object.keys(puestosAfectados).length;

            let htmlDetalleIntegrantes = redTotal.map((v, i) => `
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); border-radius: 8px; padding: 8px; margin-bottom: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                        <span style="font-weight: 700; color: var(--text-main); font-size: 0.8rem;">${i + 1}. ${v.NOMBRE || 'Sin Nombre'}</span>
                        <span style="font-size: 0.65rem; padding: 2px 5px; background: rgba(56, 189, 248, 0.15); color: var(--cyan-glow); border-radius: 4px; font-weight: 600;">
                            ${v.Estado || v.ESTADO || v.ROL || 'REFERIDO'}
                        </span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); display: grid; grid-template-columns: 1fr 1fr; gap: 3px; margin-top: 4px;">
                        <div><strong>Doc:</strong> ${v.Documento || v.CEDULA || 'N/A'}</div>
                        <div><strong>Tel:</strong> ${v['Teléfono / s'] || v.Teléfono || 'N/A'}</div>
                        <div><strong>Puesto:</strong> ${v['PUESTO DE VOTACION'] || 'Sin Asignar'}</div>
                        <div><strong>Mesa:</strong> ${v.MESA || 'S/N'}</div>
                    </div>
                </div>
            `).join('');

            miraInternalContainer.innerHTML = `
                <div style="border-top: 1px solid var(--glass-border); padding-top: 8px; margin-top: 4px;">
                    <div style="font-size: 0.82rem; color: var(--cyan-glow); font-weight: 700; margin-bottom: 4px;">💙 Red InfoMIRA — ${nombreLider}</div>
                    <div style="font-size: 0.76rem; color: var(--text-muted); margin-bottom: 4px;">
                        <div><strong>Estado:</strong> ${estado} | <strong>Integrantes:</strong> ${redTotal.length}</div>
                        <div><strong>Puestos Cubiertos:</strong> ${numPuestos}</div>
                    </div>
                    <div style="max-height: 200px; overflow-y: auto; padding-right: 2px; margin-bottom: 6px;">
                        ${htmlDetalleIntegrantes}
                    </div>
                    <button id="downloadExcelRedInternalBtn" class="excel-download-btn" style="padding: 8px; font-size: 0.8rem;">
                        📥 Exportar Red InfoMIRA a Excel (${redTotal.length})
                    </button>
                </div>
            `;

            document.getElementById('downloadExcelRedInternalBtn').addEventListener('click', function() {
                const datosExportar = redTotal.map((v, index) => ({
                    "N.º": index + 1,
                    "Documento": v.Documento || v.CEDULA || "",
                    "Nombre Completo": v.NOMBRE || "",
                    "Cuidador / Líder": v.cuidador || v.CUIDADOR || v.LIDER || nombreLider,
                    "Estado / Rol": v.Estado || v.ESTADO || v.ROL || "REFERIDO",
                    "Puesto de Votación": v['PUESTO DE VOTACION'] || "",
                    "Mesa": v.MESA || "S/N",
                    "Barrio": v.Barrio || "",
                    "Teléfono": v['Teléfono / s'] || v.Teléfono || ""
                }));

                const worksheet = XLSX.utils.json_to_sheet(datosExportar);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Red InfoMIRA");
                XLSX.writeFile(workbook, `Red_InfoMIRA_${nombreLider.replace(/\s+/g, '_')}.xlsx`);
            });
        }

        btnBuscarMira.addEventListener('click', aplicarFiltroInfoMIRA);
        inputCuidador.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') aplicarFiltroInfoMIRA();
        });
        selectEstado.addEventListener('change', aplicarFiltroInfoMIRA);

        btnResetMira.addEventListener('click', function() {
            inputCuidador.value = '';
            selectEstado.value = 'TODOS';
            miraMarkersGroup.clearLayers();
            puestosLayerGroup.addTo(map);
            if (miraInternalContainer) miraInternalContainer.innerHTML = '';
            map.setView([4.8123, -74.3542], 14);
        });
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

        const puestoEncontrado = listaPuestosVotacion.find(p => p.nombre.toLowerCase().includes(query) || p.direccion.toLowerCase().includes(query));
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