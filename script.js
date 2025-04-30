document.addEventListener("DOMContentLoaded", () => {
    const dropArea = document.getElementById("drop-area");
    const fileInput = document.getElementById("file-input");
    const form = document.getElementById("unit-form");
    const generatePdfBtn = document.getElementById("generate-pdf");

    // CSV IMPORT
    function readCSV(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            parseCSV(event.target.result);
        };
        reader.readAsText(file);
    }

    function parseCSV(csvText) {
        const rows = csvText.trim().split("\n").map(row => row.split(","));
        if (rows.length < 2) return; // se non ci sono dati reali, esci

        const headers = rows[0].map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
        const data = rows[1].map(d => d.trim());

        headers.forEach((header, index) => {
            const value = data[index] || "";
            const elements = form.querySelectorAll(`[name="${header}"]`);

            elements.forEach(input => {
                if (!input) return;

                if (input.type === "radio") {
                    if (input.value === value) {
                        input.checked = true;
                    }
                } else if (input.type === "checkbox") {
                    input.checked = value.toLowerCase() === "sì";
                } else {
                    input.value = value;
                }
            });
        });

        // Aggiorna campi dinamici
        toggleExtraCablaggio();
        toggleMaterialeConnessione();
        toggleScambiatoriDettagli();
        toggleBendeDescrizione();
    }

    dropArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropArea.classList.add("dragover");
    });

    dropArea.addEventListener("drop", (e) => {
        e.preventDefault();
        dropArea.classList.remove("dragover");
        const file = e.dataTransfer.files[0];
        if (file && file.type === "text/csv") readCSV(file);
    });

    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file && file.type === "text/csv") readCSV(file);
    });

    // CSV EXPORT
    const exportCsvBtn = document.createElement("button");
    exportCsvBtn.textContent = "Esporta CSV";
    exportCsvBtn.id = "export-csv";
    exportCsvBtn.className = "csv-button";
    exportCsvBtn.addEventListener("click", () => {
        let headers = [];
        let values = [];

        const inputs = form.querySelectorAll("input, select");
        inputs.forEach(input => {
            const name = input.name;
            if (!name || headers.includes(name)) return;
            headers.push(name);
            if (input.type === "checkbox") {
                values.push(input.checked ? "SÌ" : "NO");
            } else if (input.type === "radio") {
                const selected = form.querySelector(`input[name="${name}"]:checked`);
                values.push(selected ? selected.value : "");
            } else {
                values.push(input.value);
            }
        });

        const csvContent = headers.join(",") + "\n" + values.join(",") + "\n";
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const numeroProgetto = form.querySelector('[name="numero_progetto"]').value || "unit";
        const a = document.createElement("a");
        a.href = url;
        a.download = `${numeroProgetto}_id_card.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    form.appendChild(exportCsvBtn);

    // GESTIONE CAMPI DINAMICI
    function toggleExtraCablaggio() {
        const cablaggio = form.querySelector('input[name="cablaggio_presente"]:checked')?.value;
        const quadro = form.querySelector('input[name="quadro_elettrico"]:checked')?.value;
        const container = document.getElementById("extra-cablaggio-container");
        if (container) {
            container.style.display = (cablaggio === "si" && (quadro === "non presente" || quadro === "staccato")) ? "block" : "none";
        }
    }

    function toggleMaterialeConnessione() {
        const modulo = form.querySelector('input[name="modulo_serbatoi"]:checked')?.value;
        const select = form.querySelector('select[name="materiale_connessione"]');
        if (select) {
            select.parentElement.style.display = (modulo === "staccato") ? "block" : "none";
        }
    }

    function toggleScambiatoriDettagli() {
        const check = form.querySelector('input[name="scambiatori_piatre"]');
        const dettaglio = form.querySelector('input[name="scambiatori_dettagli"]');
        if (check && dettaglio) {
            dettaglio.style.display = check.checked ? "block" : "none";
        }
    }

    function toggleBendeDescrizione() {
        const check = form.querySelector('input[name="bende_scaldanti"]');
        const descrizione = form.querySelector('input[name="bende_scaldanti_descrizione"]');
        if (check && descrizione) {
            descrizione.style.display = check.checked ? "block" : "none";
        }
    }

    form.addEventListener("change", () => {
        toggleExtraCablaggio();
        toggleMaterialeConnessione();
        toggleScambiatoriDettagli();
        toggleBendeDescrizione();
    });

    toggleExtraCablaggio();
    toggleMaterialeConnessione();
    toggleScambiatoriDettagli();
    toggleBendeDescrizione();

    // PDF EXPORT
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

        const sections = {
            "INFORMAZIONI GENERALI": [
                ["Nome Progetto", "nome_progetto"],
                ["Numero Progetto", "numero_progetto"],
                ["Anno", "anno"],
                ["Nome Progettista", "nome_progettista"],
                ["Nome Disegnatore", "nome_disegnatore"]
            ],
            "QUADRO ELETTRICO": [
                ["Quadro Elettrico", "quadro_elettrico"],
                ["Metri Cablaggio", "metri_cablaggio"],
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
                ["Dettaglio Valvole Piombate", "valvole_piombate_descrizione"],
                ["Fascette Metalliche", "fascette_metalliche"],
                ["Specialità 1", "specialita_1"],
                ["Descrizione 1", "specialita_1_descrizione"],
                ["Specialità 2", "specialita_2"],
                ["Descrizione 2", "specialita_2_descrizione"]
            ]
        };

        const opzioniObbligatorie = [
            "isolamento_ht",
            "isolamento_separatore_olio",
            "convogliamento",
            "cartucce_filtri_montate"
        ];

        const soloSeFlaggato = [
            "backup_unit",
            "safety_valves",
            "muffler",
            "scambiatori_piatre",
            "valvole_piombate",
            "fascette_metalliche",
            "specialita_1",
            "specialita_2"
        ];

        const inputs = form.querySelectorAll("input, select");
        const values = {};
        inputs.forEach(input => {
            const name = input.name;
            if (!name) return;
            if (input.type === "radio") {
                if (input.checked) values[name] = input.value;
            } else if (input.type === "checkbox") {
                values[name] = input.checked;
            } else {
                values[name] = input.value.trim();
            }
        });

        const numeroProgetto = values["numero_progetto"] || "unit";
        let inserisciImmagine = false;
        let yImmagine = 0;

        for (const [titoloSezione, campi] of Object.entries(sections)) {
            doc.setFont("helvetica", "bold");
            doc.text(titoloSezione, 10, y);
            y += 7;
            doc.setFont("helvetica", "normal");

            for (const [etichetta, nomeCampo] of campi) {
                let valore = values[nomeCampo];

                if (nomeCampo === "materiale_connessione" && values["modulo_serbatoi"] !== "staccato") continue;
                if (soloSeFlaggato.includes(nomeCampo) && !values[nomeCampo]) continue;

                if (opzioniObbligatorie.includes(nomeCampo)) {
                    valore = valore ? "SÌ" : "NO";
                } else if (typeof valore === "boolean") {
                    valore = valore ? "SÌ" : "NO";
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

            y += 5;
        }
doc.save(`${numeroProgetto}_id_card.pdf`);
       
    });
});

