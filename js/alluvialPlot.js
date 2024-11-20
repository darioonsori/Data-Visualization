// Load the CSV data
d3.csv("data/co2-fossil-plus-land-use/co2-fossil-plus-land-use.csv").then(function (data) {
  // Filter data for the target year
  const year = "2018";
  const filteredData = data.filter(d => d.Year === year);

  // Define continent mappings for countries
  const continentMapping = {
    "Afghanistan": "Asia",
    "Germany": "Europe",
    "United States": "North America",
    "Brazil": "South America",
    "South Africa": "Africa",
    "Australia": "Oceania",
    // Add other countries as needed
  };

  // Prepare data for the alluvial plot
  const alluvialData = [];
  filteredData.forEach(d => {
    // Assign the continent based on the mapping
    const continent = continentMapping[d.Entity] || "Other";

    // Add fossil emissions data
    if (d["Annual CO₂ emissions"] && !isNaN(d["Annual CO₂ emissions"])) {
      alluvialData.push({
        source: continent,
        target: d.Entity,
        value: +d["Annual CO₂ emissions"],
        type: "Fossil"
      });
    }

    // Add land-use emissions data
    if (d["Annual CO₂ emissions from land-use change"] && !isNaN(d["Annual CO₂ emissions from land-use change"])) {
      alluvialData.push({
        source: d.Entity,
        target: "Land-Use",
        value: +d["Annual CO₂ emissions from land-use change"],
        type: "Land"
      });
    }
  });

  // Define dimensions of the SVG canvas
  const width = 800;
  const height = 500;

  // Create an SVG container
  const svg = d3.select("#alluvial-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Set up the sankey generator
  const sankey = d3.sankey()
    .nodeWidth(20) // Width of the nodes
    .nodePadding(10) // Padding between nodes
    .extent([[1, 1], [width - 1, height - 6]]); // Define the drawing area

  // Generate the nodes and links for the sankey diagram
  const { nodes, links } = sankey({
    nodes: Array.from(new Set(alluvialData.flatMap(d => [d.source, d.target]))).map(name => ({ name })),
    links: alluvialData.map(d => ({
      source: d.source,
      target: d.target,
      value: d.value
    }))
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
    .attr("fill", "steelblue") // Node color
    .attr("stroke", "black");

  // Draw the links between nodes
  svg.append("g")
    .attr("fill", "none")
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", "#000")
    .attr("stroke-width", d => Math.max(1, d.width))
    .attr("stroke-opacity", 0.5);

  // Add tooltips to nodes
  svg.selectAll("rect")
    .on("mouseover", function (event, d) {
      const tooltip = d3.select("#tooltip");
      tooltip.style("visibility", "visible")
        .text(`Node: ${d.name}`);
    })
    .on("mousemove", function (event) {
      d3.select("#tooltip")
        .style("top", `${event.pageY - 10}px`)
        .style("left", `${event.pageX + 10}px`);
    })
    .on("mouseout", function () {
      d3.select("#tooltip").style("visibility", "hidden");
    });
});
