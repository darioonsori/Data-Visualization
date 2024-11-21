document.addEventListener("DOMContentLoaded", function () {
    // Mappatura completa dei paesi ai continenti
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

function getContinent(entity) {
        if (continentMapping[entity]) {
            return continentMapping[entity];
        } else if (entity.includes("GCP") || entity.includes("excl.") || entity === "World") {
            return null;
        } else {
            return "Unknown";
        }
    }

    // Caricamento del file CSV
    d3.csv("data/co2-fossil-plus-land-use/co2-fossil-plus-land-use.csv").then(data => {
        const year = 2020; // Seleziona l'anno
        const filteredData = data.filter(d => +d.Year === year);

        const emissionsByCountry = {};
        filteredData.forEach(d => {
            const continent = getContinent(d.Entity);
            if (continent && continent !== "Unknown") {
                const totalEmissions = +d["Annual CO₂ emissions"] + +d["Annual CO₂ emissions from land-use change"];
                if (!emissionsByCountry[continent]) emissionsByCountry[continent] = [];
                emissionsByCountry[continent].push({ country: d.Entity, emissions: totalEmissions });
            }
        });

        // Trova i top 5 paesi per continente
        const topCountries = {};
        Object.keys(emissionsByCountry).forEach(continent => {
            topCountries[continent] = emissionsByCountry[continent]
                .sort((a, b) => b.emissions - a.emissions)
                .slice(0, 5)
                .map(d => d.country);
        });

        // Prepara i dati per il grafico
        const chartData = [];
        filteredData.forEach(d => {
            const continent = getContinent(d.Entity);
            if (continent && continent !== "Unknown" && topCountries[continent].includes(d.Entity)) {
                if (+d["Annual CO₂ emissions"] > 0) {
                    chartData.push({
                        source: continent,
                        target: d.Entity,
                        value: +d["Annual CO₂ emissions"],
                        type: "Fossil"
                    });
                }
                if (+d["Annual CO₂ emissions from land-use change"] > 0) {
                    chartData.push({
                        source: continent,
                        target: d.Entity,
                        value: +d["Annual CO₂ emissions from land-use change"],
                        type: "Land"
                    });
                }
            }
        });

        // Crea il grafico alluvionale
        createAlluvialChart(chartData);
    }).catch(error => {
        console.error("Errore nel caricamento del CSV:", error);
    });

    function createAlluvialChart(data) {
        const width = 1000;
        const height = 600;

       const svg = d3.select("#chart").append("svg")
            .attr("width", width)
            .attr("height", height);

        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", "gradient")
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "0%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#457B9D");
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#E63946");

        const nodes = Array.from(new Set(data.map(d => d.source).concat(data.map(d => d.target))))
            .map(name => ({ name }));
        let links = data.map(d => ({
            source: nodes.findIndex(n => n.name === d.source),
            target: nodes.findIndex(n => n.name === d.target),
            value: d.value
        }));

        links = links.filter(link => link.source !== link.target);

        const sankey = d3.sankey()
            .nodeWidth(20)
            .nodePadding(70)
            .extent([[50, 30], [width - 50, height - 30]]);

        const graph = sankey({
            nodes: nodes.map(d => Object.assign({}, d)),
            links: links.map(d => Object.assign({}, d))
        });

        svg.append("g")
            .selectAll("rect")
            .data(graph.nodes)
            .join("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => Math.max(1, d.y1 - d.y0))
            .attr("fill", "#F4A261")
            .attr("stroke", "#264653")
            .append("title")
            .text(d => `${d.name}\n${d.value}`);

        const tooltip = d3.select("#tooltip");

        svg.append("g")
            .attr("fill", "none")
            .selectAll("path")
            .data(graph.links)
            .join("path")
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke", d => d.type === "Fossil" ? "#457B9D" : "#E63946")
            .attr("stroke-opacity", 0.8)
            .attr("stroke-width", d => Math.max(3, d.width))
            .on("mouseover", (event, d) => {
                d3.select(event.target)
                    .attr("stroke-opacity", 1)
                    .attr("stroke-width", Math.max(5, d.width));
                tooltip.style("display", "block")
                    .html(`<strong>Link Details</strong><br>Source: ${d.source.name}<br>Target: ${d.target.name}<br>Value: ${d.value}`);
            })
            .on("mousemove", event => {
                tooltip.style("top", (event.pageY + 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", (event, d) => {
                d3.select(event.target)
                    .attr("stroke-opacity", 0.8)
                    .attr("stroke-width", Math.max(3, d.width));
                tooltip.style("display", "none");
            });

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
            .style("font-size", "12px")
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5);
    }
});
