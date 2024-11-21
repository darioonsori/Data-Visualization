// Mappatura completa dei paesi ai continenti
function mapCountryToContinent(country) {
    const countryToContinent = {
        // Africa
        "Algeria": "Africa",
        "Angola": "Africa",
        "Benin": "Africa",
        "Botswana": "Africa",
        "Burkina Faso": "Africa",
        "Burundi": "Africa",
        "Cape Verde": "Africa",
        "Cameroon": "Africa",
        "Central African Republic": "Africa",
        "Chad": "Africa",
        "Comoros": "Africa",
        "Congo": "Africa",
        "Djibouti": "Africa",
        "Egypt": "Africa",
        "Equatorial Guinea": "Africa",
        "Eritrea": "Africa",
        "Eswatini": "Africa",
        "Ethiopia": "Africa",
        "Gabon": "Africa",
        "Gambia": "Africa",
        "Ghana": "Africa",
        "Guinea": "Africa",
        "Guinea-Bissau": "Africa",
        "Ivory Coast": "Africa",
        "Kenya": "Africa",
        "Lesotho": "Africa",
        "Liberia": "Africa",
        "Libya": "Africa",
        "Madagascar": "Africa",
        "Malawi": "Africa",
        "Mali": "Africa",
        "Mauritania": "Africa",
        "Mauritius": "Africa",
        "Morocco": "Africa",
        "Mozambique": "Africa",
        "Namibia": "Africa",
        "Niger": "Africa",
        "Nigeria": "Africa",
        "Rwanda": "Africa",
        "Senegal": "Africa",
        "Seychelles": "Africa",
        "Sierra Leone": "Africa",
        "Somalia": "Africa",
        "South Africa": "Africa",
        "South Sudan": "Africa",
        "Sudan": "Africa",
        "Tanzania": "Africa",
        "Togo": "Africa",
        "Tunisia": "Africa",
        "Uganda": "Africa",
        "Zambia": "Africa",
        "Zimbabwe": "Africa",

        // Asia
        "Afghanistan": "Asia",
        "Armenia": "Asia",
        "Azerbaijan": "Asia",
        "Bahrain": "Asia",
        "Bangladesh": "Asia",
        "Bhutan": "Asia",
        "Brunei": "Asia",
        "Cambodia": "Asia",
        "China": "Asia",
        "Cyprus": "Asia",
        "Georgia": "Asia",
        "India": "Asia",
        "Indonesia": "Asia",
        "Iran": "Asia",
        "Iraq": "Asia",
        "Israel": "Asia",
        "Japan": "Asia",
        "Jordan": "Asia",
        "Kazakhstan": "Asia",
        "Kuwait": "Asia",
        "Kyrgyzstan": "Asia",
        "Laos": "Asia",
        "Lebanon": "Asia",
        "Malaysia": "Asia",
        "Maldives": "Asia",
        "Mongolia": "Asia",
        "Myanmar": "Asia",
        "Nepal": "Asia",
        "North Korea": "Asia",
        "Oman": "Asia",
        "Pakistan": "Asia",
        "Palestine": "Asia",
        "Philippines": "Asia",
        "Qatar": "Asia",
        "Saudi Arabia": "Asia",
        "Singapore": "Asia",
        "South Korea": "Asia",
        "Sri Lanka": "Asia",
        "Syria": "Asia",
        "Taiwan": "Asia",
        "Tajikistan": "Asia",
        "Thailand": "Asia",
        "Timor-Leste": "Asia",
        "Turkey": "Asia",
        "Turkmenistan": "Asia",
        "United Arab Emirates": "Asia",
        "Uzbekistan": "Asia",
        "Vietnam": "Asia",
        "Yemen": "Asia",

        // Europe
        "Albania": "Europe",
        "Andorra": "Europe",
        "Austria": "Europe",
        "Belarus": "Europe",
        "Belgium": "Europe",
        "Bosnia and Herzegovina": "Europe",
        "Bulgaria": "Europe",
        "Croatia": "Europe",
        "Czechia": "Europe",
        "Denmark": "Europe",
        "Estonia": "Europe",
        "Faroe Islands": "Europe",
        "Finland": "Europe",
        "France": "Europe",
        "Germany": "Europe",
        "Greece": "Europe",
        "Hungary": "Europe",
        "Iceland": "Europe",
        "Ireland": "Europe",
        "Italy": "Europe",
        "Kosovo": "Europe",
        "Latvia": "Europe",
        "Liechtenstein": "Europe",
        "Lithuania": "Europe",
        "Luxembourg": "Europe",
        "Malta": "Europe",
        "Moldova": "Europe",
        "Monaco": "Europe",
        "Montenegro": "Europe",
        "Netherlands": "Europe",
        "North Macedonia": "Europe",
        "Norway": "Europe",
        "Poland": "Europe",
        "Portugal": "Europe",
        "Romania": "Europe",
        "Russia": "Europe",
        "San Marino": "Europe",
        "Serbia": "Europe",
        "Slovakia": "Europe",
        "Slovenia": "Europe",
        "Spain": "Europe",
        "Sweden": "Europe",
        "Switzerland": "Europe",
        "Ukraine": "Europe",
        "United Kingdom": "Europe",
        "Vatican": "Europe",

        // North America
        "Antigua and Barbuda": "North America",
        "Bahamas": "North America",
        "Barbados": "North America",
        "Belize": "North America",
        "Canada": "North America",
        "Costa Rica": "North America",
        "Cuba": "North America",
        "Dominica": "North America",
        "Dominican Republic": "North America",
        "El Salvador": "North America",
        "Grenada": "North America",
        "Guatemala": "North America",
        "Haiti": "North America",
        "Honduras": "North America",
        "Jamaica": "North America",
        "Mexico": "North America",
        "Nicaragua": "North America",
        "Panama": "North America",
        "Saint Kitts and Nevis": "North America",
        "Saint Lucia": "North America",
        "Saint Vincent and the Grenadines": "North America",
        "Trinidad and Tobago": "North America",
        "United States": "North America",

        // Oceania
        "Australia": "Oceania",
        "Fiji": "Oceania",
        "Kiribati": "Oceania",
        "Marshall Islands": "Oceania",
        "Micronesia": "Oceania",
        "Nauru": "Oceania",
        "New Zealand": "Oceania",
        "Palau": "Oceania",
        "Papua New Guinea": "Oceania",
        "Samoa": "Oceania",
        "Solomon Islands": "Oceania",
        "Tonga": "Oceania",
        "Tuvalu": "Oceania",
        "Vanuatu": "Oceania",

        // South America
        "Argentina": "South America",
        "Bolivia": "South America",
        "Brazil": "South America",
        "Chile": "South America",
        "Colombia": "South America",
        "Ecuador": "South America",
        "Guyana": "South America",
        "Paraguay": "South America",
        "Peru": "South America",
        "Suriname": "South America",
        "Uruguay": "South America",
        "Venezuela": "South America",
    };

    return countryToContinent[country] || null; // Restituisce null se il paese non è trovato
}


d3.csv("data/co2-fossil-plus-land-use/co2-fossil-plus-land-use.csv").then(function (data) {
    const filteredData = data.filter(d => d.Year === "2018");

    const nodes = [];
    const links = [];

    filteredData.forEach(d => {
        const country = d.Entity;
        const continent = mapCountryToContinent(country);

        if (continent) {
            // Aggiungi nodi unici
            if (!nodes.some(node => node.name === continent)) {
                nodes.push({ name: continent });
            }
            if (!nodes.some(node => node.name === country)) {
                nodes.push({ name: country });
            }

            // Aggiungi collegamenti solo per valori validi
            const emissionValue = +d["Annual CO₂ emissions"];
            if (emissionValue > 0) {
                links.push({
                    source: continent,
                    target: country,
                    value: emissionValue
                });
            }
        } else {
            console.error("Missing continent mapping for:", country);
        }
    });

    // Rimuovi duplicati nei nodi
    const uniqueNodes = [...new Map(nodes.map(item => [item.name, item])).values()];

    // Sankey setup
    const width = 800;
    const height = 600;

    const svg = d3.select("#alluvial-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const sankey = d3.sankey()
        .nodeWidth(20)
        .nodePadding(10)
        .extent([[1, 1], [width - 1, height - 6]]);

    const { nodes: sankeyNodes, links: sankeyLinks } = sankey({
        nodes: uniqueNodes.map(d => Object.assign({}, d)),
        links: links.map(d => Object.assign({}, d))
    });

    svg.append("g")
        .selectAll("path")
        .data(sankeyLinks)
        .join("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", "#000")
        .attr("stroke-width", d => Math.max(1, d.width))
        .attr("fill", "none")
        .attr("stroke-opacity", 0.5);

    svg.append("g")
        .selectAll("rect")
        .data(sankeyNodes)
        .join("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", "steelblue")
        .attr("stroke", "#000");

    svg.append("g")
        .selectAll("text")
        .data(sankeyNodes)
        .join("text")
        .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
        .text(d => d.name);

    console.log("Nodes:", nodes);
console.log("Links:", links);
});
