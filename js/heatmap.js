// List of specific keywords to exclude aggregate regions and economic groups
const excludedKeywords = [
    "World", "GCP", "income", "region", "Europe", "Asia", "America", "Union", 
    "OECD", "Middle East", "Africa", "South America", "North America", "excl"
];

// Function to check if an entity name contains any excluded keyword
function isAggregateRegion(entity) {
    return excludedKeywords.some(keyword => entity.includes(keyword));
}

// Load data from the CSV file and create the heatmap
d3.csv("data/co2-fossil-plus-land-use/co2-fossil-plus-land-use.csv").then(data => {
    const fossilColumn = "Annual CO₂ emissions";
    const landUseColumn = "Annual CO₂ emissions from land-use change";

    // Filter and prepare data for the year 2018
    const data2018 = data.filter(d => d.Year === "2018" && !isAggregateRegion(d.Entity)).map(d => ({
        country: d.Entity,
        fossil: +d[fossilColumn],
        landUse: +d[landUseColumn],
        totalEmissions: +d[fossilColumn] + +d[landUseColumn]
    }));

    // Sort and keep only the top 10 countries
    const top10Data2018 = data2018.sort((a, b) => b.totalEmissions - a.totalEmissions).slice(0, 10);
    const heatmapData2018 = top10Data2018.flatMap(d => [
        { country: d.country, type: "Fossil", emissions: d.fossil },
        { country: d.country, type: "Land-Use", emissions: d.landUse }
    ]);

    // Prepare data for the decade average (2010-2020) with filtering
    const decadeData = data.filter(d => d.Year >= "2010" && d.Year <= "2020" && !isAggregateRegion(d.Entity));
    const countryEmissionsDecade = d3.groups(decadeData, d => d.Entity).map(([country, values]) => {
        const fossilAvg = d3.mean(values, d => +d[fossilColumn]);
        const landUseAvg = d3.mean(values, d => +d[landUseColumn]);
        return {
            country: country,
            fossil: fossilAvg,
            landUse: landUseAvg,
            totalEmissions: fossilAvg + landUseAvg
        };
    });

    // Sort and keep only the top 10 countries
    const top10DataDecade = countryEmissionsDecade.sort((a, b) => b.totalEmissions - a.totalEmissions).slice(0, 10);
    const heatmapDataDecade = top10DataDecade.flatMap(d => [
        { country: d.country, type: "Fossil", emissions: d.fossil },
        { country: d.country, type: "Land-Use", emissions: d.landUse }
    ]);

    // Function to create the heatmap
    function createHeatmap(data) {
        const margin = { top: 30, right: 60, bottom: 60, left: 120 };
        const width = 600 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        d3.select("#heatmap-chart").selectAll("*").remove();

        const svg = d3.select("#heatmap-chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand().domain(["Fossil", "Land-Use"]).range([0, width]).padding(0.05);
        const y = d3.scaleBand().domain(data.map(d => d.country)).range([0, height]).padding(0.05);
        const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, d3.max(data, d => d.emissions)]);

        svg.selectAll()
            .data(data, d => `${d.country}:${d.type}`)
            .enter()
            .append("rect")
            .attr("x", d => x(d.type))
            .attr("y", d => y(d.country))
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", d => colorScale(d.emissions))
            .on("mouseover", (event, d) => {
                d3.select("#tooltip")
                    .style("visibility", "visible")
                    .text(`${d.country} - ${d.type}: ${d.emissions.toFixed(2)} t`);
            })
            .on("mousemove", event => {
                d3.select("#tooltip")
                    .style("top", `${event.pageY - 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", () => d3.select("#tooltip").style("visibility", "hidden"));

        svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
        svg.append("g").call(d3.axisLeft(y));
    }

    // Initialize with 2018 data
    createHeatmap(heatmapData2018);

    // Update heatmap based on selected period
    d3.select("#heatmap-time-period").on("change", function () {
        const selectedData = this.value === "2018" ? heatmapData2018 : heatmapDataDecade;
        createHeatmap(selectedData);
    });
});
