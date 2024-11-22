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

    d3.csv("data/co2-fossil-plus-land-use/co2-fossil-plus-land-use.csv").then(data => {
        console.log("Dati caricati:", data);
        const year = 2020;
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

        const topCountries = {};
        Object.keys(emissionsByCountry).forEach(continent => {
            topCountries[continent] = emissionsByCountry[continent]
                .sort((a, b) => b.emissions - a.emissions)
                .slice(0, 5)
                .map(d => d.country);
        });

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
console.log("Filtered Chart Data:", chartData);

        createAlluvialChart(chartData);
    }).catch(error => {
        console.error("Errore nel caricamento del CSV:", error);
    });

    
    function createAlluvialChart(data) {
        console.log("Chart Data per il Sankey:", data);
        const width = 1000;
        const height = 500;

        const svg = d3.select("#chart").append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("border", "1px solid black") // Bordo per debug
            .style("background-color", "#f0f0f0"); // Sfondo per visualizzare l'area
        
        const nodes = Array.from(new Set(data.map(d => d.source).concat(data.map(d => d.target))))
            .map(name => ({ name }));
        let links = data.map(d => ({
            source: nodes.findIndex(n => n.name === d.source),
            target: nodes.findIndex(n => n.name === d.target),
            value: d.value
        }));

        links = links.filter(link => link.source !== link.target);

        console.log("Nodes:", nodes);
        console.log("Links:", links);

        const sankey = d3.sankey()
            .nodeWidth(20)
            .nodePadding(80)
            .extent([[1, 30], [width - 1, height - 30]]); // Margini superiore e inferiore

        const graph = sankey({
            nodes: nodes.map(d => Object.assign({}, d)),
            links: links.map(d => Object.assign({}, d))
        });

        console.log("Nodi Posizionati:", graph.nodes.map(d => ({
    name: d.name,
    x0: d.x0,
    x1: d.x1,
    y0: d.y0,
    y1: d.y1
})));
        
        svg.append("g")
            .selectAll("rect")
            .data(graph.nodes)
            .join("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
                .attr("width", d => {
        console.log(`Nodo: ${d.name}, Width: ${d.x1 - d.x0}`); // Log larghezza nodo
        return d.x1 - d.x0;
    })
    .attr("height", d => {
        console.log(`Nodo: ${d.name}, Height: ${Math.max(1, d.y1 - d.y0)}`); // Log altezza nodo
        return Math.max(1, d.y1 - d.y0);
    })
    .attr("fill", d => d.name in continentMapping ? "#F4A261" : "#2A9D8F")
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
    .attr("stroke", d => d.type === "Fossil" ? "#1D3557" : "#E63946")
    .attr("stroke-opacity", 0.8)
    .attr("stroke-width", d => Math.max(2, d.width))
    .on("mouseover", (event, d) => {
        // Mostra il tooltip
        d3.select("#tooltip")
            .style("visibility", "visible")
            .html(`
                <strong>Source:</strong> ${d.source.name}<br>
                <strong>Target:</strong> ${d.target.name}<br>
                <strong>Value:</strong> ${d.value.toLocaleString()}
            `);
    })
    .on("mousemove", event => {
        // Posiziona il tooltip vicino al cursore
        d3.select("#tooltip")
            .style("top", `${event.pageY + 10}px`)
            .style("left", `${event.pageX + 10}px`);
    })
    .on("mouseout", () => {
        // Nascondi il tooltip
        d3.select("#tooltip")
            .style("visibility", "hidden");
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
            .style("font-size", "12px");

        const legend = svg.append("g")
            .attr("transform", `translate(${width / 2 - 100}, -50)`); // Posizionata sopra il grafico

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
