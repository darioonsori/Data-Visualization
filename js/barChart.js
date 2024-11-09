// Global state variables for sorting and selected time period
let sortByEmissions = false;

// Tooltip setup
const tooltip = d3.select("#tooltip");

// Function to create the bar chart based on filtered data
function createBarChart(data) {
  // Clear any existing SVG
  d3.select("#bar-chart").selectAll("*").remove();

  // Chart dimensions and margins
  const width = 500, height = 300, margin = { top: 20, right: 30, bottom: 40, left: 40 };

  // Create SVG container
  const svg = d3.select("#bar-chart").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Define X and Y scales
  const x = d3.scaleBand()
    .domain(data.map(d => d.country))
    .range([0, width - margin.left - margin.right])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.emissions)])
    .range([height - margin.top - margin.bottom, 0]);

  // Draw bars
  svg.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.country))
    .attr("y", d => y(d.emissions))
    .attr("width", x.bandwidth())
    .attr("height", d => height - margin.top - margin.bottom - y(d.emissions))
    .attr("fill", "steelblue")
    .on("mouseover", function (event, d) {
      tooltip.style("visibility", "visible")
        .text(`Emissions: ${d.emissions.toFixed(2)} t/person`);
    })
    .on("mousemove", function (event) {
      tooltip.style("top", `${event.pageY - 10}px`)
        .style("left", `${event.pageX + 10}px`);
    })
    .on("mouseout", function () {
      tooltip.style("visibility", "hidden");
    });

  // Draw X and Y axes
  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));
}

// Function to update the bar chart based on selected countries and time period
function updateBarChart(selectedCountries) {
  const year = document.getElementById("time-period").value;
  d3.csv("data/co-emissions-per-capita.csv").then(data => {
    // Filter data by year and selected countries
    const filteredData = data.filter(d => d.Year === year && selectedCountries.includes(d.Entity))
      .map(d => ({
        country: d.Entity,
        emissions: +d["Annual CO₂ emissions (per capita)"]
      }));
    createBarChart(filteredData);
  });
}

// Sorting function to toggle sorting by emissions
function sortBars() {
  sortByEmissions = !sortByEmissions;
  const year = document.getElementById("time-period").value;
  d3.csv("data/co-emissions-per-capita.csv").then(data => {
    const selectedCountries = Array.from(d3.select("#country-list").node().selectedOptions)
      .map(option => option.value);
    // Filter and sort data based on emissions
    const filteredData = data.filter(d => d.Year === year && selectedCountries.includes(d.Entity))
      .map(d => ({ country: d.Entity, emissions: +d["Annual CO₂ emissions (per capita)"] }));
    if (sortByEmissions) filteredData.sort((a, b) => b.emissions - a.emissions);
    createBarChart(filteredData);
  });
}

// Initialize chart with default data and time period
d3.csv("data/co-emissions-per-capita.csv").then(data => {
  // Default time period data (2018)
  const year = "2018";
  const initialCountries = data.map(d => d.Entity); // Load all countries initially
  const filteredData = data.filter(d => d.Year === year && initialCountries.includes(d.Entity))
    .map(d => ({
      country: d.Entity,
      emissions: +d["Annual CO₂ emissions (per capita)"]
    }));
  createBarChart(filteredData);

  // Update chart on time period change
  d3.select("#time-period").on("change", function () {
    const selectedTime = this.value;
    updateBarChart(initialCountries, selectedTime);
  });
});
