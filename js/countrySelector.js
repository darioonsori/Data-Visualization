// Load countries from CSV and populate the dropdown
d3.csv("data/co-emissions-per-capita/co-emissions-per-capita.csv").then(data => {
  const uniqueCountries = Array.from(new Set(data.map(d => d.Entity)))
    .filter(country => !["World", "Asia", "Europe", "North America"].includes(country))
    .sort();
  const countryList = d3.select("#country-list");
  uniqueCountries.forEach(country => {
    countryList.append("option").text(country).attr("value", country);
  });
});

function updateSelectedCountries() {
  const selectedCountries = Array.from(d3.select("#country-list").node().selectedOptions)
    .map(option => option.value);
  updateBarChart(selectedCountries);
  updateStackedBarChart(selectedCountries);
  updateSmallMultiples(selectedCountries);
  updateStackedBarChart100(selectedCountries);
  updateHeatmap(selectedCountries);
}
