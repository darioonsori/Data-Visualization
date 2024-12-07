// Set dimensions of the map for density map (emissions per unit area)
const mapWidthB = 960;
const mapHeightB = 600;

// Create the SVG container for the map
const svgDensityMap = d3.select("#density-map")
    .append("svg")
    .attr("width", mapWidthB)
    .attr("height", mapHeightB);

// Load GeoJSON and CSV data
Promise.all([
    d3.json("data/all.geojson"), // GeoJSON file for country boundaries
    d3.csv("data/annual-co2-emissions-per-country.csv"), // CSV for CO₂ emissions
    d3.csv("data/land-area-km.csv") // CSV for land area
]).then(([geoData, emissionsData, landAreaData]) => {
    // Filter emissions data for the year 2018
    const emissionsYear = 2018;
    const emissionsMap = new Map(
        emissionsData
            .filter(d => +d.Year === emissionsYear && d.Code && !isNaN(+d["Annual CO₂ emissions"]))
            .map(d => [d.Code, +d["Annual CO₂ emissions"]])
    );

    // Filter land area data
    const landAreaMap = new Map(
        landAreaData
            .filter(d => d.Code && !isNaN(+d["Land area (sq. km)"]))
            .map(d => [d.Code, +d["Land area (sq. km)"]])
    );

    // Calculate CO₂ emissions density (emissions per square km)
    const densityData = new Map();
    emissionsMap.forEach((emission, code) => {
        const area = landAreaMap.get(code);
        if (area) {
            densityData.set(code, emission / area);
        }
    });

    // Filter valid GeoJSON features
    const validFeatures = geoData.features.filter(
        d => densityData.has(d.properties.ISO_A3) && d.properties.NAME !== "Antarctica"
    );

    // Define the color scale (logarithmic scale for better distribution)
    const maxDensity = d3.max(Array.from(densityData.values()));
    const colorScale = d3.scaleLog()
        .domain([1, maxDensity])
        .range(["#ffffcc", "#800026"]); // Yellow to red

    // Define projection and path generator
    const projection = d3.geoMercator()
        .fitSize([mapWidthB, mapHeightB], {
            type: "FeatureCollection",
            features: validFeatures,
        });
    const path = d3.geoPath().projection(projection);

    // Draw the map
    svgDensityMap.selectAll("path")
        .data(validFeatures)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", d => {
            const density = densityData.get(d.properties.ISO_A3);
            return density ? colorScale(density) : "#ccc"; // Grey for missing data
        })
        .attr("stroke", "#333")
        .on("mouseover", (event, d) => {
            const density = densityData.get(d.properties.ISO_A3);
            d3.select("#tooltip")
                .style("visibility", "visible")
                .text(`${d.properties.NAME}: ${density ? density.toFixed(2) : "Data not available"} tons/km²`);
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

    const legendScale = d3.scaleLog().domain([1, maxDensity]).range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(5, ".1s");

    const legend = svgDensityMap.append("g")
        .attr("transform", `translate(20, ${mapHeightB - 40})`);

    const legendData = d3.range(1, maxDensity, maxDensity / 10);

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
