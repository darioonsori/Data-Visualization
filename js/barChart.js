// Load data from the CSV file and create the bar chart
d3.csv("data/co-emissions-per-capita/co-emissions-per-capita.csv").then(data => {
  // Filter data for the year 2018 and specific countries
  const countries = ["China", "Germany", "Italy", "India", "South Africa", "Turkey", "United States"];
  const data2018 = data.filter(d => d.Year === "2018" && countries.includes(d.Entity)).map(d => ({
    country: d.Entity,
    emissions: +d["Annual CO₂ emissions (per capita)"]
  }));

  // Filter data for the average decade (2010-2020) by calculating the average emissions per country
  const decadeData = data.filter(d => d.Year >= "2010" && d.Year <= "2020" && countries.includes(d.Entity));
  const dataDecade = countries.map(country => {
    const countryData = decadeData.filter(d => d.Entity === country);
    const averageEmissions = d3.mean(countryData, d => +d["Annual CO₂ emissions (per capita)"]);
    return { country: country, emissions: averageEmissions };
  });

  // State variable for sorting
  let sortByEmissions = false;

  // Tooltip setup
  const tooltip = d3.select("#tooltip");

  // Function to create the bar chart
  function createBarChart(data) {
    // Clear any existing SVG
    d3.select("#bar-chart").selectAll("*").remove();

    // Chart dimensions
    const width = 500, height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };

    // SVG container
    const svg = d3.select("#bar-chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X-axis scale
    const x = d3.scaleBand()
      .domain(data.map(d => d.country))
      .range([0, width - margin.left - margin.right])
      .padding(0.1);

    // Y-axis scale
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

    // X-axis and Y-axis
    svg.append("g")
      .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .call(d3.axisLeft(y));
  }

  // Sorting function
  function sortBars() {
    sortByEmissions = !sortByEmissions;
    let selectedData = document.getElementById("time-period").value === "2018" ? [...data2018] : [...dataDecade];
    if (sortByEmissions) {
      selectedData.sort((a, b) => b.emissions - a.emissions);
    }
    createBarChart(selectedData);
  }

  // Initialize chart with default data
  createBarChart(data2018);

  // Update chart on time period selector change
  d3.select("#time-period").on("change", function () {
    const selectedTime = this.value;
    const selectedData = selectedTime === "2018" ? data2018 : dataDecade;
    createBarChart(selectedData);
  });
});
