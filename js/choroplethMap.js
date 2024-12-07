// Set the dimensions for the CO₂ per capita map
const mapWidth = 960;
const mapHeight = 600;

// Create the SVG container for the map
const svgMap = d3
  .select("#map")
  .append("svg")
  .attr("width", mapWidth)
  .attr("height", mapHeight);

// Load GeoJSON and emissions data
Promise.all([
  d3.json("data/all.geojson"), // GeoJSON file
  d3.csv("data/annual-co2-emissions-per-country.csv") // CSV file for emissions
]).then(([geoData, csvData]) => {
  const year = 2018;
  const emissionsMap = new Map(
    csvData
      .filter(d => +d.Year === year && d.Code && !isNaN(+d["Annual CO₂ emissions"]))
      .map(d => [d.Code, +d["Annual CO₂ emissions"]])
  );

  const validFeatures = geoData.features.filter(d =>
    emissionsMap.has(d.properties.ISO_A3) && d.properties.NAME !== "Antarctica"
  );

  const maxEmission = d3.max(Array.from(emissionsMap.values()));
  const colorScale = d3.scaleSequential(d3.interpolateYlGnBu).domain([0, maxEmission]);

  const projection = d3
    .geoMercator()
    .fitSize([mapWidth, mapHeight], { type: "FeatureCollection", features: validFeatures });
  const path = d3.geoPath().projection(projection);

  svgMap
    .selectAll("path")
    .data(validFeatures)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => {
      const emission = emissionsMap.get(d.properties.ISO_A3);
      return emission ? colorScale(emission) : "#ccc";
    })
    .attr("stroke", "#333")
    .on("mouseover", (event, d) => {
      const emission = emissionsMap.get(d.properties.ISO_A3);
      d3.select("#tooltip")
        .style("visibility", "visible")
        .text(`${d.properties.NAME}: ${emission ? emission.toLocaleString() : "No data"} tons of CO₂`);
    })
    .on("mousemove", event => {
      d3.select("#tooltip")
        .style("top", `${event.pageY + 5}px`)
        .style("left", `${event.pageX + 5}px`);
    })
    .on("mouseout", () => {
      d3.select("#tooltip").style("visibility", "hidden");
    });

  // Legend
  const legendWidth = 300;
  const legendHeight = 10;
  const legendScale = d3.scaleLinear().domain([0, maxEmission]).range([0, legendWidth]);
  const legendAxis = d3.axisBottom(legendScale).ticks(5, ".0f");
  const legend = svgMap.append("g").attr("transform", `translate(20, ${mapHeight - 40})`);
  const legendData = d3.range(0, maxEmission, maxEmission / 9);

  legend
    .selectAll("rect")
    .data(legendData)
    .enter()
    .append("rect")
    .attr("x", d => legendScale(d))
    .attr("width", legendWidth / legendData.length)
    .attr("height", legendHeight)
    .style("fill", d => colorScale(d));

  legend.append("g").attr("transform", `translate(0, ${legendHeight})`).call(legendAxis);
}).catch(error => console.error("Error loading data:", error));
