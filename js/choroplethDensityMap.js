// Import the necessary files
Promise.all([
  d3.json("data/all.geojson"), // GeoJSON file with country polygons and areas
  d3.csv("data/land.csv"),              // CSV file with surface area data
  d3.csv("data/annual-co2-emissions-per-country.csv") // CSV file with CO2 emissions data
]).then(function ([geojson, landData, co2Data]) {
  // Prepare the container
  const widthDensity = 1000, height = 600;
  const svgDensity = d3.select("#density-map")
    .append("svg")
    .attr("width", widthDensity)
    .attr("height", svgDensity);

  // Set up the projection and path generator
  const projection = d3.geoNaturalEarth1()
    .fitSize([width, height], geojson);

  const path = d3.geoPath().projection(projection);

  // Merge data: Calculate emission density (total emissions / area)
  const landMap = {};
  landData.forEach(d => {
    landMap[d["Country Code"]] = +d["2018"]; // Use 2018 for land area
  });

  const densityMap = {};
  co2Data.forEach(d => {
    if (d.Year === "2018") { // Filter for the year 2018
      const code = d.Code;
      const emissions = +d["Annual CO₂ emissions (per capita)"];
      const area = landMap[code];
      if (area) {
        densityMap[code] = emissions / area; // Calculate density
      }
    }
  });

  // Find the max density for the color scale
  const maxDensity = d3.max(Object.values(densityMap));

  // Define the color scale
  const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
    .domain([0, maxDensity]);

  // Add the tooltip
  const tooltip = d3.select("#density-map")
    .append("div")
    .attr("class", "tooltip")
    .style("visibility", "hidden");

  // Draw the map
  svg.selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => {
      const code = d.properties.ISO_A3; // Use ISO_A3 for country code matching
      const density = densityMap[code];
      return density ? colorScale(density) : "#ccc"; // Gray for missing data
    })
    .attr("stroke", "black")
    .on("mouseover", function (event, d) {
      const code = d.properties.ISO_A3;
      const density = densityMap[code];
      const country = d.properties.ADMIN;

      tooltip.style("visibility", "visible")
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px")
        .html(`<strong>${country}</strong><br>Density: ${density ? density.toFixed(2) : "N/A"}`);
    })
    .on("mousemove", function (event) {
      tooltip.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");
    })
    .on("mouseout", function () {
      tooltip.style("visibility", "hidden");
    });

  // Add a legend
  const legendWidth = 300, legendHeight = 10;
  const legendSvg = svg.append("g")
    .attr("transform", `translate(${width - legendWidth - 20}, ${height - 40})`);

  const legendScale = d3.scaleLinear()
    .domain([0, maxDensity])
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .ticks(5);

  const legendGradient = legendSvg.append("defs")
    .append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%");

  legendGradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", d3.interpolateYlOrRd(0));

  legendGradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", d3.interpolateYlOrRd(1));

  legendSvg.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");

  legendSvg.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis);
}).catch(function (error) {
  console.error("Error loading files:", error);
});
