import jsPDF from "./jspdf.es.js";

// search display div
var search_display = document.getElementById("search-display");

/*
//asynchronous call to grab drug generic and brand name
document.getElementById('search-med').addEventListener('click', async function(event){
    var drug = document.getElementById('drug-input').value;

    const drugRxCui = await fetch('https://rxnav.nlm.nih.gov/REST/rxcui.json?name=' + drug).then(response => response.json());
    console.log(drugRxCui.idGroup["rxnormId"][0]);
    this.drugRxCui = drugRxCui

    const drugSetId = await fetch('https://rxnav.nlm.nih.gov/REST/ndcproperties.json?id=' + this.drugRxCui.idGroup["rxnormId"][0]).then(response => response.json());
    console.log("setid below");
    console.log(drugSetId);



    event.preventDefault();
});
*/

/*
//asynchronous call to grab top 5 drug side effects
document.getElementById('search-med').addEventListener('click', function(event){
    var req1 = new XMLHttpRequest({mozSystem: true});
    var drug = JSON.stringify({"drug": document.getElementById('drug-input').value});
    var side_effect = JSON.stringify({"side-effect": "fatigue"})

    req1.open('GET', 'https://www.ehealthme.com/api/v1/ds/' + drug + "/" + side_effect, true);
    req1.addEventListener('load',function(){
        if(req1.status >= 200 && req1.status < 400){
            var responseDrug = JSON.parse(req1.responseText);
            console.log(responseDrug);
            document.getElementById('side-effect-output').textContent = "The top 5 side effects are: ";
        } else {
            console.log("Error in network request: " + req1.statusText);
        }});
    req1.send(null);



    event.preventDefault();
});
*/

// add medication to interaction rxcui list
var medication_list = [];
var medication_list_rxcui = [];
var ul = document.getElementById('interaction-list');

// add med to interaction rxcui list using async fetch
document.getElementById('add-med').addEventListener('click', async function(event){
    // disables button until finished with task
    document.getElementById('add-med').disabled = true;

    // resets iteraction comment
    resetInteractionComments()

    var drug = document.getElementById('drug-input').value.toLowerCase();

    var responseDrug = await fetch('https://rxnav.nlm.nih.gov/REST/rxcui.json?name=' + drug).then(response => response.json()).catch(function(error){ console.log(error); });
    clearSearchDisplay();
    var search_display_item = document.createElement('p');
    search_display_item.textContent = "Searching & Adding...";
    search_display_item.setAttribute("class", "search-display");
    search_display.appendChild(search_display_item);
    if (responseDrug.idGroup["rxnormId"] == undefined){
        clearSearchDisplay();
        var search_display_item = document.createElement('p');
        search_display_item.textContent = '" ' + drug + ' "' + " could not be found";
        search_display_item.setAttribute("class", "search-display")
        search_display.appendChild(search_display_item);

    } else {
        var rxcui = await responseDrug.idGroup["rxnormId"][0];
        var response_generic = await fetch('https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=' + rxcui + '&sources=DrugBank').then(response => response.json()).catch(function(error){ console.log(error); });

        var generic_name = await response_generic["interactionTypeGroup"][0]["interactionType"][0]["interactionPair"][0]["interactionConcept"][0]["sourceConceptItem"]["name"].toLowerCase();
        var generic_rxcui = await response_generic["interactionTypeGroup"][0]["interactionType"][0]["interactionPair"][0]["interactionConcept"][0]["minConceptItem"]["rxcui"];
        if (medication_list_rxcui.includes(generic_rxcui) && !medication_list.includes(drug)){
                // clears the search display upon
                clearSearchDisplay();
                
                if (generic_name == drug){
                    for (var medication = 0; medication < medication_list_rxcui.length; medication++){
                        if (medication_list_rxcui[medication] == generic_rxcui){
                            var index_medication_name = medication;
                        }
                    }
                    var search_display_item = document.createElement('p');
                    search_display_item.textContent = "There is already a brand version of the drug in the list: " + medication_list[index_medication_name];
                    search_display_item.setAttribute("class", "search-display")
                } else {
                    var search_display_item = document.createElement('p');
                    search_display_item.textContent = generic_name + " is the generic drug for " + '" ' + drug + ' "';
                    search_display_item.setAttribute("class", "search-display");
                }
                search_display.appendChild(search_display_item);
        } else if (medication_list_rxcui.includes(generic_rxcui) && medication_list.includes(drug)){
            // clears the search display upon
            clearSearchDisplay();
            var search_display_item = document.createElement('p');
            search_display_item.textContent = '" ' + drug + ' "' + " is already in list";
            search_display_item.setAttribute("class", "search-display");
            search_display.appendChild(search_display_item);
        } else {
            clearSearchDisplay();

            if (drug != generic_name){
                var search_display_item = document.createElement('p');
                search_display_item.textContent = "The generic name for " + drug + " is " + generic_name;
                search_display_item.setAttribute("class", "search-display");
                search_display.appendChild(search_display_item);
            }
            medication_list_rxcui.push(generic_rxcui);
            medication_list.push(drug)
            makeList(drug);
            document.getElementById("check-interaction").disabled = false;
        }
    }

    event.preventDefault();

    // reenables buttona after finished
    document.getElementById('add-med').disabled = false;
});


// adds medication to iteraction list
function makeList(drug) {
    var li = document.createElement('li');
    li.innerHTML = drug;
    ul.appendChild(li);
};

//checks for drug interactions using async fetch
document.getElementById('check-interaction').addEventListener('click', async function(event){

    if (medication_list_rxcui && medication_list_rxcui.length > 0){

        var getInteraction = 'https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=';
        for (var rx = 0; rx < medication_list.length; rx++){
            if (rx == 0){
                getInteraction += medication_list_rxcui[rx];
            } else {
                var add_item = "+" + medication_list_rxcui[rx];
                getInteraction += add_item;
            }
        }

        getInteraction += "&sources=DrugBank"

        var response = await fetch(getInteraction).then(response => response.json()).catch(function(error){ console.log(error); });
        resetInteractionComments();
        if ("fullInteractionTypeGroup" in response){
            // clears the search display upon
            clearSearchDisplay();

            var interaction_response = document.createElement("h2");
            interaction_response.setAttribute("id", "interaction-header")
            interaction_response.textContent = "There is an interaction.";
            interactions.appendChild(interaction_response);
            var all_interactions = response.fullInteractionTypeGroup[0]["fullInteractionType"];
            makeInteractionList(all_interactions);
        } else {
            // clears the search display upon
            clearSearchDisplay();

            var interaction_response = document.createElement("h2");
            interaction_response.setAttribute("id", "no-interaction-header");
            interaction_response.textContent = "No known interactions.";
            interactions.appendChild(interaction_response);
        } 

    } else {
        // clears the search display upon
        clearSearchDisplay();

        var interaction_response = document.createElement("h2");
        interaction_response.textContent = "The Interaction List is empty";
        interactions.appendChild(interaction_response);
    }
    
    // disables button until reset is clicked
    document.getElementById("check-interaction").disabled = true;

    event.preventDefault();
});

// interaction output create paragraph
var interactions = document.getElementById("interaction-div");
function makeInteractionList(interaction_list){
    for (var drug=0; drug<interaction_list.length; drug++){
        var drug1 = interaction_list[drug]["minConcept"][0]["name"].split(" ")[0];
        var drug2 = interaction_list[drug]["minConcept"][1]["name"].split(" ")[0];
        var h3 = document.createElement('h3');
        h3.className = "interaction-between";
        var comment = document.createElement('p');
        comment.className = "interaction-description"
        h3.innerHTML = "There is an interaction between " + drug1 + " and " + drug2;
        comment.innerHTML = interaction_list[drug]["interactionPair"][0]["description"];
        interactions.appendChild(h3)
        interactions.appendChild(comment)
    }
}

// reset interaction list and comments
document.getElementById('reset-interaction').addEventListener('click', function(event){
    resetInteractionsList();
    resetInteractionComments();

    // clears the search display upon
    clearSearchDisplay();
    document.getElementById("check-interaction").disabled = false;
});

// resets the unordered list
function resetInteractionsList(){
    ul.innerHTML = "";
    medication_list = [];
    medication_list_rxcui = [];
};

//resets interaction comments
function resetInteractionComments(){
    interactions.innerHTML = "";
}

//clears search display
function clearSearchDisplay(){
    search_display.innerHTML = "";
}

//exporting information as PDF file
document.getElementById('export-pdf').addEventListener('click', function(event){
    var pdf = new jsPDF();

    pdf.setFontSize("12");

    var drug_info_header = document.getElementById("drug-information-header").textContent;
    var drug_info_brand = document.getElementById("brand-output").textContent;
    var drug_info_generic = document.getElementById("generic-output").textContent;

    var drug_interact_header = document.getElementById("interaction-list-header").textContent;
    var interaction_list = document.getElementById("interaction-list").children;

    var h3_interaction_between = document.getElementsByClassName("interaction-between");
    var interaction_description = document.getElementsByClassName("interaction-description");

    pdf.setFont("times", "bold");
    var image = document.createElement('img');
    image.src = "images/heart-logo.png";
    pdf.addImage(image, 8, 9, 7, 7)
    pdf.text("DrugNfo", 15, 15);

    var x_coord = 10;
    var y_coord = 25;

    pdf.setFont("times", "normal");
    if (drug_info_brand != "") {
        pdf.setFont("times", "bold");
        pdf.text(drug_info_header, x_coord, y_coord);
        y_coord += 5

        pdf.setFont("times", "normal");
        pdf.text(drug_info_brand, x_coord, y_coord);
        y_coord += 5
        pdf.text(drug_info_generic, x_coord, y_coord);
        y_coord += 10
    }

    pdf.setFont("times", "bold");
    pdf.text(drug_interact_header, x_coord, y_coord);
    y_coord += 5

    pdf.setFont("times", "normal");
    for (var drug = 0; drug < interaction_list.length; drug++){
        pdf.text(interaction_list[drug].textContent, x_coord, y_coord);
        y_coord += 5
    }

    y_coord += 5

    for (var interaction = 0; interaction < h3_interaction_between.length; interaction++){
        pdf.setFont("times", "bold");
        pdf.text(h3_interaction_between[interaction].textContent, x_coord, y_coord);
        y_coord += 5

        pdf.setFont("times", "normal");
        pdf.text(interaction_description[interaction].textContent, x_coord, y_coord);
        y_coord += 10
    }



    pdf.save("medications.pdf")
});

