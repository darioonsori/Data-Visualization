Promise.all([
  d3.json("data/all.geojson"),
  d3.csv("data/co-emissions-per-capita/co-emissions-per-capita.csv")
]).then(([geoData, csvData]) => {
  // Mappa delle emissioni
  const emissionData = new Map();
  csvData.forEach(d => {
    emissionData.set(d.Code, +d['Annual CO₂ emissions (per capita)']);
  });

  // Filtra i codici validi
  const geoCodes = geoData.features.map(d => d.properties.ISO_A3);
  const csvCodes = Array.from(emissionData.keys());
  const validGeoCodes = geoCodes.filter(code => code !== '-99' && emissionData.has(code));
  const validCsvCodes = csvCodes.filter(code => geoCodes.includes(code));

  // Debug: codici mancanti dopo il filtro
  const missingInCsv = geoCodes.filter(code => !validCsvCodes.includes(code));
  const missingInGeo = csvCodes.filter(code => !validGeoCodes.includes(code));

  console.log("Codici mancanti nel CSV (dopo filtro):", missingInCsv);
  console.log("Codici mancanti nel GeoJSON (dopo filtro):", missingInGeo);

  // Calibra il massimo valore di emissione
  const maxEmission = d3.max(validCsvCodes.map(code => emissionData.get(code)));
  const colorScale = d3.scaleSequentialLog(d3.interpolateReds)
    .domain([1, maxEmission]);

  // Disegna i paesi
  svg.selectAll("path")
    .data(geoData.features.filter(d => validGeoCodes.includes(d.properties.ISO_A3)))
    .enter().append("path")
    .attr("d", d3.geoPath().projection(d3.geoMercator().fitSize([width, height], geoData)))
    .attr("fill", d => {
      const emission = emissionData.get(d.properties.ISO_A3);
      return emission ? colorScale(emission) : "#ccc";
    })
    .attr("stroke", "#333")
    .on("mouseover", (event, d) => {
      const emission = emissionData.get(d.properties.ISO_A3);
      d3.select("#tooltip")
        .style("visibility", "visible")
        .text(`${d.properties.NAME}: ${emission ? emission.toFixed(2) : "Data not available"} tons per capita`);
    })
    .on("mousemove", event => {
      d3.select("#tooltip")
        .style("top", `${event.pageY + 5}px`)
        .style("left", `${event.pageX + 5}px`);
    })
    .on("mouseout", () => {
      d3.select("#tooltip").style("visibility", "hidden");
    });

  // Legenda (rimane invariata)
  const legendScale = d3.scaleLog()
    .domain([1, maxEmission])
    .range([0, 300]);

  const legend = svg.append("g")
    .attr("transform", `translate(20, ${height - 40})`);

  const legendData = d3.range(1, maxEmission, (maxEmission - 1) / 9);

  legend.selectAll("rect")
    .data(legendData)
    .enter().append("rect")
    .attr("x", d => legendScale(d))
    .attr("width", 300 / legendData.length)
    .attr("height", 10)
    .style("fill", d => colorScale(d));

  legend.append("g")
    .attr("transform", "translate(0, 10)")
    .call(d3.axisBottom(legendScale).ticks(5, ".0f"));
}).catch(error => {
  console.error("Errore nel caricamento dei dati:", error);
});
