(() => {
// Set the dimensions and margins of the map
const width = 960;
const height = 600;

// Create SVG container
const svg = d3.select("#density-map")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Load data
Promise.all([
  d3.json("data/all.geojson"), // GeoJSON file
  d3.csv("data/annual-co2-emissions-per-country.csv"), // Emissions file
  d3.csv("data/land.csv") // Land area file
]).then(([geoData, emissionsData, landData]) => {
  // Prepare data mappings
  const emissionsMap = new Map();
  emissionsData.forEach(d => {
    emissionsMap.set(d["Country"], +d["2018"]); // Adjust column name if different
  });

  const landMap = new Map();
  landData.forEach(d => {
    landMap.set(d["Country Name"], +d["2018"]); // Adjust column name if different
  });

  // Calculate densities
  const densities = {};
  geoData.features.forEach(feature => {
    const country = feature.properties.ADMIN; // Adjust property name if different
    const emissions = emissionsMap.get(country);
    const land = landMap.get(country);
    if (emissions && land) {
      densities[country] = emissions / land;
    }
  });

  // Define color scale
  const colorScale = d3.scaleSequential(d3.interpolateReds)
    .domain([0, d3.max(Object.values(densities))]);

  // Define projection and path
  const projection = d3.geoMercator().fitSize([width, height], geoData);
  const path = d3.geoPath().projection(projection);

  // Define tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "white")
    .style("border", "1px solid black")
    .style("padding", "5px")
    .style("border-radius", "3px");

  // Draw the map
  svg.selectAll("path")
    .data(geoData.features)
    .join("path")
    .attr("d", path)
    .attr("fill", d => {
      const country = d.properties.ADMIN; // Adjust property name if different
      const density = densities[country];
      return density ? colorScale(density) : "#ccc"; // Default color for missing data
    })
    .attr("stroke", "#000")
    .on("mouseover", (event, d) => {
      const country = d.properties.ADMIN;
      const density = densities[country];
      const emissions = emissionsMap.get(country);
      tooltip.style("visibility", "visible")
        .html(`Country: ${country}<br>Total Emissions: ${emissions || "N/A"}`);
    })
    .on("mousemove", event => {
      tooltip.style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"));
});
})();
