// Path to data files
const geoJsonUrl = 'data/custom.geo.json';
const emissionsCsvUrl = 'data/co-emissions-per-capita/co-emissions-per-capita.csv';

// Initialize map
const width = 960, height = 600;
const svg = d3.select("#map").append("svg")
  .attr("width", width)
  .attr("height", height);

const projection = d3.geoNaturalEarth1().scale(150).translate([width / 2, height / 2]);
const path = d3.geoPath().projection(projection);

const colorScale = d3.scaleQuantize()
  .domain([0, 50]) // Adjust domain based on your data range
  .range(d3.schemeBlues[9]);

// Load data
Promise.all([
  d3.json(geoJsonUrl),
  d3.csv(emissionsCsvUrl)
]).then(([geoJson, emissionsData]) => {
  // Create a mapping of country codes to emissions
  const emissionsMap = {};
  emissionsData.forEach(d => {
    emissionsMap[d['Country Code']] = +d['2018']; // Adjust key and value based on your CSV
  });

  // Bind data to GeoJSON
  geoJson.features.forEach(feature => {
    const countryCode = feature.properties.iso_a3;
    feature.properties.emissions = emissionsMap[countryCode] || 0;
  });

  // Draw map
  svg.selectAll("path")
    .data(geoJson.features)
    .enter().append("path")
    .attr("d", path)
    .attr("fill", d => colorScale(d.properties.emissions))
    .attr("stroke", "#999")
    .on("mouseover", (event, d) => {
      const tooltip = d3.select("#tooltip");
      tooltip.style("visibility", "visible")
        .text(`${d.properties.name}: ${d.properties.emissions || 'No Data'} t CO₂/cap`);
    })
    .on("mousemove", (event) => {
      d3.select("#tooltip")
        .style("top", `${event.pageY + 10}px`)
        .style("left", `${event.pageX + 10}px`);
    })
    .on("mouseout", () => {
      d3.select("#tooltip").style("visibility", "hidden");
    });
}).catch(error => console.error("Error loading data:", error));
