(() => {
  const width = 960;
  const height = 600;

  const svg = d3.select("#density-map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  console.log("SVG created:", svg);

  console.log("Loading GeoJSON and CSV data...");
  Promise.all([
    d3.json("data/all_with_area.geojson"), // Updated GeoJSON with AREA
    d3.csv("data/co-emissions-per-capita/co-emissions-per-capita.csv")
  ]).then(([geoData, csvData]) => {
    console.log("GeoJSON Data:", geoData);
    console.log("CSV Data:", csvData);

    if (!geoData.features[0].properties.AREA) {
      console.error("GeoJSON does not have an AREA property. Please verify the file.");
      return;
    }

    const densityData = new Map();
    csvData.forEach(d => {
      if (d.Code && d.Code !== "-99" && !d.Code.startsWith("OWID")) {
        const feature = geoData.features.find(g => g.properties.ISO_A3 === d.Code);
        const area = feature?.properties.AREA || 1; // Fallback to 1 if area is missing
        const density = +d['Annual CO₂ emissions (per capita)'] / area;
        if (isNaN(density)) {
          console.warn(`NaN detected for Code: ${d.Code}, Area: ${area}, Emissions: ${d['Annual CO₂ emissions (per capita)']}`);
        }
        densityData.set(d.Code, density);
      }
    });

    console.log("Processed Density Data:", densityData);

    const geoCodes = geoData.features.map(d => d.properties.ISO_A3);
    const csvCodes = Array.from(densityData.keys());

    const validGeoCodes = geoCodes.filter(code => code !== '-99' && densityData.has(code));
    const validCsvCodes = csvCodes.filter(code => geoCodes.includes(code));

    console.log("Valid GeoJSON Codes:", validGeoCodes);
    console.log("Valid CSV Codes:", validCsvCodes);

    const maxDensity = d3.max(validCsvCodes.map(code => densityData.get(code)));
    const adjustedMax = Math.ceil(maxDensity / 10) * 10;

    console.log("Max Density Value:", maxDensity);
    console.log("Adjusted Max Density:", adjustedMax);

    const colorScale = d3.scaleSequentialLog(d3.interpolateReds)
      .domain([0.001, adjustedMax]); // Adjusted scale for small densities

    const featuresToDraw = geoData.features.filter(d => validGeoCodes.includes(d.properties.ISO_A3));
    console.log("Features to Draw:", featuresToDraw);

    svg.selectAll("path")
      .data(featuresToDraw)
      .enter().append("path")
      .attr("d", d3.geoPath().projection(d3.geoMercator().fitSize([width, height], geoData)))
      .attr("fill", d => {
        const density = densityData.get(d.properties.ISO_A3);
        return density ? colorScale(density) : "#ccc";
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

    const legendWidth = 300;
    const legendHeight = 10;

    const legendScale = d3.scaleLog()
      .domain([0.001, adjustedMax])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(5, ".0f");

    const legend = svg.append("g")
      .attr("transform", `translate(20, ${height - 40})`);

    const legendData = d3.range(0.001, adjustedMax, (adjustedMax - 0.001) / 9);

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
