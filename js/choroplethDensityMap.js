// Set the dimensions and margins of the map
const width = 960, height = 600;

const svg = d3.select("#density-map")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Define projection and path generator
const projection = d3.geoMercator()
  .scale(150)
  .translate([width / 2, height / 1.5]);
const path = d3.geoPath().projection(projection);

// Define the color scale
const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, 30]);

// Tooltip
const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("visibility", "hidden");

// Load the data
Promise.all([
  d3.json("data/all.geojson"),
  d3.csv("data/land.csv"),
  d3.csv("data/annual-co2-emissions-per-country.csv")
]).then(([geojson, landData, co2Data]) => {
  // Map data structures for easy access
  const landMap = new Map();
  landData.forEach(d => {
    landMap.set(d["Country Code"], +d["2018"]); // Extract area for 2018
  });

  const densityMap = new Map();
  co2Data.forEach(d => {
    if (d.Year === "2018") {
      densityMap.set(d.Code, +d["Annual CO₂ emissions (per capita)"]);
    }
  });

  // Bind data to the GeoJSON
  svg.selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => {
      const code = d.properties.ISO_A3;
      const area = landMap.get(code);
      const emissions = densityMap.get(code);
      if (!area || !emissions) {
        console.warn(`Missing data for country: ${d.properties.ADMIN}, Code: ${code}`);
        return "#ccc"; // Default color for missing data
      }
      const density = emissions / area;
      return colorScale(density);
    })
    .attr("stroke", "#333")
    .attr("stroke-width", 0.5)
    .on("mouseover", (event, d) => {
      const code = d.properties.ISO_A3;
      const country = d.properties.ADMIN;
      const area = landMap.get(code);
      const emissions = densityMap.get(code);
      const density = emissions && area ? emissions / area : null;

      tooltip.style("visibility", "visible")
        .html(`
          <strong>${country}</strong><br>
          Total Emissions Density: ${density ? density.toFixed(2) : "No data"}<br>
          Total Emissions: ${emissions ? emissions.toFixed(2) : "No data"}<br>
          Area: ${area ? area.toFixed(2) : "No data"} km²
        `);
    })
    .on("mousemove", event => {
      tooltip.style("top", (event.pageY + 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"));

  // Add a legend
  const legendWidth = 300, legendHeight = 10;
  const legendSvg = svg.append("g")
    .attr("transform", `translate(${width - legendWidth - 20}, ${height - 40})`);

  const legendScale = d3.scaleLinear()
    .domain(colorScale.domain())
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .ticks(5)
    .tickSize(-legendHeight);

  legendSvg.selectAll("rect")
    .data(d3.range(0, 1, 1 / legendWidth))
    .enter().append("rect")
    .attr("x", (d, i) => i)
    .attr("y", 0)
    .attr("width", 1)
    .attr("height", legendHeight)
    .attr("fill", d => colorScale(d * colorScale.domain()[1]));

  legendSvg.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis)
    .select(".domain").remove();
}).catch(error => console.error("Error loading or processing data:", error));
