const stackedData = [
  { Region: "Africa", Country: "Libya", Emissions: 8.339181 },
  { Region: "Africa", Country: "South Africa", Emissions: 7.590512 },
  { Region: "Africa", Country: "Seychelles", Emissions: 5.827153 },
  { Region: "Africa", Country: "Algeria", Emissions: 4.085100 },
  { Region: "Africa", Country: "Equatorial Guinea", Emissions: 4.000027 },
  { Region: "Africa", Country: "Other", Emissions: 31.802244 },
  { Region: "Asia", Country: "Qatar", Emissions: 34.504090 },
  { Region: "Asia", Country: "Kuwait", Emissions: 24.448280 },
  { Region: "Asia", Country: "United Arab Emirates", Emissions: 22.896563 },
  { Region: "Asia", Country: "Bahrain", Emissions: 21.943077 },
  { Region: "Asia", Country: "Brunei", Emissions: 21.516985 },
  { Region: "Asia", Country: "Other", Emissions: 179.133522 },
  { Region: "Europe", Country: "Kazakhstan", Emissions: 16.569881 },
  { Region: "Europe", Country: "Luxembourg", Emissions: 15.748627 },
  { Region: "Europe", Country: "Estonia", Emissions: 13.527124 },
  { Region: "Europe", Country: "Russia", Emissions: 11.757415 },
  { Region: "Europe", Country: "Iceland", Emissions: 10.395095 },
  { Region: "Europe", Country: "Other", Emissions: 236.507179 },
  { Region: "North America", Country: "Trinidad and Tobago", Emissions: 26.801151 },
  { Region: "North America", Country: "United States", Emissions: 16.191355 },
  { Region: "North America", Country: "Canada", Emissions: 15.581538 },
  { Region: "North America", Country: "Antigua and Barbuda", Emissions: 6.716774 },
  { Region: "North America", Country: "Bahamas", Emissions: 6.025971 },
  { Region: "North America", Country: "Other", Emissions: 42.077580 },
  { Region: "Oceania", Country: "Australia", Emissions: 16.627844 },
  { Region: "Oceania", Country: "Palau", Emissions: 11.880807 },
  { Region: "Oceania", Country: "New Zealand", Emissions: 7.379144 },
  { Region: "Oceania", Country: "Nauru", Emissions: 4.599548 },
  { Region: "Oceania", Country: "Marshall Islands", Emissions: 3.185256 },
  { Region: "Oceania", Country: "Other", Emissions: 7.366800 },
  { Region: "South America", Country: "Chile", Emissions: 4.515097 },
  { Region: "South America", Country: "Argentina", Emissions: 4.066307 },
  { Region: "South America", Country: "Suriname", Emissions: 3.518976 },
  { Region: "South America", Country: "Venezuela", Emissions: 3.377444 },
  { Region: "South America", Country: "Guyana", Emissions: 3.186389 },
  { Region: "South America", Country: "Other", Emissions: 13.194629 }
];

const margin = { top: 20, right: 30, bottom: 40, left: 100 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select("#stacked-bar-chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

const xScale = d3.scaleLinear()
  .domain([0, d3.max(stackedData, d => d.Emissions)])
  .range([0, width]);

const yScale = d3.scaleBand()
  .domain(stackedData.map(d => d.Region))
  .range([0, height])
  .padding(0.2);

const colorScale = d3.scaleOrdinal()
  .domain(stackedData.map(d => d.Country))
  .range(d3.schemeTableau10.concat(["#FF5733", "#C70039", "#900C3F", "#581845", "#FFC300"]));

const regions = d3.group(stackedData, d => d.Region);
let processedData = [];
regions.forEach((values, key) => {
  let total = 0;
  values.forEach(d => {
    processedData.push({ region: key, country: d.Country, emissions: d.Emissions, start: total });
    total += d.Emissions;
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
    d3.select("#tooltip")
      .style("visibility", "visible")
      .text(`${d.country}: ${d.emissions.toFixed(2)} t`);
  })
  .on("mousemove", function (event) {
    d3.select("#tooltip")
      .style("top", `${event.pageY - 10}px`)
      .style("left", `${event.pageX + 10}px`);
  })
  .on("mouseout", function () {
    d3.select("#tooltip").style("visibility", "hidden");
  });

svg.append("g")
  .call(d3.axisLeft(yScale).tickSizeOuter(0))
  .selectAll("text")
  .style("font-size", "14px");

svg.append("g")
  .attr("transform", `translate(0, ${height})`)
  .call(d3.axisBottom(xScale).ticks(5));
