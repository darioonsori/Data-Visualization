// Load the CSV data
d3.csv("data/co2-fossil-plus-land-use/co2-fossil-plus-land-use.csv").then(function (data) {
  const year = "2018";

  // Filter the data for the target year
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

  const sankeyData = { nodes: [], links: [] };
  const nodeSet = new Set();

  // Add nodes and links
  filteredData.forEach(d => {
    const continent = continentMapping[d.Entity] || "Other";

    // Ensure the continent node exists
    if (!nodeSet.has(continent)) {
      sankeyData.nodes.push({ name: continent });
      nodeSet.add(continent);
    }

    // Ensure the country node exists
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

      // Ensure "Land-Use" node exists
      if (!nodeSet.has("Land-Use")) {
        sankeyData.nodes.push({ name: "Land-Use" });
        nodeSet.add("Land-Use");
      }
    }
  });

  // Check for missing nodes and add them
  sankeyData.links.forEach(link => {
    if (!nodeSet.has(link.source)) {
      sankeyData.nodes.push({ name: link.source });
      nodeSet.add(link.source);
    }
    if (!nodeSet.has(link.target)) {
      sankeyData.nodes.push({ name: link.target });
      nodeSet.add(link.target);
    }
  });

  // Set up SVG dimensions
  const width = 800;
  const height = 500;

  const svg = d3.select("#alluvial-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const sankey = d3.sankey()
    .nodeWidth(20)
    .nodePadding(10)
    .extent([[1, 1], [width - 1, height - 6]]);

  const { nodes, links } = sankey({
    nodes: sankeyData.nodes.map(d => Object.assign({}, d)),
    links: sankeyData.links.map(d => Object.assign({}, d))
  });

  // Draw nodes
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

  // Draw links
  svg.append("g")
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", "gray")
    .attr("stroke-width", d => Math.max(1, d.width))
    .attr("fill", "none")
    .attr("stroke-opacity", 0.5);

  // Tooltip for nodes
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
