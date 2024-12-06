(() => {
  const width = 960;
  const height = 600;

  const svg = d3.select("#density-map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const projection = d3.geoNaturalEarth1()
    .scale(160)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  const densityTooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "white")
    .style("border", "1px solid black")
    .style("border-radius", "5px")
    .style("padding", "5px");

  Promise.all([
    d3.json("data/all.geojson"),
    d3.csv("data/land.csv"),
    d3.csv("data/annual-co2-emissions-per-country.csv")
  ]).then(([geoData, landData, emissionsData]) => {
    console.log("GeoJSON data:", geoData);
    console.log("Land data:", landData);
    console.log("Emissions data:", emissionsData);

    const landMap = new Map();
    landData.forEach(d => {
      landMap.set(d["Country Code"], +d["2022"]);
    });
    console.log("Mapped land data:", landMap);

    const emissionMap = new Map();
    emissionsData.forEach(d => {
      if (d.Year === "2018") {
        emissionMap.set(d.Code, +d["Annual CO₂ emissions (per capita)"]);
      }
    });
    console.log("Mapped emission data:", emissionMap);

    const densityData = new Map();
    geoData.features.forEach(feature => {
      const countryCode = feature.properties.ISO_A3;
      const landArea = landMap.get(countryCode);
      const emissionValue = emissionMap.get(countryCode);

      if (landArea && emissionValue) {
        const density = emissionValue / landArea;
        densityData.set(countryCode, density);
        console.log(`Country: ${countryCode}, Land Area: ${landArea}, Emission: ${emissionValue}, Density: ${density}`);
      } else {
        console.log(`Missing data for country: ${countryCode}, Land Area: ${landArea}, Emission: ${emissionValue}`);
      }
    });

    const densityExtent = d3.extent(Array.from(densityData.values()));
    console.log("Density extent:", densityExtent);

    const colorScale = d3.scaleSequential()
      .domain(densityExtent)
      .interpolator(d3.interpolateReds);

    svg.selectAll("path")
      .data(geoData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", d => {
        const countryCode = d.properties.ISO_A3;
        const density = densityData.get(countryCode);
        return density ? colorScale(density) : "#ccc";
      })
      .attr("stroke", "#333")
      .attr("stroke-width", 0.5)
      .on("mouseover", (event, d) => {
        const countryName = d.properties.ADMIN;
        const countryCode = d.properties.ISO_A3;
        const density = densityData.get(countryCode);

        densityTooltip.style("visibility", "visible")
          .html(`
            <strong>${countryName}</strong><br>
            Total Emissions Density: ${density ? density.toFixed(2) : "N/A"}
          `);
      })
      .on("mousemove", (event) => {
        densityTooltip
          .style("top", (event.pageY + 15) + "px")
          .style("left", (event.pageX + 15) + "px");
      })
      .on("mouseout", () => {
        densityTooltip.style("visibility", "hidden");
      });
  }).catch(error => {
    console.error("Error loading data:", error);
  });
})();
