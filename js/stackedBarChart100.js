// Define the "Other" values manually
const otherValues = {
  "Africa": 31.802244,
  "Asia": 179.133522,
  "Europe": 236.507179,
  "North America": 42.077580,
  "Oceania": 7.366800,
  "South America": 13.194629
};

// Load data from the CSV file
d3.csv("data/co-emissions-per-capita/co-emissions-per-capita.csv").then(data => {
  // Filter data for the year 2018 and map each country to its region using regionMap
  const data2018 = data.filter(d => d.Year === "2018").map(d => ({
    country: d.Entity,
    emissions: +d["Annual CO₂ emissions (per capita)"],
    region: regionMap[d.Entity]  // Assumes regionMap is already defined
  })).filter(d => d.region); // Exclude countries without a region

  // Group data by region and prepare the 100% stacked bar data
  const regionData = d3.groups(data2018, d => d.region).map(([region, countries]) => {
    // Sort countries by emissions in descending order and select the top 5
    countries.sort((a, b) => b.emissions - a.emissions);
    const top5 = countries.slice(0, 5);

    // Manually insert the "Other" category with predefined values as the last item
    top5.push({ country: "Other", emissions: otherValues[region] });

    // Calculate total emissions for the region
    const totalEmissions = d3.sum(top5, d => d.emissions);

    // Convert emissions to percentages and accumulate the starting positions
    let cumulativePercent = 0;
    return top5.map(d => {
      const percent = (d.emissions / totalEmissions) * 100;
      const data = {
        region: region,
        country: d.country,
        emissions: percent,
        start: cumulativePercent
      };
      cumulativePercent += percent;
      return data;
    });
  }).flat();

  // Set up the dimensions and scales
  const margin100 = { top: 20, right: 30, bottom: 40, left: 60 };
  const width100 = 800 - margin100.left - margin100.right;
  const height100 = 400 - margin100.top - margin100.bottom;

  const colorScale100 = d3.scaleOrdinal(d3.schemeTableau10);

  const svg100 = d3.select("#stacked-bar-100-chart")
    .append("svg")
    .attr("width", width100 + margin100.left + margin100.right)
    .attr("height", height100 + margin100.top + margin100.bottom)
    .append("g")
    .attr("transform", `translate(${margin100.left}, ${margin100.top})`);

  // X and Y scales
  const xScale100 = d3.scaleLinear()
    .domain([0, 100])
    .range([0, width100]);

  const yScale100 = d3.scaleBand()
    .domain([...new Set(regionData.map(d => d.region))])
    .range([0, height100])
    .padding(0.2);

  // Draw bars
  svg100.selectAll(".bar")
    .data(regionData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("y", d => yScale100(d.region))
    .attr("x", d => xScale100(d.start))
    .attr("height", yScale100.bandwidth())
    .attr("width", d => xScale100(d.emissions))
    .attr("fill", d => colorScale100(d.country))
    .on("mouseover", function (event, d) {
      d3.select("#tooltip")
        .style("visibility", "visible")
        .text(`${d.country}: ${d.emissions.toFixed(2)}%`);
    })
    .on("mousemove", function (event) {
      d3.select("#tooltip")
        .style("top", `${event.pageY - 10}px`)
        .style("left", `${event.pageX + 10}px`);
    })
    .on("mouseout", function () {
      d3.select("#tooltip").style("visibility", "hidden");
    });

  // Y-axis (regions)
  svg100.append("g")
    .call(d3.axisLeft(yScale100).tickSizeOuter(0))
    .selectAll("text")
    .style("font-size", "14px");

  // X-axis (percentage)
  svg100.append("g")
    .attr("transform", `translate(0, ${height100})`)
    .call(d3.axisBottom(xScale100).ticks(5).tickFormat(d => d + "%"));
});
