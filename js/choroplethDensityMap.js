(() => {
  // Set the dimensions of the map
  const width = 960;
  const height = 600;

  // Create the SVG container for the map
  const svg = d3.select("#density-map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Load GeoJSON and CSV data
  Promise.all([
    d3.json("data/all.geojson"), // GeoJSON file for country boundaries
    d3.csv("data/co-emissions-per-capita/co-emissions-per-capita.csv") // CSV file for CO₂ emissions data
  ]).then(([geoData, csvData]) => {
    // Map density data to a dictionary
    const densityData = new Map();
    csvData.forEach(d => {
      if (d.Code && d.Code !== "-99" && !d.Code.startsWith("OWID")) {
        // Calculate density: Emissions / Area (assumes AREA is in GeoJSON)
        const area = geoData.features.find(g => g.properties.ISO_A3 === d.Code)?.properties.AREA;
        if (area) {
          const density = +d['Annual CO₂ emissions (per capita)'] / area;
          densityData.set(d.Code, density);
        }
      }
    });

    // Extract country codes from GeoJSON and CSV
    const geoCodes = geoData.features.map(d => d.properties.ISO_A3);
    const csvCodes = Array.from(densityData.keys());

    // Filter valid codes
    const validGeoCodes = geoCodes.filter(code => code !== '-99' && densityData.has(code));
    const validCsvCodes = csvCodes.filter(code => geoCodes.includes(code));

    // Calculate the maximum value of density and adjust the range
    const maxDensity = d3.max(validCsvCodes.map(code => densityData.get(code)));
    const adjustedMax = Math.ceil(maxDensity / 10) * 10; // Round up to the nearest multiple of 10

    // Define the color scale using a logarithmic scale
    const colorScale = d3.scaleSequentialLog(d3.interpolateReds)
      .domain([1, adjustedMax]);

    // Draw the map using GeoJSON data
    svg.selectAll("path")
      .data(geoData.features.filter(d => validGeoCodes.includes(d.properties.ISO_A3)))
      .enter().append("path")
      .attr("d", d3.geoPath().projection(d3.geoMercator().fitSize([width, height], geoData)))
      .attr("fill", d => {
        const density = densityData.get(d.properties.ISO_A3);
        return density ? colorScale(density) : "#ccc"; // Grey for missing data
      })
      .attr("stroke", "#333")
      .on("mouseover", (event, d) => {
        const density = densityData.get(d.properties.ISO_A3);
        d3.select("#tooltip")
          .style("visibility", "visible")
          .text(`${d.properties.NAME}: ${density ? density.toFixed(2) : "Data not available"} units`);
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
    const legendWidth = 300;
    const legendHeight = 10;

    const legendScale = d3.scaleLog()
      .domain([1, adjustedMax])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(5, ".0f");

    const legend = svg.append("g")
      .attr("transform", `translate(20, ${height - 40})`);

    const legendData = d3.range(1, adjustedMax, (adjustedMax - 1) / 9);

    legend.selectAll("rect")
      .data(legendData)
      .enter().append("rect")
      .attr("x", d => legendScale(d))
      .attr("width", legendWidth / legendData.length)
      .attr("height", legendHeight)
      .style("fill", d => colorScale(d));

    legend.append("g")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(legendAxis);
  }).catch(error => {
    console.error("Error loading the data:", error);
  });
})();
