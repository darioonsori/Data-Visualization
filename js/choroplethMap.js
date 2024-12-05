// Carica i dati GeoJSON e CSV
Promise.all([
  d3.json("data/custom.geo.json"), // Path al tuo GeoJSON
  d3.csv("data/co-emissions-per-capita/co-emissions-per-capita.csv") // Path al tuo CSV
]).then(([geoData, csvData]) => {
  // Trasforma i dati CSV in un oggetto per un accesso più rapido
  const emissionsData = {};
  csvData.forEach(row => {
    emissionsData[row.Country] = +row["2018"]; // Assumi che la colonna per il 2018 sia etichettata "2018"
  });

  // Aggiungi il valore di emissioni per ciascun paese nel GeoJSON
  geoData.features.forEach(feature => {
    const countryName = feature.properties.name; // Nome del paese dal GeoJSON
    feature.properties.emissions = emissionsData[countryName] || 0; // Assegna 0 se non ci sono dati
  });

  // Crea la mappa
  createChoroplethMap(geoData);
}).catch(error => {
  console.error("Errore durante il caricamento dei dati:", error);
});

// Funzione per creare la mappa coropletica
function createChoroplethMap(geoData) {
  const width = 960;
  const height = 500;

  // Configura il colore
  const colorScale = d3.scaleSequential(d3.interpolateReds)
    .domain([0, d3.max(geoData.features, d => d.properties.emissions)]);

  // Crea un elemento SVG
  const svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

  // Proiezione geografica
  const projection = d3.geoNaturalEarth1()
    .fitSize([width, height], geoData);

  const path = d3.geoPath().projection(projection);

  // Tooltip per mostrare i dati
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "white")
    .style("border", "1px solid black")
    .style("border-radius", "5px")
    .style("padding", "5px");

  // Disegna i paesi
  svg.selectAll("path")
    .data(geoData.features)
    .join("path")
    .attr("d", path)
    .attr("fill", d => {
      const emissions = d.properties.emissions;
      return emissions ? colorScale(emissions) : "#ccc"; // Grigio per paesi senza dati
    })
    .attr("stroke", "#333")
    .on("mouseover", (event, d) => {
      tooltip.style("visibility", "visible")
        .text(`${d.properties.name}: ${d.properties.emissions || "No Data"} t CO₂/cap`);
    })
    .on("mousemove", event => {
      tooltip.style("top", (event.pageY + 5) + "px")
        .style("left", (event.pageX + 5) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("visibility", "hidden");
    });
}
