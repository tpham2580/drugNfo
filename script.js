import jsPDF from "/node_modules/jspdf/dist/jspdf.es.js";

//asynchronous call to grab drug generic and brand name
document.getElementById('search-med').addEventListener('click', function(event){
    var req1 = new XMLHttpRequest({mozSystem: true});
    var drug = document.getElementById('drug-input').value;
    var drugRx = "";

    req1.open('GET', 'https://rxnav.nlm.nih.gov/REST/rxcui.json?name=' + drug, true);
    req1.addEventListener('load',function(){
        if(req1.status >= 200 && req1.status < 400){
            var responseDrug = JSON.parse(req1.responseText);
            
            var req2 = new XMLHttpRequest({mozSystem: true});
            req2.overrideMimeType("application/json");
            var drugRx = responseDrug.idGroup["rxnormId"][0];
            console.log(drugRx);
            req2.open('GET', 'https://rxnav.nlm.nih.gov/REST/RxTerms/rxcui/' + drugRx + '/allinfo', true);
            req2.addEventListener('load',function(){
                if(req2.status >= 200 && req2.status < 400){
                    var responseRx = JSON.parse(req2.responseText);
                    console.log(responseRx);
                    document.getElementById('brand-output').textContent = "Brand Name: ";
                    document.getElementById('generic-output').textContent = "Generic Name: ";
                } else {
                    console.log("Error in network request: " + req2.statusText);
                }});
            req2.send(null);

            document.getElementById('brand-output').textContent = "Brand Name: ";
            document.getElementById('generic-output').textContent = "Generic Name: ";
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
            var responseDrug = JSON.parse(req1.responseText);
            var rxcui = responseDrug.idGroup["rxnormId"][0];
            medication_list.push(rxcui);
            makeList(drug);
            document.getElementById("check-interaction").disabled = false;
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
                var no_interaction = document.createElement("h2");
                no_interaction.setAttribute("id", "interaction-header")
                no_interaction.textContent = "There is an interaction.";
                interactions.appendChild(no_interaction);
                var all_interactions = response.fullInteractionTypeGroup[0]["fullInteractionType"];
                makeInteractionList(all_interactions);
            } else {
                var no_interaction = document.createElement("h2");
                no_interaction.setAttribute("id", "no-interaction-header")
                no_interaction.textContent = "No known interactions.";
                interactions.appendChild(no_interaction);
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
        var br = document.createElement('br');
        h3.innerHTML = "There is an interaction between " + drug1 + " and " + drug2;
        comment.innerHTML = interaction_list[drug]["interactionPair"][0]["description"];
        interactions.appendChild(h3)
        interactions.appendChild(comment)
        interactions.appendChild(br)
    }
}

// reset interaction list and comments
document.getElementById('reset-interaction').addEventListener('click', function(event){
    resetInteractionsList();
    resetInteractionComments();
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
    pdf.text("DrugNfo", 10, 15);

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

