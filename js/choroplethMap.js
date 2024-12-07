// Set the dimensions of the map
const width = 960;
const height = 600;

// Create the SVG container for the map
const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Load GeoJSON and CSV data
Promise.all([
    d3.json("data/all.geojson"), // GeoJSON file for country boundaries
    d3.csv("data/annual-co2-emissions-per-country.csv") // CSV file for total CO₂ emissions
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

    // Extract country codes from GeoJSON and CSV
    const geoCodes = geoData.features.map(d => d.properties.ISO_A3);
    const csvCodes = Array.from(emissionData.keys());

    // Filter valid codes
    const validGeoCodes = geoCodes.filter(code => code !== '-99' && emissionData.has(code));
    const validCsvCodes = csvCodes.filter(code => geoCodes.includes(code));

    // Calculate the maximum value of CO₂ emissions
    const maxEmission = d3.max(validCsvCodes.map(code => emissionData.get(code)));

    // Define the color scale using a logarithmic scale
    const colorScale = d3.scaleLog()
        .domain([1, maxEmission]) // Start at 1 to avoid log(0)
        .range(["#f7fbff", "#08306b"]); // Using a blue scale for better distinction

    // Draw the map using GeoJSON data
    svg.selectAll("path")
        .data(geoData.features.filter(d => validGeoCodes.includes(d.properties.ISO_A3) && d.properties.NAME !== "Antarctica"))
        .enter().append("path")
        .attr("d", d3.geoPath().projection(d3.geoMercator().fitSize([width, height], geoData)))
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

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(5, ".0s") // Log scale with SI units
        .tickFormat(d3.format(",.0f"));

    const legend = svg.append("g")
        .attr("transform", `translate(20, ${height - 40})`);

    const legendData = d3.range(1, maxEmission, maxEmission / 9);

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
