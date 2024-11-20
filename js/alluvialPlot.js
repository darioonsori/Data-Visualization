d3.csv("co2-fossil-plus-land-use.csv").then(function(data) {
    console.log(data); // Controlla il contenuto del CSV nella console
}).catch(function(error) {
    console.error("Error loading the CSV file:", error); // Mostra errori se il file non viene caricato
});
