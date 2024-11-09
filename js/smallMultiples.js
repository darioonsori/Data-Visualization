const stackedDataMultiple = {
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


const marginMultiple = { top: 20, right: 20, bottom: 30, left: 60 };
const widthMultiple = 300 - marginMultiple.left - marginMultiple.right;
const heightMultiple = 200 - marginMultiple.top - marginMultiple.bottom;

const colorScaleMultiple = d3.scaleOrdinal(d3.schemeTableau10);

const svgContainerMultiple = d3.select("#small-multiples")
  .selectAll("svg")
  .data(Object.keys(stackedDataMultiple))
  .enter()
  .append("svg")
  .attr("width", widthMultiple + marginMultiple.left + marginMultiple.right)
  .attr("height", heightMultiple + marginMultiple.top + marginMultiple.bottom)
  .append("g")
  .attr("transform", `translate(${marginMultiple.left},${marginMultiple.top})`);

svgContainerMultiple.each(function (region) {
  const svg = d3.select(this);
  const data = stackedDataMultiple[region];

  let cumulative = 0;
  data.forEach(d => {
    d.start = cumulative;
    cumulative += d.emissions;
  });

  const xScaleMultiple = d3.scaleLinear()
    .domain([0, cumulative])
    .range([0, widthMultiple]);

  const yScaleMultiple = d3.scaleBand()
    .domain([region])
    .range([0, heightMultiple / 2]);

  svg.append("text")
    .attr("class", "chart-title")
    .attr("x", widthMultiple / 2)
    .attr("y", -5)
    .attr("text-anchor", "middle")
    .text(region);

  svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => xScaleMultiple(d.start))
    .attr("y", yScaleMultiple(region))
    .attr("width", d => xScaleMultiple(d.emissions))
    .attr("height", yScaleMultiple.bandwidth() - 20)
    .attr("fill", d => colorScaleMultiple(d.country))
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
    .attr("transform", `translate(0,${heightMultiple / 2})`)
    .call(d3.axisBottom(xScaleMultiple).ticks(5));
});
