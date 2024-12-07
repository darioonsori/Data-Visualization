// Set the dimensions of the map
const densityWidth = 960; // Renamed to avoid conflict
const densityHeight = 600; // Renamed to avoid conflict

// Create the SVG container for the map
const svgDensityMap = d3.select("#density-map")
  .append("svg")
  .attr("width", densityWidth)
  .attr("height", densityHeight);

// Load GeoJSON, emissions, and area data
Promise.all([
  d3.json("data/all.geojson"), // GeoJSON file for country boundaries
  d3.csv("data/annual-co2-emissions-per-country.csv"), // Emissions data
  d3.csv("data/land.csv", d => ({
    countryCode: d['Country Code'],
    area: +d['2018'] // Extract area for the year 2018
  }))
]).then(([geoData, emissionsData, areaData]) => {
  // Filter emissions data for 2018
  const emissions2018 = emissionsData.filter(d => +d.Year === 2018);

  // Map emissions and area data by country code
  const emissionsMap = new Map();
  emissions2018.forEach(d => {
    if (d.Code) {
      emissionsMap.set(d.Code, +d['Annual CO₂ emissions']);
    }
  });

  const areaMap = new Map();
  areaData.forEach(d => {
    if (d.countryCode && d.area) {
      areaMap.set(d.countryCode, d.area);
    }
  });

  // Calculate density (emissions per km²) for each country
  const densityData = new Map();
  emissionsMap.forEach((emission, code) => {
    const area = areaMap.get(code);
    if (area) {
      densityData.set(code, emission / area); // Calculate density
    }
  });

  // Get max density for scaling
  const maxDensity = d3.max(Array.from(densityData.values()));

  // Define the color scale for density
  const densityColorScale = d3.scaleSequential(d3.interpolateViridis) // Renamed for clarity
    .domain([0, maxDensity]);

  // Draw the map using GeoJSON data
  svgDensityMap.selectAll("path")
    .data(geoData.features.filter(d => densityData.has(d.properties.ISO_A3)))
    .enter().append("path")
    .attr("d", d3.geoPath().projection(d3.geoMercator().fitSize([densityWidth, densityHeight], geoData)))
    .attr("fill", d => {
      const density = densityData.get(d.properties.ISO_A3);
      return density ? densityColorScale(density) : "#ccc"; // Grey for missing data
    })
    .attr("stroke", "#333")
    .on("mouseover", (event, d) => {
      const density = densityData.get(d.properties.ISO_A3);
      const name = d.properties.NAME;
      d3.select("#tooltip")
        .style("visibility", "visible")
        .html(`
          <strong>${name}</strong><br>
          Density: ${density ? density.toFixed(2) : "No data"} tons/km²
        `);
    })
    .on("mousemove", event => {
      d3.select("#tooltip")
        .style("top", `${event.pageY + 5}px`)
        .style("left", `${event.pageX + 5}px`);
    })
    .on("mouseout", () => {
      d3.select("#tooltip").style("visibility", "hidden");
    });

  // Add a legend for the color scale
  const densityLegendWidth = 300; // Renamed for clarity
  const densityLegendHeight = 10; // Renamed for clarity

  const densityLegendScale = d3.scaleLinear()
    .domain([0, maxDensity])
    .range([0, densityLegendWidth]);

  const densityLegendAxis = d3.axisBottom(densityLegendScale).ticks(5, ".2f");

  const densityLegend = svgDensityMap.append("g")
    .attr("transform", `translate(20, ${densityHeight - 40})`);

  const densityLegendData = d3.range(0, maxDensity, maxDensity / 9);

  densityLegend.selectAll("rect")
    .data(densityLegendData)
    .enter().append("rect")
    .attr("x", d => densityLegendScale(d))
    .attr("width", densityLegendWidth / densityLegendData.length)
    .attr("height", densityLegendHeight)
    .style("fill", d => densityColorScale(d));

  densityLegend.append("g")
    .attr("transform", `translate(0, ${densityLegendHeight})`)
    .call(densityLegendAxis);
}).catch(error => {
  console.error("Error loading the data:", error);
});
