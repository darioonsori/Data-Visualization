// Set the dimensions for the CO₂ density map
const densityWidth = 960;
const densityHeight = 600;

// Create the SVG container for the density map
const svgDensityMap = d3
  .select("#density-map")
  .append("svg")
  .attr("width", densityWidth)
  .attr("height", densityHeight);

// Load GeoJSON and emissions data
Promise.all([
  d3.json("data/all.geojson"), // GeoJSON file
  d3.csv("data/annual-co2-emissions-per-country.csv"), // CSV for emissions
  d3.csv("data/land-area-km.csv") // CSV for land area
]).then(([geoData, emissionsData, landAreaData]) => {
  const year = 2018;

  const emissionsMap = new Map(
    emissionsData
      .filter(d => +d.Year === year && d.Code && !isNaN(+d["Annual CO₂ emissions"]))
      .map(d => [d.Code, +d["Annual CO₂ emissions"]])
  );

  const landAreaMap = new Map(
    landAreaData.filter(d => d.Code && !isNaN(+d["Land area (sq. km)"])).map(d => [d.Code, +d["Land area (sq. km)"]])
  );

  const densityData = new Map();
  emissionsMap.forEach((emission, code) => {
    const area = landAreaMap.get(code);
    if (area) {
      densityData.set(code, emission / area);
    }
  });

  const validFeatures = geoData.features.filter(d =>
    densityData.has(d.properties.ISO_A3) && d.properties.NAME !== "Antarctica"
  );

  const maxDensity = d3.max(Array.from(densityData.values()));
  const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, maxDensity]);

  const projection = d3
    .geoMercator()
    .fitSize([densityWidth, densityHeight], { type: "FeatureCollection", features: validFeatures });
  const path = d3.geoPath().projection(projection);

  svgDensityMap
    .selectAll("path")
    .data(validFeatures)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => {
      const density = densityData.get(d.properties.ISO_A3);
      return density ? colorScale(density) : "#ccc";
    })
    .attr("stroke", "#333")
    .on("mouseover", (event, d) => {
      const density = densityData.get(d.properties.ISO_A3);
      d3.select("#tooltip")
        .style("visibility", "visible")
        .text(`${d.properties.NAME}: ${density ? density.toFixed(2) : "No data"} tons/km²`);
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
  const legendScale = d3.scaleLinear().domain([0, maxDensity]).range([0, legendWidth]);
  const legendAxis = d3.axisBottom(legendScale).ticks(5, ".0f");
  const legend = svgDensityMap.append("g").attr("transform", `translate(20, ${densityHeight - 40})`);
  const legendData = d3.range(0, maxDensity, maxDensity / 9);

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
