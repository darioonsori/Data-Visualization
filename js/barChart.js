// Global variables for data
let data2018 = [];
let dataDecade = [];

// Sorting state
let sortByEmissions = false;

// Tooltip setup
const tooltip = d3.select("#tooltip");

// Function to create the bar chart
function createBarChart(data) {
    d3.select("#bar-chart").selectAll("*").remove();

    const width = 500, height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };

    const svg = d3.select("#bar-chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d.country))
      .range([0, width - margin.left - margin.right])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.emissions)])
      .range([height - margin.top - margin.bottom, 0]);

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

    svg.append("g")
      .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .call(d3.axisLeft(y));
}

// Sorting function - move this outside of d3.csv
function sortBars() {
    sortByEmissions = !sortByEmissions;
    const selectedData = document.getElementById("time-period").value === "2018" ? [...data2018] : [...dataDecade];
    if (sortByEmissions) {
        selectedData.sort((a, b) => b.emissions - a.emissions);
    }
    createBarChart(selectedData);
}

// Load data from CSV file and initialize chart
d3.csv("data/co-emissions-per-capita/co-emissions-per-capita.csv").then(data => {
    const countries = ["China", "Germany", "Italy", "India", "South Africa", "Turkey", "United States"];
    data2018 = data.filter(d => d.Year === "2018" && countries.includes(d.Entity)).map(d => ({
        country: d.Entity,
        emissions: +d["Annual CO₂ emissions (per capita)"]
    }));

    const decadeData = data.filter(d => d.Year >= "2010" && d.Year <= "2020" && countries.includes(d.Entity));
    dataDecade = countries.map(country => {
        const countryData = decadeData.filter(d => d.Entity === country);
        const averageEmissions = d3.mean(countryData, d => +d["Annual CO₂ emissions (per capita)"]);
        return { country: country, emissions: averageEmissions };
    });

    createBarChart(data2018);

    d3.select("#time-period").on("change", function () {
        const selectedTime = this.value;
        const selectedData = selectedTime === "2018" ? data2018 : dataDecade;
        createBarChart(selectedData);
    });
});
