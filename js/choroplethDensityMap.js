// Set the dimensions of the map
const mapWidth = 960;
const mapHeight = 600;

// Create the SVG container for the map
const svgDensityMap = d3
  .select("#mapDensity")
  .append("svg")
  .attr("width", mapWidth)
  .attr("height", mapHeight);


// Load GeoJSON and CSV data
Promise.all([
  d3.json("data/all.geojson"), // GeoJSON file for country boundaries
  d3.csv("data/land.csv"), // CSV file for area data
  d3.csv("data/annual-co2-emissions-per-country.csv") // CSV file for emissions data
]).then(([geoData, rawAreaData, rawEmissionData]) => {
  // Debug: Log the first few rows of rawAreaData
  console.log("Raw area data sample (first 10 rows):", rawAreaData.slice(0, 10));

  // Debug: Log column names to verify structure
  console.log("Column names in area CSV:", Object.keys(rawAreaData[0]));

  // Debug: Log column names in emissions CSV
  console.log("Column names in emissions CSV:", Object.keys(rawEmissionData[0]));

  const year = 2018; // Year of interest

  // Filter emissions data for the selected year
  const filteredEmissionData = rawEmissionData.filter((d) => +d.Year === year);
  const emissionMap = new Map();
  filteredEmissionData.forEach((d) => {
    if (d.Code && !d.Code.startsWith("OWID")) {
      emissionMap.set(d.Code, +d['Annual CO₂ emissions']);
    }
  });

  // Debug: Log the emission map to ensure correctness
  console.log("Emissions map:", emissionMap);

  // Guess column names for area data based on raw data inspection
  const areaCodeColumn = "Country Code"; // Replace with the correct column name if different
  const areaValueColumn = "2018"; // Replace with the correct column name if different

  const areaData = rawAreaData
    .filter((d) => d[areaCodeColumn] && !isNaN(d[areaValueColumn])) // Adjust column names based on actual CSV structure
    .map((d) => ({
      countryCode: d[areaCodeColumn],
      area: +d[areaValueColumn]
    }));

  // Debug: Log parsed area data
  console.log("Area data dopo parsing:", areaData);

  const areaMap = new Map();
  areaData.forEach((d) => {
    areaMap.set(d.countryCode, d.area);
  });

  // Debug: Log the area map to check for issues
  console.log("Area map:", areaMap);

  // Calculate emissions density (emissions per unit area)
  const densityData = new Map();
  emissionMap.forEach((emissions, code) => {
    const area = areaMap.get(code);
    if (area) {
      densityData.set(code, emissions / area);
    }
  });

  // Debug: Log density data to ensure calculations are correct
  console.log("Density data:", densityData);

  // Filter GeoJSON data to include only valid features
  const validFeatures = geoData.features.filter((d) =>
    densityData.has(d.properties.ISO_A3)
  );

  // Debug: Log valid features to ensure proper filtering
  console.log("Valid features for the map:", validFeatures);

  // Define color scale for the density data
  const maxDensity = d3.max(Array.from(densityData.values()));
  const colorScale = d3.scaleSequential(d3.interpolateYlGnBu).domain([0, maxDensity]);

  // Draw the map
  svg.selectAll("path")
    .data(validFeatures)
    .enter().append("path")
    .attr("d", d3.geoPath().projection(d3.geoMercator().fitSize([width, height], geoData)))
    .attr("fill", (d) => {
      const density = densityData.get(d.properties.ISO_A3);
      return density ? colorScale(density) : "#ccc"; // Grey for missing data
    })
    .attr("stroke", "#333")
    .on("mouseover", (event, d) => {
      const density = densityData.get(d.properties.ISO_A3);
      d3.select("#tooltip")
        .style("visibility", "visible")
        .text(`${d.properties.NAME}: ${density ? density.toFixed(2) : "Data not available"} tons/km² in ${year}`);
    })
    .on("mousemove", (event) => {
      d3.select("#tooltip")
        .style("top", `${event.pageY + 5}px`)
        .style("left", `${event.pageX + 5}px`);
    })
    .on("mouseout", () => {
      d3.select("#tooltip").style("visibility", "hidden");
    });

  // Add legend for density
  const legendWidth = 300;
  const legendHeight = 10;
  const legendScale = d3.scaleLinear()
    .domain([0, maxDensity])
    .range([0, legendWidth]);
  const legendAxis = d3.axisBottom(legendScale).ticks(5, ".2s");
  const legend = svg.append("g")
    .attr("transform", `translate(20, ${height - 40})`);
  legend.selectAll("rect")
    .data(d3.range(0, maxDensity, maxDensity / 9))
    .enter().append("rect")
    .attr("x", (d) => legendScale(d))
    .attr("width", legendWidth / 10)
    .attr("height", legendHeight)
    .style("fill", (d) => colorScale(d));
  legend.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis);
}).catch((error) => {
  console.error("Error loading the data:", error);
});
