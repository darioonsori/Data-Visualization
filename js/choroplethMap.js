// Carica i file GeoJSON e CSV
Promise.all([
  d3.json("data/custom.geo.json"), // Percorso del file GeoJSON
  d3.csv("data/co-emissions-per-capita/co-emissions-per-capita.csv") // Percorso del file CSV
])
  .then(([geoData, csvData]) => {
    // Debug: Controlla i dati caricati
    console.log("GeoJSON Data:", geoData);
    console.log("CSV Data:", csvData);

    // Crea un oggetto per memorizzare le emissioni per paese
    const emissionsData = {};
    csvData.forEach(row => {
      emissionsData[row.Country] = +row["2018"]; // Converti i valori in numeri
    });

    // Debug: Controlla l'oggetto emissionsData
    console.log("Emissions Data:", emissionsData);

    // Aggiungi le emissioni come proprietà al GeoJSON
    geoData.features.forEach(feature => {
      const countryName = feature.properties.name; // Nome del paese nel GeoJSON
      feature.properties.emissions = emissionsData[countryName] || 0; // Aggiungi il dato o 0 se mancante

      // Debug: Mostra i paesi senza dati
      if (!emissionsData[countryName]) {
        console.log("No data for country:", countryName);
      }
    });

    // Crea la mappa choropleth
    createChoroplethMap(geoData);
  })
  .catch(error => {
    console.error("Errore durante il caricamento dei dati:", error);
  });

// Funzione per creare la mappa choropleth
function createChoroplethMap(geoData) {
  const width = 960;
  const height = 500;

  // Crea una scala dei colori
  const colorScale = d3.scaleSequential(d3.interpolateReds)
    .domain([0, d3.max(geoData.features, d => d.properties.emissions)]);

  // Crea una proiezione geografica
  const projection = d3.geoNaturalEarth1()
    .scale(160)
    .translate([width / 2, height / 2]);

  // Crea un generatore di percorsi geografici
  const path = d3.geoPath().projection(projection);

  // Aggiungi un elemento SVG alla pagina
  const svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

  // Aggiungi un gruppo per la mappa
  const mapGroup = svg.append("g");

  // Aggiungi i percorsi della mappa
  mapGroup.selectAll("path")
    .data(geoData.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => {
      const emissions = d.properties.emissions;
      return emissions ? colorScale(emissions) : "#ccc"; // Colore grigio se mancano i dati
    })
    .attr("stroke", "#000")
    .attr("stroke-width", 0.5)
    .on("mouseover", function (event, d) {
      d3.select("#tooltip")
        .style("visibility", "visible")
        .html(`<strong>${d.properties.name}</strong>: ${d.properties.emissions || "No Data"} t CO₂/cap`)
        .style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mousemove", function (event) {
      d3.select("#tooltip")
        .style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", function () {
      d3.select("#tooltip").style("visibility", "hidden");
    });

  // Aggiungi una legenda
  const legendWidth = 300;
  const legendHeight = 10;

  const legendGroup = svg.append("g")
    .attr("transform", `translate(${width / 2 - legendWidth / 2}, ${height - 50})`);

  const legendScale = d3.scaleLinear()
    .domain(colorScale.domain())
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .ticks(5)
    .tickFormat(d => `${d} t`);

  legendGroup.selectAll("rect")
    .data(d3.range(legendWidth))
    .enter()
    .append("rect")
    .attr("x", d => d)
    .attr("y", 0)
    .attr("width", 1)
    .attr("height", legendHeight)
    .attr("fill", d => colorScale(legendScale.invert(d)));

  legendGroup.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis);

  // Tooltip
  d3.select("body").append("div")
    .attr("id", "tooltip")
    .attr("class", "tooltip")
    .style("visibility", "hidden");
}
