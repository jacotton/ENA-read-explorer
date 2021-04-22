const taxSearch = document.querySelector("#taxSearch")
const taxString = document.querySelector("#taxString")
const taxButtons = document.querySelector("#taxButtons")
const taxID = document.querySelector("#taxID")
const sampleSearch = document.querySelector("#sampleSearch")
const sampleResults = document.querySelector("#sampleResults")
const sampleSearchBox = document.querySelector("#sampleSearchBox")
const sampleResultsTable = document.querySelector("#sampleResultsTable")

/*
list all "results" 
https://www.ebi.ac.uk/ena/portal/api/results?dataPortal=ena
list return fields for sample:
https://www.ebi.ac.uk/ena/portal/api/returnFields?result=sample
list return fields for read_run:
https://www.ebi.ac.uk/ena/portal/api/returnFields?result=read_run
list query fields for sample:
https://www.ebi.ac.uk/ena/portal/api/searchFields?result=sample
or read_run:
https://www.ebi.ac.uk/ena/portal/api/searchFields?result=read_run
There is also a contolled vocab endpoint:
/controlledVocab?field=<fieldname>


*/

const removeRunResults = function () {
    const runResults = document.querySelectorAll(".runResult");
    for (let i of runResults) {
        i.remove()
    }
}

const getENArunResults = async function (e) {
    console.dir(e.accessionNumber);
    if (e.subTable) {
        removeRunResults();
        e.subTable = false;
    } else {
        await axios.get(`https://www.ebi.ac.uk/ena/portal/api/search?result=read_run&fields=library_strategy,run_accession,first_public,description,read_count,base_count&query=sample_accession=${e.accessionNumber}&&format=json`)
            .then((res) => {
                console.log(res)
                e.subTable = true;
                if (res.data) {
                    const newContainingTr = document.createElement("tr");
                    const newContainingTd = document.createElement("td");
                    newContainingTd.colSpan = 3;
                    newContainingTr.append(newContainingTd)
                    newContainingTd.classList.add("runResult")
                    newContainingTr.classList.add("runResult")
                    const newSubTable = document.createElement("table");
                    newContainingTd.append(newSubTable)
                    const newTablebody = document.createElement("tbody");
                    newSubTable.classList.add("table");
                    newSubTable.classList.add("runResult")
                    newSubTable.style.width = "100%"
                    newSubTable.append(newTablebody);
                    newTablebody.classList.add("runResult")
                    newSubTable.addEventListener('click', (f) => { e.subTable = false; removeRunResults() })
                    for (let d of res.data) {

                        const newTr = document.createElement("tr");
                        newTr.classList.add("runResult")
                        newTr.classList.add("has-text-light")
                        newTr.classList.add("has-background-grey-light")
                        newTr.classList.add("runResult")
                        const accessionTh = document.createElement("th")
                        accessionTh.append(d.run_accession);
                        accessionTh.classList.add("has-text-light")
                        accessionTh.classList.add("runResult")
                        const descriptionTd = document.createElement("td")
                        descriptionTd.append(d.description)
                        descriptionTd.classList.add("runResult")
                        const libStratTd = document.createElement("td")
                        libStratTd.append(d.library_strategy)
                        libStratTd.classList.add("runResult")
                        const dateTd = document.createElement("td")
                        dateTd.append(d.first_public)
                        dateTd.classList.add("runResult")
                        const readsTd = document.createElement("td")
                        readsTd.append(d.read_count + " reads")
                        readsTd.classList.add("runResult")
                        const bpTd = document.createElement("td")
                        bpTd.append(d.base_count + "bp")
                        bpTd.classList.add("runResult")
                        newTr.append(accessionTh, descriptionTd, libStratTd, dateTd, readsTd, bpTd)
                        newTablebody.append(newTr)
                    }
                    //add as next sib of the tr
                    e.parentNode.insertBefore(newContainingTr, e.nextSibling);
                    //e.append(newSubTable)
                } else {
                    console.log("ENA run search - no data")
                }
            }).catch((err) => {
                console.log("ENA run search -err " + err)
            })
    }
}

sampleSearch.addEventListener('submit', async (event) => {
    event.stopPropagation();
    event.preventDefault();
    clearSamplelist();
    sampleResultsTable.classList.add("is-hidden")
    removeRunResults();
    //  console.log("search for taxid=" + taxID.value)
    await axios.get("https://www.ebi.ac.uk/ena/portal/api/search?result=sample&fields=accession,description,sample_title&query=tax_tree(" + taxID.value + ")&&format=json")
        .then(res => {
            if (!res.data) {
                let alerter = document.createElement("span");
                alerter.append("ENA samples: no results");
                alerter.classList.add("suggestedTaxon")
                alerter.classList.add("is-danger")
                alerter.classList.add("tag")
                alerter.classList.add("m-2")
                sampleSearchBox.append(alerter)
            } else {
                const newP = document.createElement("p")
                newP.append("click sample rows to show run info. Be patient: each click polls the ENA API, so if there are many runs for a sample it cuold take a few seconds.")
                sampleSearchBox.append(newP)
                newP.classList.add("sampleResult")
                sampleResultsTable.classList.remove("is-hidden")
                for (let d of res.data) {
                    //     console.log(d);
                    const newTr = document.createElement("tr");
                    newTr.classList.add("sampleResult")
                    newTr.classList.add("has-text-link")
                    newTr.classList.add("has-background-link-light")
                    newTr.accessionNumber = d.accession
                    //toggle whether "runs" subtable is visible
                    newTr.subTable = false;
                    newTr.addEventListener('click', async (e) => { getENArunResults(newTr) });
                    const accessionTh = document.createElement("th")
                    accessionTh.append(d.accession);
                    accessionTh.classList.add("has-text-link")
                    const titleTd = document.createElement("td")
                    titleTd.append(d.sample_title)
                    const descriptionTd = document.createElement("td")
                    descriptionTd.append(d.description)
                    newTr.append(accessionTh, titleTd, descriptionTd)
                    sampleResults.append(newTr)
                }
            }
        }).catch((err) => {
            console.log("Err - " + err)
        })

})

taxSearch.addEventListener('submit', async (event) => {
    event.stopPropagation();
    event.preventDefault();
    destroyAllTaxSuggestions();
    try {
        await getENAtaxresults();
        await getNCBIresults();
    } catch (err) {
        //  console.log("ERROR = err!" + err);
    }
})

const destroyAllTaxSuggestions = function () {
    const taxSuggestions = document.querySelectorAll(".suggestedTaxon");
    for (let i of taxSuggestions) {
        i.remove()
    }
}

const clearSamplelist = function () {
    const sampleResults = document.querySelectorAll(".sampleResult");
    for (let i of sampleResults) {
        i.remove()
    }
}



/*ENA taxonomy search*/
const getENAtaxresults = async () => {
    axios.get("https://www.ebi.ac.uk/ena/taxonomy/rest/suggest-for-submission/" + taxString.value)
        .then(res => {
            //   console.log(res.data)
            if (res.data === "No results.") {
                let alerter = document.createElement("span");
                alerter.append("ENA: no results");
                alerter.classList.add("suggestedTaxon")
                alerter.classList.add("is-danger")
                alerter.classList.add("tag")
                alerter.classList.add("m-2")

                taxButtons.append(alerter);
            } else {
                for (let d of res.data) {
                    if (d.taxId) {
                        let newButton = document.createElement("a");
                        if (d.commonName) {
                            newButton.innerHTML = d.taxId + " " + d.commonName + "&nbsp;(<I>" + d.scientificName + "</I>)"
                        } else {
                            newButton.innerHTML = d.taxId + "&nbsp;<I>" + d.scientificName + "</I>"

                        }
                        newButton.classList.add("button")
                        newButton.classList.add("is-link")
                        newButton.classList.add("is-light")
                        newButton.classList.add("suggestedTaxon")
                        newButton.addEventListener('click', (e) => {
                            taxID.value = d.taxId;
                            destroyAllTaxSuggestions();
                        })
                        taxButtons.append(newButton)
                    }
                }
            }
        }).catch(err => {
            console.log("ERROR ", err)
        })
}


/* Search NCBI for taxonomy term - gives very different results to ENA portal */
const getNCBIresults = async () => {
    axios.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=taxonomy&term=" + taxString.value)
        .then(res => {
            let xmlDoc = undefined;
            if (window.DOMParser) {
                parser = new DOMParser();
                xmlDoc = parser.parseFromString(res.data, "text/xml");
            }
            //     console.log(xmlDoc)
            var err = xmlDoc.getElementsByTagName("PhraseNotFound");
            //   console.log(err)
            if (err.length > 0) {
                let alerter = document.createElement("span");
                alerter.append("NCBI: no results");
                alerter.classList.add("suggestedTaxon")
                alerter.classList.add("is-danger")
                alerter.classList.add("tag")
                alerter.classList.add("m-2")
                taxButtons.append(alerter);
                return false;
            } else {
                var ids = xmlDoc.getElementsByTagName("Id");
                idVect = []
                for (let i of ids) { idVect.push(i.textContent) }
                let idList = idVect.join(",");
                return axios.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=taxonomy&id=" + idList)
            }

        }).then(res => {
            let xmlDoc = undefined;
            if (window.DOMParser) {
                parser = new DOMParser();
                xmlDoc = parser.parseFromString(res.data, "text/xml");
            }

            //    console.log(res)
            //  console.log(xmlDoc)
            let ids = xmlDoc.getElementsByTagName("Id");
            for (let i of ids) {
                //console.log(i.parentNode)
                let rank = i.parentNode.querySelector('[Name="Rank"]');
                let commonName = i.parentNode.querySelector('[Name="CommonName"]');
                //'Item[Name = "commonName"]');
                let scientificName = i.parentNode.querySelector('[Name="ScientificName"]');
                //       console.log(i)
                //     console.log(commonName)
                //   console.log(scientificName)
                let newButton = document.createElement("a");
                newButton.innerHTML = i.textContent + " " + commonName.textContent + "&nbsp;(<I>" + scientificName.textContent + "</I>)"
                if (rank.textContent !== "species") {
                    newButton.append(` [${rank.textContent}]`)
                }
                newButton.classList.add("button")
                newButton.classList.add("is-primary")
                newButton.classList.add("is-light")
                newButton.classList.add("suggestedTaxon")
                newButton.addEventListener('click', (e) => {
                    taxID.value = i.textContent;
                    destroyAllTaxSuggestions();
                })
                taxButtons.append(newButton)

            }
        })


        .catch(err => {
            console.log("ERROR IN POLLING NCBI or ENA APIs ", err)
        })

}