// Set the dimensions of the map
const mapWidth = 960;
const mapHeight = 600;

// Select the container and create the SVG
const densitySvg = d3.select("#density-map")
    .append("svg")
    .attr("width", mapWidth)
    .attr("height", mapHeight);

// Load GeoJSON and CSV data
Promise.all([
    d3.json("data/all.geojson"), // GeoJSON file for country boundaries
    d3.csv("data/annual-co2-emissions-per-country.csv"), // CSV for CO₂ emissions
    d3.csv("data/land-area-km.csv") // CSV for land area
]).then(([geoData, emissionsData, landAreaData]) => {
    // Filter data for the year 2018
    const emissionsYear = 2018;
    const emissionsMap = new Map(emissionsData
        .filter(d => +d.Year === emissionsYear && d.Code && !isNaN(+d['Annual CO₂ emissions']))
        .map(d => [d.Code, +d['Annual CO₂ emissions']]));

    const landAreaMap = new Map(landAreaData
        .filter(d => d.Code && !isNaN(+d['Land area (sq. km)']))
        .map(d => [d.Code, +d['Land area (sq. km)']]));

    // Calculate CO₂ emissions density (emissions per sq. km)
    const densityData = new Map();
    emissionsMap.forEach((emission, code) => {
        const area = landAreaMap.get(code);
        if (area) {
            densityData.set(code, emission / area);
        }
    });

    // Filter valid GeoJSON features
    const validFeatures = geoData.features.filter(d =>
        densityData.has(d.properties.ISO_A3) && d.properties.NAME !== "Antarctica"
    );

    console.log("Valid features for the map:", validFeatures);

    // Define the color scale
    const maxDensity = d3.max(Array.from(densityData.values()));
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
        .domain([0, maxDensity]);

    // Define the projection and path generator
    const projection = d3.geoMercator().fitSize([mapWidth, mapHeight], { type: "FeatureCollection", features: validFeatures });
    const path = d3.geoPath().projection(projection);

    // Draw the map
    densitySvg.selectAll("path")
        .data(validFeatures)
        .enter().append("path")
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
                .text(`${d.properties.NAME}: ${density ? density.toFixed(2) : "Data not available"} CO₂ per sq. km`);
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

    const legendScale = d3.scaleLinear()
        .domain([0, maxDensity])
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(5);

    const legend = densitySvg.append("g")
        .attr("transform", `translate(20, ${mapHeight - 40})`);

    const legendData = d3.range(0, maxDensity, maxDensity / 9);

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
});s
