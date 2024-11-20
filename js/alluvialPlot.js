// Load the CSV data
d3.csv("data/co2-fossil-plus-land-use/co2-fossil-plus-land-use.csv").then(function (data) {
  // Filter data for the target year
  const year = "2018";
  const filteredData = data.filter(d => +d.Year === +year);

  // Define continent mappings for countries
  const continentMapping = {
    "Afghanistan": "Asia",
    "Germany": "Europe",
    "United States": "North America",
    "Brazil": "South America",
    "South Africa": "Africa",
    "Australia": "Oceania",
    // Add more mappings as needed
  };

  // Prepare data for the Sankey diagram
  const sankeyData = { nodes: [], links: [] };
  const nodeSet = new Set();

  filteredData.forEach(d => {
    const continent = continentMapping[d.Entity] || "Other";

    // Add continent and country as nodes
    if (!nodeSet.has(continent)) {
      sankeyData.nodes.push({ name: continent });
      nodeSet.add(continent);
    }

    if (!nodeSet.has(d.Entity)) {
      sankeyData.nodes.push({ name: d.Entity });
      nodeSet.add(d.Entity);
    }

    // Add fossil emissions as a link
    if (d["Annual CO₂ emissions"] && !isNaN(d["Annual CO₂ emissions"])) {
      sankeyData.links.push({
        source: continent,
        target: d.Entity,
        value: +d["Annual CO₂ emissions"]
      });
    }

    // Add land-use emissions as a link
    if (d["Annual CO₂ emissions from land-use change"] && !isNaN(d["Annual CO₂ emissions from land-use change"])) {
      sankeyData.links.push({
        source: d.Entity,
        target: "Land-Use",
        value: +d["Annual CO₂ emissions from land-use change"]
      });
    }
  });

  // Set up SVG dimensions
  const width = 800;
  const height = 500;

  // Create an SVG container
  const svg = d3.select("#alluvial-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Configure the Sankey generator
  const sankey = d3.sankey()
    .nodeWidth(20)
    .nodePadding(10)
    .extent([[1, 1], [width - 1, height - 6]]);

  // Generate Sankey layout
  const { nodes, links } = sankey({
    nodes: sankeyData.nodes.map(d => Object.assign({}, d)),
    links: sankeyData.links.map(d => Object.assign({}, d))
  });

  // Draw the nodes
  svg.append("g")
    .selectAll("rect")
    .data(nodes)
    .join("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", "steelblue")
    .attr("stroke", "black");

  // Draw the links
  svg.append("g")
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", d => d.color || "gray")
    .attr("stroke-width", d => Math.max(1, d.width))
    .attr("fill", "none")
    .attr("stroke-opacity", 0.5);

  // Add tooltips for nodes
  svg.selectAll("rect")
    .on("mouseover", function (event, d) {
      d3.select("#tooltip")
        .style("visibility", "visible")
        .text(`Node: ${d.name}`);
    })
    .on("mousemove", function (event) {
      d3.select("#tooltip")
        .style("top", `${event.pageY - 10}px`)
        .style("left", `${event.pageX + 10}px`);
    })
    .on("mouseout", function () {
      d3.select("#tooltip")
        .style("visibility", "hidden");
    });
});
