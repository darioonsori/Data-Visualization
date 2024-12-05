// File: choroplethMap.js

// Mappatura dei nomi dei paesi per correggere eventuali discrepanze
const countryNameMap = {
  "United States": "United States of America",
  "Russia": "Russian Federation",
  "South Korea": "Republic of Korea",
  "North Korea": "Democratic People's Republic of Korea",
  "Vietnam": "Viet Nam",
  "Czechia": "Czech Republic",
  "Bosnia and Herz.": "Bosnia and Herzegovina",
  "Syria": "Syrian Arab Republic",
  "Timor-Leste": "Timor Leste",
  "Tanzania": "United Republic of Tanzania",
  "Bahamas": "The Bahamas",
  "Brunei": "Brunei Darussalam",
  "Antigua and Barb.": "Antigua and Barbuda",
  "Trinidad and Tobago": "Trinidad & Tobago",
  "Cape Verde": "Cabo Verde",
  "Gambia": "The Gambia",
  "Ivory Coast": "Côte d'Ivoire",
  "Greenland": "Denmark",
  "Dem. Rep. Congo": "Democratic Republic of the Congo",
  "Central African Rep.": "Central African Republic",
  "Eq. Guinea": "Equatorial Guinea",
  "United Arab Emirates": "UAE",
  "N. Cyprus": "Northern Cyprus",
  "S. Sudan": "South Sudan",
  "Myanmar": "Burma",
  "Macedonia": "North Macedonia",
  "Falkland Is.": "Falkland Islands",
  "Solomon Is.": "Solomon Islands",
  "Fr. S. Antarctic Lands": "French Southern Territories"
  // Puoi aggiungere altre mappature qui se necessario
};
// Carica i dati
Promise.all([
  d3.json("data/custom.geo.json"), // GeoJSON file
  d3.csv("data/co-emissions-per-capita.csv") // CSV file
]).then(([geoData, csvData]) => {
  // Prepara i dati delle emissioni
  const emissionsData = {};
  csvData.forEach(row => {
    emissionsData[row.Country] = +row["2018"]; // Usa il valore per il 2018
  });

  // Aggiungi le emissioni come proprietà al GeoJSON
  geoData.features.forEach(feature => {
    let countryName = feature.properties.name; // Nome del paese nel GeoJSON

    // Normalizza il nome del paese usando la mappatura
    if (countryNameMap[countryName]) {
      countryName = countryNameMap[countryName];
    }

    // Aggiungi i dati delle emissioni, oppure 0 se non disponibili
    feature.properties.emissions = emissionsData[countryName] || 0;

    // Debug: Mostra i paesi senza dati
    if (!emissionsData[countryName]) {
      console.log("No data for country:", countryName);
    }
  });

  // Creazione della mappa Choropleth
  const width = 960;
  const height = 500;

  const svg = d3.select("#choropleth-map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const projection = d3.geoMercator()
    .scale(150)
    .translate([width / 2, height / 1.5]);

  const path = d3.geoPath().projection(projection);

  const colorScale = d3.scaleSequential(d3.interpolateReds)
    .domain([0, d3.max(Object.values(emissionsData))]);

  // Disegna le aree
  svg.selectAll("path")
    .data(geoData.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => {
      const emissions = d.properties.emissions;
      return emissions > 0 ? colorScale(emissions) : "#ccc";
    })
    .attr("stroke", "#333")
    .on("mouseover", (event, d) => {
      const tooltip = d3.select("#tooltip");
      const emissions = d.properties.emissions > 0
        ? `${d.properties.emissions.toFixed(2)} t CO₂/cap`
        : "No Data";
      tooltip.style("visibility", "visible")
        .html(`${d.properties.name}: ${emissions}`)
        .style("top", `${event.pageY + 10}px`)
        .style("left", `${event.pageX + 10}px`);
    })
    .on("mouseout", () => {
      d3.select("#tooltip").style("visibility", "hidden");
    });

  // Aggiungi una legenda
  const legendWidth = 300;
  const legendHeight = 10;

  const legendSvg = svg.append("g")
    .attr("transform", `translate(${width - legendWidth - 20}, ${height - 40})`);

  const legendScale = d3.scaleLinear()
    .domain(colorScale.domain())
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .ticks(5)
    .tickFormat(d => `${d} t`);

  legendSvg.selectAll("rect")
    .data(d3.range(colorScale.domain()[0], colorScale.domain()[1], 0.5))
    .enter()
    .append("rect")
    .attr("x", d => legendScale(d))
    .attr("y", 0)
    .attr("width", legendWidth / 100)
    .attr("height", legendHeight)
    .attr("fill", d => colorScale(d));

  legendSvg.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis);
}).catch(error => {
  console.error("Error loading data:", error);
});
