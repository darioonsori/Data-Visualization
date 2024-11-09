// Mappa per associare ciascun paese alla propria regione
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

// Carica i dati dal file CSV
d3.csv("data/co-emissions-per-capita/co-emissions-per-capita.csv").then(data => {
  // Filtra i dati per l'anno 2018 e aggiungi la regione per ciascun paese usando regionMap
  const data2018 = data.filter(d => d.Year === "2018").map(d => ({
    country: d.Entity,
    emissions: +d["Annual CO₂ emissions (per capita)"],
    region: regionMap[d.Entity]
  })).filter(d => d.region); // Rimuove i paesi senza regione

  // Raggruppa i dati per regione
  const regionData = d3.groups(data2018, d => d.region).map(([region, countries]) => {
    countries.sort((a, b) => b.emissions - a.emissions);
    const top5 = countries.slice(0, 5);
    const otherTotal = d3.sum(countries.slice(5), d => d.emissions);

    return {
      region: region,
      emissions: [
        ...top5.map(d => ({
          country: d.country,
          emissions: d.emissions
        })),
        { country: "Other", emissions: otherTotal }
      ]
    };
  });

  // Configura il grafico
  const margin = { top: 20, right: 30, bottom: 40, left: 100 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#stacked-bar-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Scala X per le emissioni
  const xScale = d3.scaleLinear()
    .domain([0, d3.max(regionData, d => d3.sum(d.emissions, e => e.emissions))])
    .range([0, width]);

  // Scala Y per le regioni
  const yScale = d3.scaleBand()
    .domain(regionData.map(d => d.region))
    .range([0, height])
    .padding(0.2);

  // Scala dei colori per i paesi
  const colorScale = d3.scaleOrdinal()
    .domain(data2018.map(d => d.country))
    .range(d3.schemeTableau10.concat(["#FF5733", "#C70039", "#900C3F", "#581845", "#FFC300"]));

  // Prepara i dati per il grafico
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

  // Disegna le barre impilate
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

  // Asse Y per le regioni
  svg.append("g")
    .call(d3.axisLeft(yScale).tickSizeOuter(0))
    .selectAll("text")
    .style("font-size", "14px");

  // Asse X per le emissioni
  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale).ticks(5));
});
