document.addEventListener("DOMContentLoaded", function () {
    // Full mapping of countries to their respective continents
    const continentMapping = {
        "Africa": "Africa",
        "Asia": "Asia",
        "Europe": "Europe",
        "North America": "North America",
        "South America": "South America",
        "Oceania": "Oceania",
        "Afghanistan": "Asia",
        "Algeria": "Africa",
        "Angola": "Africa",
        "Argentina": "South America",
        "Australia": "Oceania",
        "Austria": "Europe",
        "Bangladesh": "Asia",
        "Belgium": "Europe",
        "Brazil": "South America",
        "Canada": "North America",
        "Chile": "South America",
        "China": "Asia",
        "Colombia": "South America",
        "Cuba": "North America",
        "Denmark": "Europe",
        "Egypt": "Africa",
        "France": "Europe",
        "Germany": "Europe",
        "India": "Asia",
        "Indonesia": "Asia",
        "Italy": "Europe",
        "Japan": "Asia",
        "Kenya": "Africa",
        "Mexico": "North America",
        "Morocco": "Africa",
        "Nigeria": "Africa",
        "Norway": "Europe",
        "Pakistan": "Asia",
        "Peru": "South America",
        "Russia": "Europe",
        "Saudi Arabia": "Asia",
        "South Africa": "Africa",
        "South Korea": "Asia",
        "Spain": "Europe",
        "Sweden": "Europe",
        "Switzerland": "Europe",
        "Thailand": "Asia",
        "Turkey": "Asia",
        "United Kingdom": "Europe",
        "United States": "North America",
        "Vietnam": "Asia",
    };

    // Function to get the continent of a given entity
    function getContinent(entity) {
        if (continentMapping[entity]) {
            return continentMapping[entity]; // Return the mapped continent
        } else if (entity.includes("GCP") || entity.includes("excl.") || entity === "World") {
            return null; // Ignore specific aggregated groups
        } else {
            return "Unknown"; // Default for unrecognized entities
        }
    }

    // Load the CSV file
    d3.csv("data/co2-fossil-plus-land-use/co2-fossil-plus-land-use.csv").then(data => {
        console.log("Data loaded:", data);

        // Filter data for the specified year
        const year = 2020;
        const filteredData = data.filter(d => +d.Year === year);

        // Aggregate emissions by continent
        const emissionsByCountry = {};
        filteredData.forEach(d => {
            const continent = getContinent(d.Entity);
            if (continent && continent !== "Unknown") {
                const totalEmissions = +d["Annual CO₂ emissions"] + +d["Annual CO₂ emissions from land-use change"];
                if (!emissionsByCountry[continent]) emissionsByCountry[continent] = [];
                emissionsByCountry[continent].push({ country: d.Entity, emissions: totalEmissions });
            }
        });

        // Select the top 5 countries with the highest emissions for each continent
        const topCountries = {};
        Object.keys(emissionsByCountry).forEach(continent => {
            topCountries[continent] = emissionsByCountry[continent]
                .sort((a, b) => b.emissions - a.emissions) // Sort by emissions
                .slice(0, 5) // Take top 5
                .map(d => d.country); // Extract country names
        });

        // Prepare data for the alluvial chart
        const chartData = [];
        filteredData.forEach(d => {
            const continent = getContinent(d.Entity);
            if (continent && continent !== "Unknown" && topCountries[continent].includes(d.Entity)) {
                if (+d["Annual CO₂ emissions"] > 0) {
                    chartData.push({
                        source: continent, // Continent as the source
                        target: d.Entity, // Country as the target
                        value: +d["Annual CO₂ emissions"], // Fossil fuel emissions
                        type: "Fossil" // Type of emission
                    });
                }
                if (+d["Annual CO₂ emissions from land-use change"] > 0) {
                    chartData.push({
                        source: continent, // Continent as the source
                        target: d.Entity, // Country as the target
                        value: +d["Annual CO₂ emissions from land-use change"], // Land-use emissions
                        type: "Land" // Type of emission
                    });
                }
            }
        });

        console.log("Filtered Chart Data:", chartData);

        // Create the alluvial chart
        createAlluvialChart(chartData);
    }).catch(error => {
        console.error("Error loading CSV:", error);
    });

    // Function to create the alluvial chart
    function createAlluvialChart(data) {
        const width = 1000; // Width of the SVG
        const height = 500; // Height of the SVG

        // Create the SVG container
        const svg = d3.select("#chart").append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("border", "1px solid black");

        // Generate nodes and links for the Sankey diagram
        const nodes = Array.from(new Set(data.map(d => d.source).concat(data.map(d => d.target))))
            .map(name => ({ name }));
        let links = data.map(d => ({
            source: nodes.findIndex(n => n.name === d.source), // Index of the source node
            target: nodes.findIndex(n => n.name === d.target), // Index of the target node
            value: d.value // Value of the link
        }));

        // Remove circular links
        links = links.filter(link => link.source !== link.target);

        // Configure the Sankey layout
        const sankey = d3.sankey()
            .nodeWidth(20)
            .nodePadding(50)
            .extent([[1, 30], [width - 1, height - 30]]);

        // Generate the Sankey graph structure
        const graph = sankey({
            nodes: nodes.map(d => Object.assign({}, d)),
            links: links.map(d => Object.assign({}, d))
        });

        // Render nodes as rectangles
        svg.append("g")
            .selectAll("rect")
            .data(graph.nodes)
            .join("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => Math.max(1, d.y1 - d.y0))
            .attr("fill", d => d.name in continentMapping ? "#F4A261" : "#2A9D8F") // Continent and country colors
            .attr("stroke", "#264653")
            .append("title")
            .text(d => `${d.name}\n${d.value}`);

        // Create and manage the tooltip
        const tooltip = d3.select("#tooltip");

        // Render links between nodes
        svg.append("g")
            .attr("fill", "none")
            .selectAll("path")
            .data(graph.links)
            .join("path")
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke", d => d.type === "Fossil" ? "#1D3557" : "#E63946") // Color based on emission type
            .attr("stroke-opacity", 0.8)
            .attr("stroke-width", d => Math.max(2, d.width))
            .on("mouseover", (event, d) => {
                // Show the tooltip on hover
                tooltip.style("visibility", "visible")
                    .html(`
                        <strong>Source:</strong> ${d.source.name}<br>
                        <strong>Target:</strong> ${d.target.name}<br>
                        <strong>Value:</strong> ${d.value.toLocaleString()}
                    `);
            })
            .on("mousemove", event => {
                // Move the tooltip with the cursor
                tooltip.style("top", `${event.pageY + 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", () => {
                // Hide the tooltip
                tooltip.style("visibility", "hidden");
            });

        // Render labels for the nodes
        svg.append("g")
            .selectAll("text")
            .data(graph.nodes)
            .join("text")
            .attr("x", d => (d.x0 < width / 2 ? d.x1 + 15 : d.x0 - 15))
            .attr("y", d => (d.y1 + d.y0) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", d => (d.x0 < width / 2 ? "start" : "end"))
            .text(d => d.name)
            .attr("fill", "#000")
            .style("font-size", "12px");

        // Add a legend to explain link colors
        const legend = svg.append("g")
            .attr("transform", `translate(${width / 2 - 100}, -50)`);

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "#1D3557");
    legend.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text("Fossil Emissions")
        .style("font-size", "12px");

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "#E63946");
    legend.append("text")
        .attr("x", 20)
        .attr("y", 32)
        .text("Land-Use Emissions")
        .style("font-size", "12px");
}

});
