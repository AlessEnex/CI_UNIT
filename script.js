document.addEventListener("DOMContentLoaded", () => {
    const dropArea = document.getElementById("drop-area");
    const fileInput = document.getElementById("file-input");
    const form = document.getElementById("unit-form");
    const generatePdfBtn = document.getElementById("generate-pdf");

    // --- ELEMENTI DINAMICI
    const metriCablaggioContainer = document.getElementById("metri-cablaggio-container");
    const materialeConnessioneContainer = document.getElementById("materiale-connessione-container");
    const scambiatoriCheckbox = document.querySelector('input[name="scambiatori_piatre"]');
    const scambiatoriDettagli = document.querySelector('input[name="scambiatori_dettagli"]');

    // --- GESTIONE VISIBILITÀ DINAMICA
    function aggiornaMetriCablaggio() {
        const quadro = form.querySelector('input[name="quadro_elettrico"]:checked')?.value;
        if (quadro === "attaccato") {
            metriCablaggioContainer.style.display = "none";
        } else {
            metriCablaggioContainer.style.display = "block";
        }
    }

    function aggiornaMaterialeConnessione() {
        const modulo = form.querySelector('input[name="modulo_serbatoi"]:checked')?.value;
        if (modulo === "staccato") {
            materialeConnessioneContainer.style.display = "block";
        } else {
            materialeConnessioneContainer.style.display = "none";
        }
    }

    function aggiornaDettagliScambiatori() {
        if (scambiatoriCheckbox.checked) {
            scambiatoriDettagli.style.display = "block";
        } else {
            scambiatoriDettagli.style.display = "none";
        }
    }

    form.addEventListener("change", () => {
        aggiornaMetriCablaggio();
        aggiornaMaterialeConnessione();
        aggiornaDettagliScambiatori();
    });

    // --- IMPORTA CSV
    function readCSV(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            parseCSV(event.target.result);
        };
        reader.readAsText(file);
    }

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
            } else {
                input.value = value;
            }
        });

        aggiornaMetriCablaggio();
        aggiornaMaterialeConnessione();
        aggiornaDettagliScambiatori();
    }

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

    // --- ESPORTA CSV
    function exportToCSV() {
        const numeroProgetto = form.querySelector('input[name="numero_progetto"]').value.trim() || "unità";
        let csvContent = "";
        const formData = new FormData(form);
        let headers = [];
        let values = [];

        formData.forEach((value, key) => {
            headers.push(key.replace(/_/g, " "));
            const inputElement = form.querySelector(`[name="${key}"]`);
            if (inputElement?.type === "checkbox") {
                values.push(inputElement.checked ? "SÌ" : "NO");
            } else {
                values.push(value);
            }
        });

        csvContent += headers.join(",") + "\n";
        csvContent += values.join(",") + "\n";

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${numeroProgetto}_id_card.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // --- CREAZIONE PULSANTE CSV
    const exportCsvBtn = document.createElement("button");
    exportCsvBtn.textContent = "Esporta CSV";
    exportCsvBtn.id = "export-csv";
    exportCsvBtn.className = "button-csv";
    exportCsvBtn.addEventListener("click", exportToCSV);
    form.appendChild(exportCsvBtn);

    // --- GENERA PDF
    generatePdfBtn.addEventListener("click", () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const numeroProgetto = form.querySelector('input[name="numero_progetto"]').value.trim() || "unità";
        let y = 15;

        // Titolo principale
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("Carta d'Identità Unità Frigo", 10, y);
        y += 10;
        doc.line(10, y, 200, y);
        y += 10;

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");

        const formData = new FormData(form);

        const sezioni = {
            "INFORMAZIONI GENERALI": [
                ["Nome Progetto", "nome_progetto"],
                ["Numero Progetto", "numero_progetto"],
                ["Anno", "anno"],
                ["Nome Progettista", "nome_progettista"],
                ["Nome Disegnatore", "nome_disegnatore"]
            ],
            "QUADRO ELETTRICO": [
                ["Quadro Elettrico", "quadro_elettrico"],
                ["Metri Cablaggio", "metri_cablaggio"]
            ],
            "CABBLAGGIO": [
                ["Cablaggio Presente", "cablaggio_presente"]
            ],
            "ISOLAMENTO": [
                ["Materiale Isolamento", "materiale_isolamento"]
            ],
            "OPZIONI": [
                ["Isolamento HT", "isolamento_ht"],
                ["Isolamento Separatore Olio", "isolamento_separatore_olio"],
                ["Convogliamento", "convogliamento"],
                ["Cartucce Filtri Montate", "cartucce_filtri_montate"]
            ],
            "MODULO SERBATOI": [
                ["Modulo Serbatoi", "modulo_serbatoi"],
                ["Materiale Connessione", "materiale_connessione"]
            ],
            "COMPONENTI SPEDITI A PARTE": [
                ["Backup Unit", "backup_unit"],
                ["Valvole di Sicurezza Ricevitore", "safety_valves"],
                ["Muffler", "muffler"],
                ["Scambiatori a Piastre", "scambiatori_piatre"],
                ["Dettaglio Scambiatori", "scambiatori_dettagli"]
            ],
            "ALTRE SPECIALITÀ": [
                ["Valvole Piombate", "valvole_piombate"],
                ["Descrizione Valvole Piombate", "valvole_piombate_descrizione"],
                ["Fascette Metalliche", "fascette_metalliche"],
                ["Specialità 1", "specialita_1"],
                ["Descrizione Specialità 1", "specialita_1_descrizione"],
                ["Specialità 2", "specialita_2"],
                ["Descrizione Specialità 2", "specialita_2_descrizione"]
            ]
        };

        const opzioniObbligatorie = [
            "isolamento_ht", "isolamento_separatore_olio", "convogliamento", "cartucce_filtri_montate"
        ];

        const soloSeFlaggato = [
            "backup_unit", "safety_valves", "muffler", "scambiatori_piatre",
            "valvole_piombate", "fascette_metalliche",
            "specialita_1", "specialita_2"
        ];

        // Dentro il loop che scrive le sezioni
for (const [titoloSezione, campi] of Object.entries(sezioni)) {
    doc.setFont("helvetica", "bold");
    doc.text(titoloSezione, 10, y);
    y += 7;
    doc.setFont("helvetica", "normal");

    for (const [etichetta, nomeCampo] of campi) {
        let valore;
        const inputElement = form.querySelector(`[name="${nomeCampo}"]`);

        if (!inputElement) continue;

        if (inputElement.type === "radio") {
            const selectedRadio = form.querySelector(`input[name="${nomeCampo}"]:checked`);
            valore = selectedRadio ? selectedRadio.value : "";
        } else if (inputElement.type === "checkbox") {
            const checked = inputElement.checked;
            if (opzioniObbligatorie.includes(nomeCampo)) {
                valore = checked ? "SÌ" : "NO";
            } else if (soloSeFlaggato.includes(nomeCampo)) {
                if (!checked) continue;
                valore = "SÌ";
            }
        } else {
            valore = inputElement.value.trim();
        }

        // --- LOGICA SPECIALE PER "Materiale Connessione"
        if (nomeCampo === "materiale_connessione") {
            const moduloSerbatoiChecked = form.querySelector('input[name="modulo_serbatoi"]:checked');
            const moduloSerbatoiValore = moduloSerbatoiChecked ? moduloSerbatoiChecked.value : "";
            if (moduloSerbatoiValore !== "staccato") {
                continue; // NON stampare se modulo serbatoi non è staccato
            }
        }

        if (valore !== undefined && valore !== "") {
            doc.text(`${etichetta}: ${valore}`, 10, y);
            y += 7;
        }

        if (y > 270) {
            doc.addPage();
            y = 15;
        }
    }

    y += 5; // Spazio tra le sezioni
}



        // INSERIMENTO IMMAGINE delle valvole di sicurezza
        const valvoleChecked = form.querySelector('input[name="safety_valves"]').checked;
        if (valvoleChecked) {
            const img = new Image();
            img.src = "valvole_sicurezza.png"; // Deve essere nella stessa cartella
            img.onload = function() {
                if (y > 200) {
                    doc.addPage();
                    y = 15;
                }
                doc.addImage(img, 'PNG', 10, y, 60, 40);
                doc.save(`${numeroProgetto}_id_card.pdf`);
            };
        } else {
            doc.save(`${numeroProgetto}_id_card.pdf`);
        }
    });
});
