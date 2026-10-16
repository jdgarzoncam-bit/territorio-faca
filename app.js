let map = null;
let geojsonLayer = null;
let datosOriginales = null;
let searchMarker = null;
let capaSeleccionada = null;
let barriosFiltroEstado = {};

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

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Cartografía Territorial'
    }).addTo(map);

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
                '<p style="color: red; font-size: 0.8rem;">Error al cargar barrios.geojson.</p>';
        });

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

    // Manejo de "Seleccionar todo" para Secretarías y Población
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

                // Si el barrio está desmarcado individualmente, se oculta
                if (barriosFiltroEstado[nombreBarrio] === false) {
                    return false;
                }
                return true;
            },
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: 6,
                    fillColor: "#005a9e",
                    color: "#ffffff",
                    weight: 1.5,
                    opacity: 1,
                    fillOpacity: 0.85
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
                        capaSeleccionada.setStyle({ fillColor: "#005a9e", radius: 6 });
                    }
                    capaSeleccionada = e.target;
                    capaSeleccionada.setStyle({
                        fillColor: "#e67e22",
                        radius: 10
                    });

                    mostrarFichaTerritorial(feature, nombreBarrio);
                });
            }
        }).addTo(map);
    }

    function mostrarFichaTerritorial(feature, nombreBarrio, distanciaTexto = null) {
        const p = feature.properties || {};
        let htmlDistancia = distanciaTexto ? `<div class="ficha-item" style="color: #2b6cb0; font-weight: bold;">📍 ${distanciaTexto}</div>` : '';
        
        document.getElementById('fichaDetalle').innerHTML = `
            <h3>${nombreBarrio}</h3>
            ${htmlDistancia}
            <div class="ficha-item"><strong>Zona:</strong> ${p.comuna_zona || 'Facatativá'}</div>
            <div class="ficha-item"><strong>Presidente JAC:</strong> ${p.jac_presidente || 'Por registrar'}</div>
            <div class="ficha-item"><strong>Líder Zonal:</strong> ${p.lider_zonal || 'Por registrar'}</div>
            <div class="ficha-item"><strong>Edificación / Infraestructura:</strong> ${p.infraestructura || 'Equipamiento urbano'}</div>
            <div class="ficha-item" style="margin-top:8px; padding-top:6px; border-top:1px dashed #cbd5e0;"><strong>🗳️ Puesto de Votación Más Cercano:</strong><br>${p.puesto_votacion || 'Por asignar'}</div>
        `;
    }

    document.querySelectorAll('.chk-poblacion, .chk-sec').forEach(checkbox => {
        checkbox.addEventListener('change', actualizarMapa);
    });

    // Búsqueda inteligente: Direcciones, lugares y cálculo del punto más cercano en el GeoJSON
    function realizarBusqueda() {
        const query = document.getElementById('searchInput').value.trim();
        if (!query) return;

        let encontradoLocalmente = false;

        if (datosOriginales && datosOriginales.features) {
            const coincidencia = datosOriginales.features.find((f, idx) => {
                const nom = obtenerNombreBarrio(f, idx);
                return nom.toLowerCase().includes(query.toLowerCase());
            });

            if (coincidencia) {
                const coords = coincidencia.geometry.coordinates;
                map.setView([coords[1], coords[0]], 16);
                
                // Resaltar en el mapa
                geojsonLayer.eachLayer(layer => {
                    if (layer.feature === coincidencia) {
                        if (capaSeleccionada) capaSeleccionada.setStyle({ fillColor: "#005a9e", radius: 6 });
                        capaSeleccionada = layer;
                        layer.setStyle({ fillColor: "#e67e22", radius: 10 });
                    }
                });

                const nombreBarrio = obtenerNombreBarrio(coincidencia, datosOriginales.features.indexOf(coincidencia));
                mostrarFichaTerritorial(coincidencia, nombreBarrio);
                encontradoLocalmente = true;
                return;
            }
        }

        // Si es una dirección o lugar externo (Nominatim), calculamos el sector/puesto más cercano
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Facatativá, Cundinamarca")}`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);
                    
                    map.setView([lat, lon], 16);

                    if (searchMarker) {
                        map.removeLayer(searchMarker);
                    }
                    searchMarker = L.marker([lat, lon]).addTo(map)
                        .bindPopup(`<b>${data[0].display_name}</b>`)
                        .openPopup();

                    // Buscar el barrio o puesto de votación más cercano en los 125 puntos cargados
                    let menorDistancia = Infinity;
                    let puntoCercano = null;
                    let nombreCercano = "";

                    datosOriginales.features.forEach((feat, idx) => {
                        const coords = feat.geometry.coordinates; // [lon, lat]
                        const d = Math.pow(coords[1] - lat, 2) + Math.pow(coords[0] - lon, 2);
                        if (d < menorDistancia) {
                            menorDistancia = d;
                            puntoCercano = feat;
                            nombreCercano = obtenerNombreBarrio(feat, idx);
                        }
                    });

                    if (puntoCercano) {
                        mostrarFichaTerritorial(puntoCercano, nombreCercano, `Sector más cercano a la búsqueda: ${nombreCercano}`);
                    }

                } else {
                    alert("No se encontró la ubicación exacta en Facatativá.");
                }
            })
            .catch(err => console.error("Error en la búsqueda externa:", err));
    }

    document.getElementById('searchBtn').addEventListener('click', realizarBusqueda);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') realizarBusqueda();
    });

    setTimeout(() => { map.invalidateSize(); }, 200);
}