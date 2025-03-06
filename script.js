document.addEventListener("DOMContentLoaded", () => {
    const dropArea = document.getElementById("drop-area");
    const fileInput = document.getElementById("file-input");
    const form = document.getElementById("unit-form");
    const generatePdfBtn = document.getElementById("generate-pdf");

    // Funzione per leggere il CSV
    function readCSV(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            parseCSV(event.target.result);
        };
        reader.readAsText(file);
    }

    // Funzione per elaborare i dati CSV e riempire il form
    function parseCSV(csvText) {
        const rows = csvText.split("\n").map(row => row.split(","));
        const headers = rows[0].map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
        const data = rows[1] || [];

        headers.forEach((header, index) => {
            const value = data[index] ? data[index].trim() : "";
            const input = form.querySelector(`[name="${header}"]`);

            if (!input) return;

            if (input.type === "radio") {
                const radio = form.querySelector(`[name="${header}"][value="${value}"]`);
                if (radio) radio.checked = true;
            } else if (input.type === "checkbox") {
                input.checked = value.toLowerCase() === "sì";
            } else if (input.tagName === "SELECT") {
                input.value = value;
            } else {
                input.value = value;
            }
        });
    }

    // Drag & Drop
    dropArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropArea.classList.add("dragover");
    });

    dropArea.addEventListener("drop", (e) => {
        e.preventDefault();
        dropArea.classList.remove("dragover");
        const file = e.dataTransfer.files[0];
        if (file && file.type === "text/csv") {
            readCSV(file);
        }
    });

    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file && file.type === "text/csv") {
            readCSV(file);
        }
    });

    // Funzione per esportare i dati del form in CSV
    function exportToCSV() {
        let csvContent = "";
        const formData = new FormData(form);
        let headers = [];
        let values = [];

        // Creiamo intestazione e valori
        formData.forEach((value, key) => {
            headers.push(key.replace(/_/g, " "));
            
            // Convertiamo i checkbox in "SÌ" o "NO"
            const inputElement = document.querySelector(`[name="${key}"]`);
            if (inputElement?.type === "checkbox") {
                values.push(inputElement.checked ? "SÌ" : "NO");
            } else {
                values.push(value);
            }
        });

        csvContent += headers.join(",") + "\n";
        csvContent += values.join(",") + "\n";

        // Creiamo un blob con i dati CSV
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);

        // Creiamo un link temporaneo per il download
        const a = document.createElement("a");
        a.href = url;
        a.download = "unit_data.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Rilasciamo l'oggetto URL per evitare memory leak
        URL.revokeObjectURL(url);
    }

    // Creazione del pulsante per esportare in CSV
    const exportCsvBtn = document.createElement("button");
    exportCsvBtn.textContent = "Esporta CSV";
    exportCsvBtn.id = "export-csv";
    exportCsvBtn.style.display = "block";
    exportCsvBtn.style.width = "100%";
    exportCsvBtn.style.padding = "12px";
    exportCsvBtn.style.marginTop = "10px";
    exportCsvBtn.style.border = "none";
    exportCsvBtn.style.borderRadius = "5px";
    exportCsvBtn.style.backgroundColor = "#2196F3";
    exportCsvBtn.style.color = "white";
    exportCsvBtn.style.fontSize = "16px";
    exportCsvBtn.style.cursor = "pointer";
    exportCsvBtn.style.transition = "background 0.3s ease";
    exportCsvBtn.addEventListener("click", exportToCSV);
    form.appendChild(exportCsvBtn);

    // Generazione PDF con sezioni chiare e formattazione pulita
    generatePdfBtn.addEventListener("click", () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let y = 15;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("Carta d'Identità Unità Frigo", 10, y);
        y += 10;

        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(10, y, 200, y);
        y += 10;

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");

        const formData = new FormData(form);
        let currentSection = "";

        const sections = {
            "nome_progetto": "INFORMAZIONI GENERALI",
            "numero_progetto": "INFORMAZIONI GENERALI",
            "anno": "INFORMAZIONI GENERALI",
            "quadro_elettrico": "QUADRO ELETTRICO",
            "metri_cablaggio": "QUADRO ELETTRICO",
            "cablaggio_presente": "CABAGGIO",
            "modulo_serbatoi": "MODULO SERBATOI",
            "materiale_connessione": "MODULO SERBATOI",
            "materiale_isolamento": "ISOLAMENTO",
            "isolamento_ht": "OPZIONI",
            "isolamento_separatore_olio": "OPZIONI",
            "convogliamento": "OPZIONI",
            "cartucce_filtri_montate": "OPZIONI",
            "backup_unit": "COMPONENTI SPEDITI A PARTE",
            "safety_valves": "COMPONENTI SPEDITI A PARTE",
            "muffler": "COMPONENTI SPEDITI A PARTE",
            "scambiatori_piatre": "COMPONENTI SPEDITI A PARTE",
            "valvole_piombate": "ALTRE SPECIALITÀ",
            "fascette_metalliche": "ALTRE SPECIALITÀ"
        };

        formData.forEach((value, key) => {
            let formattedKey = key.replace(/_/g, " ");

            if (document.querySelector(`[name="${key}"]`)?.type === "checkbox") {
                value = document.querySelector(`[name="${key}"]`).checked ? "SÌ" : "NO";
            }

            if (sections[key] && currentSection !== sections[key]) {
                y += 5;
                doc.setFont("helvetica", "bold");
                doc.text(sections[key], 10, y);
                doc.setFont("helvetica", "normal");
                y += 5;
                currentSection = sections[key];
            }

            doc.text(`${formattedKey.toUpperCase()}: ${value}`, 10, y);
            y += 7;

            if (y > 270) {
                doc.addPage();
                y = 15;
            }
        });

        doc.save("unit_id_card.pdf");
    });
});
