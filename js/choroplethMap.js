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
  d3.json("data/all.geojson"), // File GeoJSON
  d3.csv("data/co-emissions-per-capita/co-emissions-per-capita.csv") // File CSV
]).then(([geoData, csvData]) => {
  // Mappa delle emissioni con debug dei codici mancanti
  const emissionData = new Map();
  csvData.forEach(d => {
    emissionData.set(d.Code, +d['Annual CO₂ emissions (per capita)']);
  });

  const geoCodes = geoData.features.map(d => d.properties.ISO_A3);
  const csvCodes = Array.from(emissionData.keys());
  const missingInCsv = geoCodes.filter(code => !csvCodes.includes(code));
  const missingInGeo = csvCodes.filter(code => !geoCodes.includes(code));

  console.log("Codici mancanti nel CSV:", missingInCsv);
  console.log("Codici mancanti nel GeoJSON:", missingInGeo);

  // Filtra i codici non validi
  const validGeoCodes = geoCodes.filter(code => code !== '-99' && !code.startsWith('OWID'));

  // Calibra il massimo valore di emissione
  const maxEmission = d3.max(csvData, d => +d['Annual CO₂ emissions (per capita)']);
  const colorScale = d3.scaleSequentialLog(d3.interpolateReds)
    .domain([1, maxEmission]);

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
      return emission ? colorScale(emission) : "#ccc";
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

  // Aggiungi una legenda
  const legendWidth = 300;
  const legendHeight = 10;

  const legendScale = d3.scaleLog()
    .domain([1, maxEmission])
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale).ticks(5, ".0f");

  const legend = svg.append("g")
    .attr("transform", `translate(20, ${height - 40})`);

  const legendData = d3.range(1, maxEmission, (maxEmission - 1) / 9);

  legend.selectAll("rect")
    .data(legendData)
    .enter().append("rect")
    .attr("x", d => legendScale(d))
    .attr("width", legendWidth / legendData.length)
    .attr("height", legendHeight)
    .style("fill", d => colorScale(d));

  legend.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis);
}).catch(error => {
  console.error("Errore nel caricamento dei dati:", error);
});
