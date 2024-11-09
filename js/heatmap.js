// Define the mapping for the type of emissions
const emissionTypes = ["Fossil", "Land-Use"];

// Load data from the CSV file and initialize the heatmap
d3.csv("data/co2-fossil-plus-land-use/co2-fossil-plus-land-use.csv").then(data => {
  // Filter data based on emission types and organize by year
  const data2018 = data.filter(d => d.Year === "2018" && emissionTypes.includes(d["Type"])).map(d => ({
    country: d.Entity,
    type: d["Type"],
    emissions: +d["Annual CO₂ emissions"]
  }));

  const decadeData = data.filter(d => d.Year >= "2010" && d.Year <= "2020" && emissionTypes.includes(d["Type"]));

  const dataDecade = [];
  emissionTypes.forEach(type => {
    const groupedData = d3.groups(decadeData.filter(d => d["Type"] === type), d => d.Entity);
    groupedData.forEach(([country, records]) => {
      const averageEmissions = d3.mean(records, d => +d["Annual CO₂ emissions"]);
      dataDecade.push({ country: country, type: type, emissions: averageEmissions });
    });
  });

  // Function to create the heatmap with adjusted margins
  function createHeatmap(data) {
    const margin = { top: 30, right: 60, bottom: 60, left: 120 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous chart content
    d3.select("#heatmap-chart").selectAll("*").remove();

    // Create an SVG container for the heatmap
    const svg = d3.select("#heatmap-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales for x-axis, y-axis, and color scale
    const x = d3.scaleBand()
      .domain(emissionTypes)
      .range([0, width])
      .padding(0.05);

    const y = d3.scaleBand()
      .domain(data.map(d => d.country).filter((value, index, self) => self.indexOf(value) === index))
      .range([0, height])
      .padding(0.05);

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(data, d => d.emissions)]);

    // Create the heatmap cells
    svg.selectAll()
      .data(data, d => d.country + ':' + d.type)
      .enter()
      .append("rect")
      .attr("x", d => x(d.type))
      .attr("y", d => y(d.country))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", d => colorScale(d.emissions))
      .on("mouseover", function (event, d) {
        d3.select("#tooltip")
          .style("visibility", "visible")
          .text(`${d.country} - ${d.type}: ${d.emissions.toFixed(2)} t`);
      })
      .on("mousemove", function (event) {
        d3.select("#tooltip")
          .style("top", `${event.pageY - 10}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", function () {
        d3.select("#tooltip").style("visibility", "hidden");
      });

    // Add x-axis with labels for "Fossil" and "Land-Use"
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "middle");

    // Add y-axis with country names
    svg.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("text-anchor", "end");
  }

  // Initialize the heatmap with data for 2018
  createHeatmap(data2018);

  // Update the heatmap when the user changes the selected time period
  d3.select("#heatmap-time-period").on("change", function () {
    const selectedTime = this.value;
    const selectedData = selectedTime === "2018" ? data2018 : dataDecade;
    createHeatmap(selectedData);
  });
});
