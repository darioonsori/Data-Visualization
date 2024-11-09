// Global variable for stacked data
let stackedData = [];

// Tooltip setup
const tooltip = d3.select("#tooltip");

// Function to create the stacked bar chart
function createStackedBarChart(data) {
    d3.select("#stacked-bar-chart").selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 100 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#stacked-bar-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const regions = Array.from(new Set(data.map(d => d.Region)));
    const maxEmissions = d3.max(data, d => d.Emissions);

    const xScale = d3.scaleLinear()
        .domain([0, maxEmissions])
        .range([0, width]);

    const yScale = d3.scaleBand()
        .domain(regions)
        .range([0, height])
        .padding(0.2);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    // Group data by region for stacking
    const regionGroups = d3.group(data, d => d.Region);
    let processedData = [];
    regionGroups.forEach((values, region) => {
        let cumulativeEmissions = 0;
        values.forEach(d => {
            processedData.push({ region, country: d.Country, emissions: d.Emissions, start: cumulativeEmissions });
            cumulativeEmissions += d.Emissions;
        });
    });

    svg.selectAll(".bar")
        .data(processedData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", d => yScale(d.region))
        .attr("x", d => xScale(d.start))
        .attr("height", yScale.bandwidth())
        .attr("width", d => xScale(d.emissions))
        .attr("fill", d => colorScale(d.country))
        .on("mouseover", function (event, d) {
            tooltip.style("visibility", "visible")
                .text(`${d.country}: ${d.emissions.toFixed(2)} t/person`);
        })
        .on("mousemove", function (event) {
            tooltip.style("top", `${event.pageY - 10}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", function () {
            tooltip.style("visibility", "hidden");
        });

    svg.append("g")
        .call(d3.axisLeft(yScale).tickSizeOuter(0))
        .selectAll("text")
        .style("font-size", "14px");

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(5));
}

// Load CSV data and prepare stacked bar chart data
d3.csv("data/co-emissions-per-capita/co-emissions-per-capita.csv").then(data => {
    const selectedCountries = ["Libya", "South Africa", "Seychelles", "Algeria", "Equatorial Guinea", "Qatar", "Kuwait", "United Arab Emirates", "Bahrain", "Brunei", "Kazakhstan", "Luxembourg", "Estonia", "Russia", "Iceland", "Trinidad and Tobago", "United States", "Canada", "Australia", "New Zealand", "Chile", "Argentina", "Suriname", "Venezuela", "Guyana"];

    // Filter and process the data for 2018
    stackedData = data.filter(d => d.Year === "2018" && selectedCountries.includes(d.Entity)).map(d => ({
        Region: d.Region,
        Country: d.Entity,
        Emissions: +d["Annual CO₂ emissions (per capita)"]
    }));

    createStackedBarChart(stackedData);
});
