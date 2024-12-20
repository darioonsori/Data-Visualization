// Map to associate each country with its region and define "Other" with the provided value
const regionMap = {
  "Libya": "Africa",
  "South Africa": "Africa",
  "Seychelles": "Africa",
  "Algeria": "Africa",
  "Equatorial Guinea": "Africa",
  "OtherAfrica": { region: "Africa", emissions: 31.802244 },
  
  "Qatar": "Asia",
  "Kuwait": "Asia",
  "United Arab Emirates": "Asia",
  "Bahrain": "Asia",
  "Brunei": "Asia",
  "OtherAsia": { region: "Asia", emissions: 179.133522 },
  
  "Kazakhstan": "Europe",
  "Luxembourg": "Europe",
  "Estonia": "Europe",
  "Russia": "Europe",
  "Iceland": "Europe",
  "OtherEurope": { region: "Europe", emissions: 236.507179 },
  
  "Trinidad and Tobago": "North America",
  "United States": "North America",
  "Canada": "North America",
  "Antigua and Barbuda": "North America",
  "Bahamas": "North America",
  "OtherNorthAmerica": { region: "North America", emissions: 42.077580 },
  
  "Australia": "Oceania",
  "Palau": "Oceania",
  "New Zealand": "Oceania",
  "Nauru": "Oceania",
  "Marshall Islands": "Oceania",
  "OtherOceania": { region: "Oceania", emissions: 7.366800 },
  
  "Chile": "South America",
  "Argentina": "South America",
  "Suriname": "South America",
  "Venezuela": "South America",
  "Guyana": "South America",
  "OtherSouthAmerica": { region: "South America", emissions: 13.194629 }
};

// Load data from the CSV file
d3.csv("data/co-emissions-per-capita/co-emissions-per-capita.csv").then(data => {
  // Filter data for the year 2018 and add the region for each country using regionMap
  const data2018 = data.filter(d => d.Year === "2018").map(d => ({
    country: d.Entity,
    emissions: +d["Annual CO₂ emissions (per capita)"],
    region: regionMap[d.Entity]
  })).filter(d => d.region && !d.region.emissions); // Exclude countries without region and "Other"

  // Predefined "Other" data based on the values provided
  const otherData = Object.values(regionMap).filter(d => d.emissions).map(d => ({
    country: "Other",
    emissions: d.emissions,
    region: d.region
  }));

  // Combine filtered data with "Other" data
  const combinedData = [...data2018, ...otherData];

  // Group data by region
  const regionData = d3.groups(combinedData, d => d.region).map(([region, countries]) => {
    // Sort countries by emissions in descending order and select the top 5
    countries.sort((a, b) => b.emissions - a.emissions);
    const top5 = countries.filter(d => d.country !== "Other").slice(0, 5);

    // Add "Other" only once at the end of the list
    const other = countries.find(d => d.country === "Other");
    if (other) top5.push(other);

    return {
      region: region,
      emissions: top5.map(d => ({
        country: d.country,
        emissions: d.emissions
      }))
    };
  });

  // Set up the chart
  const margin = { top: 20, right: 30, bottom: 40, left: 100 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#stacked-bar-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // X scale for emissions
  const xScale = d3.scaleLinear()
    .domain([0, d3.max(regionData, d => d3.sum(d.emissions, e => e.emissions))])
    .range([0, width]);

  // Y scale for regions
  const yScale = d3.scaleBand()
    .domain(regionData.map(d => d.region))
    .range([0, height])
    .padding(0.2);

  // Color scale for countries, ensuring distinct colors within each region
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10.concat(["#FF5733", "#C70039", "#900C3F", "#581845", "#FFC300"]));

  // Prepare the data for the chart
  let processedData = [];
  regionData.forEach(d => {
    let cumulativeEmissions = 0;
    d.emissions.forEach(e => {
      processedData.push({
        region: d.region,
        country: e.country,
        emissions: e.emissions,
        start: cumulativeEmissions
      });
      cumulativeEmissions += e.emissions;
    });
  });

  // Draw stacked bars
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

  // Y-axis for regions
  svg.append("g")
    .call(d3.axisLeft(yScale).tickSizeOuter(0))
    .selectAll("text")
    .style("font-size", "14px");

  // X-axis for emissions
  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale).ticks(5));
});
