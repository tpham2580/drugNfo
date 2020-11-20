import jsPDF from "./jspdf.es.js";

// search display div
var search_display = document.getElementById("search-display");

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

//asynchronous call to grab top 5 drug side effects
document.getElementById('search-med').addEventListener('click', function(event){
    var req1 = new XMLHttpRequest({mozSystem: true});
    var drug = {"name": document.getElementById('drug-input').value};
    var side_effect = {"side-effect": "fatigue"}

    req1.open('GET', 'https://www.ehealthme.com/api/v1/ds/' + drug + "/" + side_effect, true);
    req1.addEventListener('load',function(){
        if(req1.status >= 200 && req1.status < 400){
            var responseDrug = JSON.parse(req1.responseText);

            document.getElementById('side-effect-output').textContent = "The top 5 side effects are: ";
        } else {
            console.log("Error in network request: " + req1.statusText);
        }});
    req1.send(null);



    event.preventDefault();
});

// add medication to interaction rxcui list
var medication_list = [];
var ul = document.getElementById('interaction-list');
document.getElementById('add-med').addEventListener('click', function(event){
    var req1 = new XMLHttpRequest({mozSystem: true});
    var drug = document.getElementById('drug-input').value;

    req1.open('GET', 'https://rxnav.nlm.nih.gov/REST/rxcui.json?name=' + drug, true);
    req1.addEventListener('load',function(){
        if(req1.status >= 200 && req1.status < 400){
            // clears the search display upon
            clearSearchDisplay();

            var responseDrug = JSON.parse(req1.responseText);
            if (responseDrug.idGroup["rxnormId"] == undefined){
                var search_display_item = document.createElement('p');
                search_display_item.textContent = '" ' + drug + ' "' + " could not be found";
                search_display_item.setAttribute("class", "search-display")
                search_display.appendChild(search_display_item);
            } else {
                var rxcui = responseDrug.idGroup["rxnormId"][0];
                if (medication_list.includes(rxcui)){
                    // clears the search display upon
                    clearSearchDisplay();
                    var search_display_item = document.createElement('p');
                    search_display_item.textContent = '" ' + drug + ' "' + " is already in list";
                    search_display_item.setAttribute("class", "search-display")
                    search_display.appendChild(search_display_item);
                } else {
                    medication_list.push(rxcui);
                    makeList(drug);
                    document.getElementById("check-interaction").disabled = false;
                }
                
            }
            
        } else {
            console.log("Error in network request: " + req1.statusText);
        }});

    req1.send(null);

    event.preventDefault();
});

// adds medication to iteraction list
function makeList(drug) {
    var li = document.createElement('li');
    li.innerHTML = drug;
    ul.appendChild(li);
};

//checks for drug interactions
document.getElementById('check-interaction').addEventListener('click', function(event){
    var req2 = new XMLHttpRequest({mozSystem: true});
    var getInteraction = 'https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=';
    for (var rx = 0; rx < medication_list.length; rx++){
        if (rx == 0){
            getInteraction += medication_list[rx];
        } else {
            var add_item = "+" + medication_list[rx];
            getInteraction += add_item;
        }
    }

    getInteraction += "&sources=DrugBank"

    req2.open('GET', getInteraction, true);
    req2.addEventListener('load',function(){
        if(req2.status >= 200 && req2.status < 400){
            var response = JSON.parse(req2.responseText);
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
                interaction_response.setAttribute("id", "no-interaction-header")
                interaction_response.textContent = "No known interactions.";
                interactions.appendChild(interaction_response);
            }
            
            // disables button until reset is clicked
            document.getElementById("check-interaction").disabled = true;

        } else {
            console.log("Error in network request: " + req2.statusText);
        }});

    req2.send(null);

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

