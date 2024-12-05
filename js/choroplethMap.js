Promise.all([
  d3.json("data/custom.geo.json"), // Path al GeoJSON
  d3.csv("data/co-emissions-per-capita/co-emissions-per-capita.csv") // Path al CSV
]).then(([geoData, csvData]) => {
  const emissionsData = {};
  csvData.forEach(row => {
    emissionsData[row.Country] = +row["2018"]; // Assumi che "2018" sia la colonna corretta
  });

  // Normalizza i nomi dei paesi
  const countryNameMap = {
    "United States of America": "United States",
    "Russian Federation": "Russia",
    "Czech Republic": "Czechia"
    // Aggiungi altre corrispondenze necessarie
  };

  geoData.features.forEach(feature => {
    const countryName = countryNameMap[feature.properties.name] || feature.properties.name;
    feature.properties.emissions = emissionsData[countryName] || 0;

    if (!emissionsData[countryName]) {
      console.log("No data for country:", countryName); // Debug
    }
  });

  createChoroplethMap(geoData);
}).catch(error => {
  console.error("Errore durante il caricamento dei dati:", error);
});

function createChoroplethMap(geoData) {
  const width = 960;
  const height = 500;

  const colorScale = d3.scaleSequential(d3.interpolateReds)
    .domain([0, d3.max(geoData.features, d => d.properties.emissions)]);

  const svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

  const projection = d3.geoNaturalEarth1()
    .fitSize([width, height], geoData);

  const path = d3.geoPath().projection(projection);

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "white")
    .style("border", "1px solid black")
    .style("border-radius", "5px")
    .style("padding", "5px");

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
