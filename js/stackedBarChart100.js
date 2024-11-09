// Data for the 100% Stacked Bar Chart
const stackedDataPercent = {
  "Africa": [
    { country: "Libya", emissions: 8.339181 },
    { country: "South Africa", emissions: 7.590512 },
    { country: "Seychelles", emissions: 5.827153 },
    { country: "Algeria", emissions: 4.085100 },
    { country: "Equatorial Guinea", emissions: 4.000027 },
    { country: "Other", emissions: 31.802244 }
  ],
  "Asia": [
    { country: "Qatar", emissions: 34.504090 },
    { country: "Kuwait", emissions: 24.448280 },
    { country: "United Arab Emirates", emissions: 22.896563 },
    { country: "Bahrain", emissions: 21.943077 },
    { country: "Brunei", emissions: 21.516985 },
    { country: "Other", emissions: 179.133522 }
  ],
  "Europe": [
    { country: "Kazakhstan", emissions: 16.569881 },
    { country: "Luxembourg", emissions: 15.748627 },
    { country: "Estonia", emissions: 13.527124 },
    { country: "Russia", emissions: 11.757415 },
    { country: "Iceland", emissions: 10.395095 },
    { country: "Other", emissions: 236.507179 }
  ],
  "North America": [
    { country: "Trinidad and Tobago", emissions: 26.801151 },
    { country: "United States", emissions: 16.191355 },
    { country: "Canada", emissions: 15.581538 },
    { country: "Antigua and Barbuda", emissions: 6.716774 },
    { country: "Bahamas", emissions: 6.025971 },
    { country: "Other", emissions: 42.077580 }
  ],
  "Oceania": [
    { country: "Australia", emissions: 16.627844 },
    { country: "Palau", emissions: 11.880807 },
    { country: "New Zealand", emissions: 7.379144 },
    { country: "Nauru", emissions: 4.599548 },
    { country: "Marshall Islands", emissions: 3.185256 },
    { country: "Other", emissions: 7.366800 }
  ],
  "South America": [
    { country: "Chile", emissions: 4.515097 },
    { country: "Argentina", emissions: 4.066307 },
    { country: "Suriname", emissions: 3.518976 },
    { country: "Venezuela", emissions: 3.377444 },
    { country: "Guyana", emissions: 3.186389 },
    { country: "Other", emissions: 13.194629 }
  ]
};

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

// Process data for 100% stacked bar chart
const processedData100 = [];
for (const region in stackedDataPercent) {
  const regionData = stackedDataPercent[region];
  const totalEmissions = d3.sum(regionData, d => d.emissions);

  // Calculate relative percentage for each country
  let cumulativePercent = 0;
  regionData.forEach(d => {
    const percent = (d.emissions / totalEmissions) * 100;
    processedData100.push({
      region: region,
      country: d.country,
      emissions: percent,
      start: cumulativePercent
    });
    cumulativePercent += percent;
  });
}

// X and Y scales
const xScale100 = d3.scaleLinear()
  .domain([0, 100])
  .range([0, width100]);

const yScale100 = d3.scaleBand()
  .domain(Object.keys(stackedDataPercent))
  .range([0, height100])
  .padding(0.2);

// Draw bars
svg100.selectAll(".bar")
  .data(processedData100)
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

