d3.json("data/custom.geo.json").then(function (geojson) {
  d3.csv("data/co-emissions-per-capita/co-emissions-per-capita.csv").then(function (csvData) {
    // Map the CSV data by ISO code for quick lookup
    const dataByCode = {};
    csvData.forEach(row => {
      dataByCode[row.Code] = +row["2018"]; // Assuming "2018" is the column for emissions
    });

    // Add emission data to GeoJSON features
    geojson.features.forEach(feature => {
      const isoCode = feature.properties.iso_a3;
      feature.properties.emissions = dataByCode[isoCode] || null; // Null if no data
    });

    // Create the map
    const svg = d3.select("body").append("svg")
      .attr("width", 960)
      .attr("height", 600);

    const projection = d3.geoNaturalEarth1().scale(150).translate([480, 300]);
    const path = d3.geoPath().projection(projection);

    const colorScale = d3.scaleSequential(d3.interpolateReds)
      .domain([0, d3.max(Object.values(dataByCode))]);

    svg.selectAll("path")
      .data(geojson.features)
      .enter().append("path")
      .attr("d", path)
      .attr("fill", d => {
        const value = d.properties.emissions;
        return value ? colorScale(value) : "#ccc"; // Gray for missing data
      })
      .attr("stroke", "#333")
      .on("mouseover", function (event, d) {
        const tooltip = d3.select("#tooltip");
        tooltip.style("visibility", "visible")
          .text(`${d.properties.name}: ${d.properties.emissions || "No data"}`);
      })
      .on("mousemove", function (event) {
        const tooltip = d3.select("#tooltip");
        tooltip.style("top", `${event.pageY + 10}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", function () {
        d3.select("#tooltip").style("visibility", "hidden");
      });

    // Add a tooltip
    d3.select("body").append("div")
      .attr("id", "tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid black")
      .style("padding", "5px")
      .style("border-radius", "5px")
      .style("visibility", "hidden");
  });
});
