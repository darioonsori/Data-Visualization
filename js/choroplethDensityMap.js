(() => {
  // Caricamento dei file necessari
  Promise.all([
    d3.json("data/all.geojson"), // GeoJSON
    d3.csv("data/land.csv"), // Superficie
    d3.csv("data/annual-co2-emissions-per-country.csv") // Emissioni
  ]).then(([geoData, landData, emissionsData]) => {
    console.log("GeoJSON data:", geoData);
    console.log("Land data:", landData);
    console.log("Emissions data:", emissionsData);

    // Mappa per superficie e emissioni
    const landMap = new Map();
    const emissionMap = new Map();

    // Parsing land.csv
    landData.forEach(d => {
      const code = d["Country Code"];
      const area = +d["2018"]; // Assicurati che '2018' sia la colonna corretta
      if (code && !isNaN(area)) {
        landMap.set(code, area);
      } else {
        console.log(`Invalid land data: Code=${code}, Area=${area}`);
      }
    });
    console.log("Mapped land data:", landMap);

    // Parsing annual-co2-emissions-per-country.csv
    emissionsData.forEach(d => {
      const code = d.Code;
      const year = +d.Year;
      const emission = +d["Annual CO₂ emissions (per capita)"];
      if (code && year === 2018 && !isNaN(emission)) {
        emissionMap.set(code, emission);
      } else {
        console.log(`Invalid emission data: Code=${code}, Year=${year}, Emission=${emission}`);
      }
    });
    console.log("Mapped emission data:", emissionMap);

    // Calcolo densità
    const densityData = new Map();
    geoData.features.forEach(feature => {
      const countryCode = feature.properties.ISO_A3;
      const landArea = landMap.get(countryCode);
      const emissionValue = emissionMap.get(countryCode);

      if (landArea && emissionValue) {
        const density = emissionValue / landArea;
        densityData.set(countryCode, density);
      } else {
        console.warn(
          `Missing data for country: ${countryCode}, Land Area: ${landArea}, Emission: ${emissionValue}`
        );
      }
    });

    console.log("Density data:", densityData);

    // Estensione delle densità per la scala di colori
    const densityExtent = d3.extent([...densityData.values()]);
    console.log("Density extent:", densityExtent);

    // Configurazione del colore
    const colorScale = d3
      .scaleLinear()
      .domain([0, densityExtent[1]])
      .range(["white", "darkred"]);

    // Creazione della mappa
    const width = 960;
    const height = 500;

    const svg = d3
      .select("#density-map")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const projection = d3
      .geoMercator()
      .scale(130)
      .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection);

    // Tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "white")
      .style("border", "1px solid black")
      .style("border-radius", "5px")
      .style("padding", "5px");

    // Disegno delle feature
    svg
      .selectAll("path")
      .data(geoData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", d => {
        const countryCode = d.properties.ISO_A3;
        const density = densityData.get(countryCode);
        return density ? colorScale(density) : "#ccc";
      })
      .attr("stroke", "black")
      .on("mouseover", function (event, d) {
        const countryCode = d.properties.ISO_A3;
        const density = densityData.get(countryCode);
        tooltip
          .style("visibility", "visible")
          .html(
            `Country: ${d.properties.ADMIN}<br>Total Emissions Density: ${
              density ? density.toFixed(2) : "N/A"
            }`
          );
      })
      .on("mousemove", function (event) {
        tooltip
          .style("top", event.pageY + 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", function () {
        tooltip.style("visibility", "hidden");
      });

    // Legenda
    const legendWidth = 300;
    const legendHeight = 10;

    const legendSvg = svg
      .append("g")
      .attr("transform", `translate(${width / 2 - legendWidth / 2}, ${height - 30})`);

    const legendScale = d3
      .scaleLinear()
      .domain(colorScale.domain())
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(5);

    legendSvg
      .selectAll("rect")
      .data(d3.range(legendWidth))
      .enter()
      .append("rect")
      .attr("x", d => d)
      .attr("y", 0)
      .attr("width", 1)
      .attr("height", legendHeight)
      .attr("fill", d => colorScale(legendScale.invert(d)));

    legendSvg
      .append("g")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(legendAxis);
  });
})();
