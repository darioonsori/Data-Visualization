// Heatmap data for the year 2018
const heatmapData2018 = [
  { country: "China", type: "Fossil", emissions: 10353934000.0 },
  { country: "China", type: "Land-Use", emissions: 696513540.0 },
  { country: "United States", type: "Fossil", emissions: 5377797000.0 },
  { country: "United States", type: "Land-Use", emissions: 108297544.0 },
  { country: "India", type: "Fossil", emissions: 2593057800.0 },
  { country: "India", type: "Land-Use", emissions: 125022424.0 },
  { country: "Russia", type: "Fossil", emissions: 1712494300.0 },
  { country: "Russia", type: "Land-Use", emissions: 445643970.0 },
  { country: "Brazil", type: "Fossil", emissions: 477998620.0 },
  { country: "Brazil", type: "Land-Use", emissions: 900642900.0 },
  { country: "Japan", type: "Fossil", emissions: 1141668900.0 },
  { country: "Japan", type: "Land-Use", emissions: -823190.9 },
  { country: "Indonesia", type: "Fossil", emissions: 594101400.0 },
  { country: "Indonesia", type: "Land-Use", emissions: 520235680.0 },
  { country: "Mexico", type: "Fossil", emissions: 470285860.0 },
  { country: "Mexico", type: "Land-Use", emissions: 281983170.0 },
  { country: "Germany", type: "Fossil", emissions: 754811140.0 },
  { country: "Germany", type: "Land-Use", emissions: -9062024.0 },
  { country: "Canada", type: "Fossil", emissions: 577066300.0 },
  { country: "Canada", type: "Land-Use", emissions: 136751070.0 }
];

// Heatmap data for the decade 2010-2020
const heatmapDataDecade = [
  { country: "China", type: "Fossil", emissions: 9956323727.27 },
  { country: "China", type: "Land-Use", emissions: 358749581.73 },
  { country: "United States", type: "Fossil", emissions: 5343172000.0 },
  { country: "United States", type: "Land-Use", emissions: 50813028.64 },
  { country: "India", type: "Fossil", emissions: 2195833936.36 },
  { country: "India", type: "Land-Use", emissions: 129644838.73 },
  { country: "Russia", type: "Fossil", emissions: 1662772154.55 },
  { country: "Russia", type: "Land-Use", emissions: 306841387.27 },
  { country: "Brazil", type: "Fossil", emissions: 491515161.82 },
  { country: "Brazil", type: "Land-Use", emissions: 1123695109.09 },
  { country: "Indonesia", type: "Fossil", emissions: 538781890.91 },
  { country: "Indonesia", type: "Land-Use", emissions: 795085860.91 },
  { country: "Japan", type: "Fossil", emissions: 1205719636.36 },
  { country: "Japan", type: "Land-Use", emissions: -4164145.89 },
  { country: "Germany", type: "Fossil", emissions: 779588362.73 },
  { country: "Germany", type: "Land-Use", emissions: -8565685.86 },
  { country: "Republic of Congo", type: "Fossil", emissions: 3380181.73 },
  { country: "Republic of Congo", type: "Land-Use", emissions: 720959701.82 },
  { country: "Canada", type: "Fossil", emissions: 563319258.18 },
  { country: "Canada", type: "Land-Use", emissions: 126558616.91 }
];

// Function to create the heatmap with adjusted margins
function createHeatmap(data) {
  // Adjusted margin values to give more space around the chart
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
    .domain(["Fossil", "Land-Use"])
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
createHeatmap(heatmapData2018);

// Update the heatmap when the user changes the selected time period
d3.select("#heatmap-time-period").on("change", function () {
  const selectedTime = this.value;
  const selectedData = selectedTime === "2018" ? heatmapData2018 : heatmapDataDecade;
  createHeatmap(selectedData);
}); 
