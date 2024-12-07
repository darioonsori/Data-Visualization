// Set the dimensions of the map
const mapWidth = 960;
const mapHeight = 600;

// Create the SVG container for the map
const svgDensityMap = d3
  .select("#mapDensity")
  .append("svg")
  .attr("width", mapWidth)
  .attr("height", mapHeight);

// Load GeoJSON and CSV data
Promise.all([
  d3.json("data/all.geojson"), // GeoJSON file for country boundaries
  d3.csv("data/annual-co2-emissions-per-country.csv"), // CSV file for total CO₂ emissions
  d3.csv("data/land.csv") // CSV file for country areas
])
  .then(([geoData, emissionsData, rawAreaData]) => {
    // Filter emissions dataset for the desired year (e.g., 2018)
    const year = 2018;
    const filteredEmissionsData = emissionsData.filter(
      (d) => +d.Year === year && d.Code
    );

    // Map emissions data to a dictionary
    const emissionMap = new Map();
    filteredEmissionsData.forEach((d) => {
      if (d.Code && d.Code !== "-99" && !d.Code.startsWith("OWID")) {
        emissionMap.set(d.Code, +d["Annual CO₂ emissions"]);
      }
    });

    console.log("Emissions map:", emissionMap);

    // Parse and filter area data
    const areaData = rawAreaData
      .filter((d) => d["Country Code"] && !isNaN(d[year])) // Only valid rows
      .map((d) => ({
        countryCode: d["Country Code"],
        area: +d[year] // Convert area to number
      }));

    console.log("Area data dopo parsing:", areaData);

    // Map area data to a dictionary
    const areaMap = new Map();
    areaData.forEach((d) => {
      areaMap.set(d.countryCode, d.area);
    });

    console.log("Area map:", areaMap);

    // Calculate CO₂ emission density (emissions per area)
    const densityMap = new Map();
    emissionMap.forEach((emission, code) => {
      const area = areaMap.get(code);
      if (area) {
        densityMap.set(code, emission / area); // Emission density = emissions / area
      }
    });

    console.log("Density data:", densityMap);

    // Filter GeoJSON features for valid country codes
    const validFeatures = geoData.features.filter((d) =>
      densityMap.has(d.properties.ISO_A3)
    );

    console.log("Valid features for the map:", validFeatures);

    // Calculate the maximum density value
    const maxDensity = d3.max(Array.from(densityMap.values()));
    const adjustedMaxDensity = Math.ceil(maxDensity / 10) * 10; // Round up to nearest multiple of 10

    // Define the color scale using a linear scale
    const densityColorScale = d3
      .scaleSequential(d3.interpolateYlGnBu)
      .domain([0, adjustedMaxDensity]);

    // Draw the map using GeoJSON data
    svgDensityMap
      .selectAll("path")
      .data(validFeatures)
      .enter()
      .append("path")
      .attr(
        "d",
        d3.geoPath().projection(d3.geoMercator().fitSize([mapWidth, mapHeight], geoData))
      )
      .attr("fill", (d) => {
        const density = densityMap.get(d.properties.ISO_A3);
        return density ? densityColorScale(density) : "#ccc"; // Grey for missing data
      })
      .attr("stroke", "#333")
      .on("mouseover", (event, d) => {
        const density = densityMap.get(d.properties.ISO_A3);
        d3.select("#tooltip")
          .style("visibility", "visible")
          .text(
            `${d.properties.NAME}: ${
              density ? density.toFixed(2) : "Data not available"
            } tons/km² in 2018`
          );
      })
      .on("mousemove", (event) => {
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

    const legendScale = d3
      .scaleLinear()
      .domain([0, adjustedMaxDensity])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(5, ".0f");

    const legend = svgDensityMap
      .append("g")
      .attr("transform", `translate(20, ${mapHeight - 40})`);

    const legendData = d3.range(0, adjustedMaxDensity, adjustedMaxDensity / 9);

    legend
      .selectAll("rect")
      .data(legendData)
      .enter()
      .append("rect")
      .attr("x", (d) => legendScale(d))
      .attr("width", legendWidth / legendData.length)
      .attr("height", legendHeight)
      .style("fill", (d) => densityColorScale(d));

    legend
      .append("g")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(legendAxis);
  })
  .catch((error) => {
    console.error("Error loading the data:", error);
  });
