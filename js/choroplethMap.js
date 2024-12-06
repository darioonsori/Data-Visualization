// Carica i dati CSV e GeoJSON
Promise.all([
    d3.csv("co-emissions-per-capita.csv"), // Carica il CSV
    d3.json("data/custom.geo.json")     // Carica il GeoJSON
]).then(([csvData, geoData]) => {
    // Crea un oggetto per accedere rapidamente ai dati del CSV per codice ISO
    const emissionsData = {};
    csvData.forEach(row => {
        const code = row.Code; // Assumi che il CSV abbia un campo "Code"
        const value = parseFloat(row["Annual CO₂ emissions (per capita)"]) || null; // Valore da usare
        if (code) {
            emissionsData[code] = emissionsData[code] || {}; // Inizializza il codice se non esiste
            emissionsData[code][row.Year] = value; // Usa anche l'anno come chiave per future mappe temporali
        }
    });

    // Normalizza i dati GeoJSON
    geoData.features.forEach(feature => {
        const isoCode = feature.properties.ISO_A3;
        // Assegna il valore di emissione, se disponibile, altrimenti null
        feature.properties.emissions = emissionsData[isoCode] || null;
    });

    // Verifica e logga i paesi mancanti
    geoData.features.forEach(feature => {
        const isoCode = feature.properties.ISO_A3;
        if (!emissionsData[isoCode]) {
            console.warn(`No data for country: ${feature.properties.NAME} (${isoCode})`);
        }
    });

    // Crea la mappa con D3
    createChoroplethMap(geoData);
}).catch(error => console.error(error));

// Funzione per creare la mappa coropletica
function createChoroplethMap(geoData) {
    const width = 960, height = 500;

    // Proiezione e generatore di path
    const projection = d3.geoNaturalEarth1()
        .scale(160)
        .translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    // Scala colori
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([0, 20]); // Personalizza il dominio in base ai tuoi dati

    // Crea il contenitore SVG
    const svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    // Disegna le aree
    svg.selectAll("path")
        .data(geoData.features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", d => {
            const emissions = d.properties.emissions ? d.properties.emissions[2020] : null; // Anno specifico
            return emissions ? colorScale(emissions) : "#ccc"; // Colore per valori null
        })
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5);

    // Aggiungi legenda (opzionale)
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 100}, ${height - 200})`);

    legend.selectAll("rect")
        .data(colorScale.ticks(5).map(t => colorScale(t)))
        .enter().append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", d => d);

    legend.selectAll("text")
        .data(colorScale.ticks(5))
        .enter().append("text")
        .attr("x", 30)
        .attr("y", (d, i) => i * 20 + 15)
        .text(d => d.toFixed(1));
}
