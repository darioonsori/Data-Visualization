// Carica il file GeoJSON
fetch("data/custom.geo.json")
  .then(response => response.json())
  .then(geoData => {
    // Carica il file CSV
    d3.csv("data/co-emissions-per-capita/co-emissions-per-capita.csv").then(csvData => {
      // Filtra i dati CSV per un anno specifico (ad esempio, 2018)
      const year = "2018";
      const emissionsData = {};
      
      csvData.forEach(row => {
        if (row.Year === year) {
          emissionsData[row.Code] = +row["Annual CO₂ emissions (per capita)"];
        }
      });

      // Aggiunge le emissioni al GeoJSON utilizzando il codice ISO
      geoData.features.forEach(feature => {
        const isoCode = feature.properties.ISO_A3;
        feature.properties.emissions = emissionsData[isoCode] || null; // Assegna null se non ci sono dati
      });

      // Crea la mappa
      const svg = d3.select("svg");
      const projection = d3.geoMercator().scale(130).translate([480, 250]);
      const path = d3.geoPath().projection(projection);

      // Definisci una scala di colori
      const colorScale = d3.scaleQuantize()
        .domain([0, d3.max(Object.values(emissionsData))])
        .range(d3.schemeBlues[9]);

      // Disegna la mappa
      svg.selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", d => {
          const emissions = d.properties.emissions;
          return emissions ? colorScale(emissions) : "#ccc";
        })
        .attr("stroke", "#333")
        .on("mouseover", (event, d) => {
          const country = d.properties.NAME;
          const emissions = d.properties.emissions || "No data";
          d3.select("#tooltip")
            .style("opacity", 1)
            .html(`${country}: ${emissions} t CO₂/cap`);
        })
        .on("mousemove", (event) => {
          d3.select("#tooltip")
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 20 + "px");
        })
        .on("mouseout", () => {
          d3.select("#tooltip").style("opacity", 0);
        });

      // Tooltip
      d3.select("body").append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("opacity", 0);
    });
  });
