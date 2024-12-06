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
  // Mappa delle emissioni di CO₂
  const emissionData = new Map();
  csvData.forEach(d => {
    emissionData.set(d.Code, +d['Annual CO₂ emissions (per capita)']);
  });

  // Configura la proiezione e il path generator
  const projection = d3.geoMercator().fitSize([width, height], geoData);
  const path = d3.geoPath().projection(projection);

  // Crea una scala di colori
  const maxEmission = d3.max(csvData, d => +d['Annual CO₂ emissions (per capita)']);
  const colorScale = d3.scaleSequential(d3.interpolateReds)
    .domain([0, maxEmission]);

  // Disegna i confini dei paesi
  svg.selectAll("path")
    .data(geoData.features)
    .enter().append("path")
    .attr("d", path)
    .attr("fill", d => {
      const emission = emissionData.get(d.properties.ISO_A3);
      return emission ? colorScale(emission) : "#ccc"; // Colore grigio per dati mancanti
    })
    .attr("stroke", "#333")
    .on("mouseover", (event, d) => {
      const emission = emissionData.get(d.properties.ISO_A3);
      d3.select("#tooltip")
        .style("visibility", "visible")
        .text(`${d.properties.NAME}: ${emission ? emission : "No data"} tons per capita`);
    })
    .on("mousemove", event => {
      d3.select("#tooltip")
        .style("top", `${event.pageY + 5}px`)
        .style("left", `${event.pageX + 5}px`);
    })
    .on("mouseout", () => {
      d3.select("#tooltip").style("visibility", "hidden");
    });
});
