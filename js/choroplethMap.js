// Imposta le dimensioni della mappa
const width = 960;
const height = 600;

// Crea l'elemento SVG
const svg = d3.select("#map")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Carica i dati GeoJSON e CSV
Promise.all([
  d3.json("data/all.geojson"), // Cambia "path/to" con il percorso reale del file GeoJSON
  d3.csv("data/co-emissions-per-capita/co-emissions-per-capita.csv") // Cambia "path/to" con il percorso reale del file CSV
]).then(([geoData, csvData]) => {
  // Debug: log dei dati caricati
  console.log("GeoJSON Data:", geoData);
  console.log("CSV Data:", csvData);

  // Crea un dizionario per mappare i dati di emissione
  const emissionData = new Map();
  csvData.forEach(d => {
    emissionData.set(d.Code, +d['Annual CO₂ emissions (per capita)']);
  });

  // Debug: verifica i codici ISO nel CSV e nel GeoJSON
  const geoCodes = geoData.features.map(d => d.properties.ISO_A3);
  const csvCodes = Array.from(emissionData.keys());
  const missingInCsv = geoCodes.filter(code => !csvCodes.includes(code));
  const missingInGeo = csvCodes.filter(code => !geoCodes.includes(code));

  console.log("Codici mancanti nel CSV:", missingInCsv);
  console.log("Codici mancanti nel GeoJSON:", missingInGeo);

  // Calcola il massimo valore di emissione
  const maxEmission = d3.max(csvData, d => +d['Annual CO₂ emissions (per capita)']);
  console.log("Massimo valore di emissione:", maxEmission);

  // Crea una scala di colori
  const colorScale = d3.scaleQuantize()
    .domain([0, maxEmission]) // Intervallo di valori
    .range(d3.schemeReds[9]); // Scala discreta con 9 livelli di colore

  // Disegna i paesi
  svg.selectAll("path")
    .data(geoData.features)
    .enter().append("path")
    .attr("d", d3.geoPath().projection(d3.geoMercator().fitSize([width, height], geoData)))
    .attr("fill", d => {
      const emission = emissionData.get(d.properties.ISO_A3);
      if (!emission) {
        console.log(`Dati mancanti per: ${d.properties.NAME} (${d.properties.ISO_A3})`);
      }
      return emission ? colorScale(emission) : "#ccc"; // Grigio per dati mancanti
    })
    .attr("stroke", "#333")
    .on("mouseover", (event, d) => {
      const emission = emissionData.get(d.properties.ISO_A3);
      d3.select("#tooltip")
        .style("visibility", "visible")
        .text(`${d.properties.NAME}: ${emission ? emission.toFixed(2) : "Data not available"} tons per capita`);
    })
    .on("mousemove", event => {
      d3.select("#tooltip")
        .style("top", `${event.pageY + 5}px`)
        .style("left", `${event.pageX + 5}px`);
    })
    .on("mouseout", () => {
      d3.select("#tooltip").style("visibility", "hidden");
    });

  // Aggiungi una legenda per la scala di colori
  const legendWidth = 300;
  const legendHeight = 10;

  const legendScale = d3.scaleLinear()
    .domain([0, maxEmission])
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .ticks(5);

  const legend = svg.append("g")
    .attr("transform", `translate(20, ${height - 40})`);

  legend.selectAll("rect")
    .data(colorScale.range().map(color => {
      const d = colorScale.invertExtent(color);
      if (!d[0]) d[0] = 0;
      if (!d[1]) d[1] = maxEmission;
      return d;
    }))
    .enter().append("rect")
    .attr("x", d => legendScale(d[0]))
    .attr("width", d => legendScale(d[1]) - legendScale(d[0]))
    .attr("height", legendHeight)
    .style("fill", d => colorScale(d[0]));

  legend.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis);
}).catch(error => {
  console.error("Errore nel caricamento dei dati:", error);
});
