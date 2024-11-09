// Define a map with "Other" emissions values for each region
const otherEmissions = {
  "Africa": 31.802244,
  "Asia": 179.133522,
  "Europe": 236.507179,
  "North America": 42.077580,
  "Oceania": 7.366800,
  "South America": 13.194629
};

// Map to associate each country with its region
const regionMap = {
  "Libya": "Africa",
  "South Africa": "Africa",
  "Seychelles": "Africa",
  "Algeria": "Africa",
  "Equatorial Guinea": "Africa",
  "Qatar": "Asia",
  "Kuwait": "Asia",
  "United Arab Emirates": "Asia",
  "Bahrain": "Asia",
  "Brunei": "Asia",
  "Kazakhstan": "Europe",
  "Luxembourg": "Europe",
  "Estonia": "Europe",
  "Russia": "Europe",
  "Iceland": "Europe",
  "Trinidad and Tobago": "North America",
  "United States": "North America",
  "Canada": "North America",
  "Antigua and Barbuda": "North America",
  "Bahamas": "North America",
  "Australia": "Oceania",
  "Palau": "Oceania",
  "New Zealand": "Oceania",
  "Nauru": "Oceania",
  "Marshall Islands": "Oceania",
  "Chile": "South America",
  "Argentina": "South America",
  "Suriname": "South America",
  "Venezuela": "South America",
  "Guyana": "South America"
};

// Load data from the CSV file
d3.csv("data/co-emissions-per-capita/co-emissions-per-capita.csv").then(data => {
  // Filter data for the year 2018 and add the region for each country using regionMap
  const data2018 = data.filter(d => d.Year === "2018").map(d => ({
    country: d.Entity,
    emissions: +d["Annual CO₂ emissions (per capita)"],
    region: regionMap[d.Entity]
  })).filter(d => d.region); // Exclude countries without a region

  // Group data by region
  const regionData = d3.groups(data2018, d => d.region).map(([region, countries]) => {
    // Sort countries by emissions in descending order and select the top 5
    countries.sort((a, b) => b.emissions - a.emissions);
    const top5 = countries.slice(0, 5);

    // Add the "Other" category at the end with its predefined value
    top5.push({ country: "Other", emissions: otherEmissions[region] });

    return {
      region: region,
      emissions: top5
    };
  });

  // Set up chart dimensions and color scale
  const marginMultiple = { top: 20, right: 20, bottom: 30, left: 60 };
  const widthMultiple = 300 - marginMultiple.left - marginMultiple.right;
  const heightMultiple = 200 - marginMultiple.top - marginMultiple.bottom;

  const colorScaleMultiple = d3.scaleOrdinal(d3.schemeTableau10);

  // Create SVG containers for each region and draw the chart
  const svgContainerMultiple = d3.select("#small-multiples")
    .selectAll("svg")
    .data(regionData)
    .enter()
    .append("svg")
    .attr("width", widthMultiple + marginMultiple.left + marginMultiple.right)
    .attr("height", heightMultiple + marginMultiple.top + marginMultiple.bottom)
    .append("g")
    .attr("transform", `translate(${marginMultiple.left},${marginMultiple.top})`);

  svgContainerMultiple.each(function (d) {
    const svg = d3.select(this);
    const data = d.emissions;

    // Calculate cumulative emissions for stacked bars
    let cumulative = 0;
    data.forEach(d => {
      d.start = cumulative;
      cumulative += d.emissions;
    });

    const xScaleMultiple = d3.scaleLinear()
      .domain([0, cumulative])
      .range([0, widthMultiple]);

    const yScaleMultiple = d3.scaleBand()
      .domain([d.region])
      .range([0, heightMultiple / 2]);

    // Add chart title
    svg.append("text")
      .attr("class", "chart-title")
      .attr("x", widthMultiple / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .text(d.region);

    // Draw stacked bars
    svg.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", d => xScaleMultiple(d.start))
      .attr("y", yScaleMultiple(d.region))
      .attr("width", d => xScaleMultiple(d.emissions))
      .attr("height", yScaleMultiple.bandwidth() - 20)
      .attr("fill", d => colorScaleMultiple(d.country))
      .on("mouseover", function (event, d) {
        d3.select("#tooltip")
          .style("visibility", "visible")
          .text(`${d.country}: ${d.emissions.toFixed(2)} t/person`);
      })
      .on("mousemove", function (event) {
        d3.select("#tooltip")
          .style("top", `${event.pageY - 10}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", function () {
        d3.select("#tooltip").style("visibility", "hidden");
      });

    // Add x-axis
    svg.append("g")
      .attr("transform", `translate(0,${heightMultiple / 2})`)
      .call(d3.axisBottom(xScaleMultiple).ticks(5));
  });
});
