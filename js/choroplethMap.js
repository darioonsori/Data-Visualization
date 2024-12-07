// Set dimensions of the map for choropleth map (per capita emissions)
const mapWidthA = 960;
const mapHeightA = 600;

// Create the SVG container for the map
const svg = d3.select("#map")
    .append("svg")
    .attr("width", mapWidthA)
    .attr("height", mapHeightA);

// Load GeoJSON and CSV data
Promise.all([
    d3.json("data/all.geojson"), // GeoJSON file for country boundaries
    d3.csv("data/annual-co2-emissions-per-country.csv") // CSV file for CO₂ emissions
]).then(([geoData, csvData]) => {
    // Filter the dataset for the desired year (e.g., 2018)
    const year = 2018;
    const filteredData = csvData.filter(d => +d.Year === year);

    // Map emissions data to a dictionary
    const emissionData = new Map();
    filteredData.forEach(d => {
        if (d.Code && d.Code !== "-99" && !d.Code.startsWith("OWID")) {
            emissionData.set(d.Code, +d['Annual CO₂ emissions']);
        }
    });

    // Extract valid country codes
    const geoCodes = geoData.features.map(d => d.properties.ISO_A3);
    const validGeoCodes = geoCodes.filter(code => code !== '-99' && emissionData.has(code));

    // Calculate the maximum value of CO₂ emissions
    const maxEmission = d3.max(Array.from(emissionData.values()));

    // Define the color scale (logarithmic scale for better visual representation)
    const colorScale = d3.scaleLog()
        .domain([1, maxEmission]) // Avoid log(0) by starting at 1
        .range(["#f7fbff", "#08306b"]); // Blue color scale

    // Define projection and path generator
    const projection = d3.geoMercator()
        .fitSize([mapWidthA, mapHeightA], geoData);
    const path = d3.geoPath().projection(projection);

    // Draw the map using GeoJSON data
    svg.selectAll("path")
        .data(geoData.features.filter(d => validGeoCodes.includes(d.properties.ISO_A3) && d.properties.NAME !== "Antarctica"))
        .enter().append("path")
        .attr("d", path)
        .attr("fill", d => {
            const emission = emissionData.get(d.properties.ISO_A3);
            return emission ? colorScale(emission) : "#ccc"; // Grey for missing data
        })
        .attr("stroke", "#333")
        .on("mouseover", (event, d) => {
            const emission = emissionData.get(d.properties.ISO_A3);
            d3.select("#tooltip")
                .style("visibility", "visible")
                .text(`${d.properties.NAME}: ${emission ? emission.toLocaleString() : "Data not available"} tons`);
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
        .domain([1, maxEmission])
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(5, ".0s").tickFormat(d3.format(",.0f"));

    const legend = svg.append("g")
        .attr("transform", `translate(20, ${mapHeightA - 40})`);

    const legendData = d3.range(1, maxEmission, maxEmission / 10);

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
