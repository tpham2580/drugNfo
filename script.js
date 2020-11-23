import jsPDF from "./jspdf.es.js";

// search display div
var search_display = document.getElementById("search-display");

// referenced Dev Ed's youtube video for help on image carousel
//
const carouselSlide = document.querySelector('.carousel-slide');
const carouselImages = document.getElementsByClassName('image-carousel');
console.log(carouselImages)

const prev_button = document.querySelector('#prev-button');
const next_button = document.querySelector('#next-button');

// counter for image location
let counter = 1;
const size = 600; // size of image to slide over

// moves one picture forward and sets first image as the actual intended first image
carouselSlide.style.transform = "translateX(" + (-size * counter) + "px";

// listener for image next button
next_button.addEventListener('click', ()=>{
    if (counter >= carouselImages.length - 1) return;
    carouselSlide.style.transition = "transform 0.4s ease-in-out";
    counter++; //adds one to counter
    carouselSlide.style.transform = "translateX(" + (-size * counter) + "px";
})

// listener for image prev button
prev_button.addEventListener('click', ()=>{
    if (counter <= 0) return;
    carouselSlide.style.transition = "transform 0.4s ease-in-out";
    counter--; //subtracts one to counter
    carouselSlide.style.transform = "translateX(" + (-size * counter) + "px";
})

// listener that goes off every time transition ends
carouselSlide.addEventListener('transitionend', () => {
    if (carouselImages[counter].id === 'last-clone'){
        carouselSlide.style.transition = "none"; // takes out transition so we can translate back to first original pic
        counter = carouselImages.length - 2; // moves to last
        carouselSlide.style.transform = "translateX(" + (-size * counter) + "px";
    }
    if (carouselImages[counter].id === 'first-clone'){
        carouselSlide.style.transition = "none"; // takes out transition so we can translate back to first original pic
        counter = carouselImages.length - counter; // moves to last
        carouselSlide.style.transform = "translateX(" + (-size * counter) + "px";
    }
});

//interval for autoscroll
function runAutoSxroll() {
    if (counter >= carouselImages.length - 1) return;
    carouselSlide.style.transition = "transform 0.4s ease-in-out";
    counter++; //adds one to counter
    carouselSlide.style.transform = "translateX(" + (-size * counter) + "px";

    setTimeout(runAutoSxroll, 7200);
};
runAutoSxroll(); //calls interval

// initializes medication list and rxcui list
var medication_list = [];
var medication_list_rxcui = [];
var ul = document.getElementById('interaction-list');

// adds medication to interaction list display
function makeList(drug) {
    var li = document.createElement('li');
    li.innerHTML = drug;
    ul.appendChild(li);
};

// reset interaction list and comments
document.getElementById('reset-interaction').addEventListener('click', function(event){
    resetInteractionsList();
    resetInteractionComments();

    // clears the search display upon and reenables the check-interaction button
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
        var response = await fetch('https://rxnav.nlm.nih.gov/REST/rxcui/' + rxcui + '/historystatus.json').then(response => response.json()).catch(function(error){ console.log(error); });
        var response_generic = await response["rxcuiStatusHistory"];
        console.log(response_generic);

        if (response_generic["derivedConcepts"] != null){
            var generic_name = await response_generic["derivedConcepts"]["ingredientConcept"][0]["ingredientName"].toLowerCase();
            var generic_rxcui = await response_generic["derivedConcepts"]["ingredientConcept"][0]["ingredientRxcui"].toLowerCase();
        } else {
            var generic_name = await response_generic["attributes"]["name"].toLowerCase();
            var generic_rxcui = await response_generic["attributes"]["rxcui"].toLowerCase();
        }
        
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
    console.log(interaction_list);
    console.log(medication_list_rxcui)
    for (var drug=0; drug<interaction_list.length; drug++){
        var drug1_rxcui = interaction_list[drug]["minConcept"][0]["rxcui"];
        for (var rxcui = 0; rxcui < medication_list_rxcui.length; rxcui++){
            if (medication_list_rxcui[rxcui] == drug1_rxcui){
                var index_1 = rxcui
            }
        }

        var drug2_rxcui = interaction_list[drug]["minConcept"][1]["rxcui"];
        for (var rxcui = 0; rxcui < medication_list_rxcui.length; rxcui++){
            if (medication_list_rxcui[rxcui] == drug2_rxcui){
                var index_2 = rxcui
            }
        }
        var h3 = document.createElement('h3');
        h3.className = "interaction-between";
        var comment = document.createElement('p');
        comment.className = "interaction-description";

        if (medication_list[index_1] == interaction_list[drug]["minConcept"][0]["name"].toLowerCase()){
            var drug1 = medication_list[index_1];
        } else {
            var drug1 = medication_list[index_1] + "[Generic Name: " + interaction_list[drug]["minConcept"][0]["name"].toLowerCase() + "]";
        }

        if (medication_list[index_2] == interaction_list[drug]["minConcept"][1]["name"].toLowerCase()){
            var drug2 = medication_list[index_2];
        } else {
            var drug2 = medication_list[index_2] + "[Generic Name: " + interaction_list[drug]["minConcept"][1]["name"].toLowerCase() + "]";
        }

        h3.innerHTML = "There is an interaction between " + drug1 + " and " + drug2;
        comment.innerHTML = interaction_list[drug]["interactionPair"][0]["description"];
        interactions.appendChild(h3)
        interactions.appendChild(comment)
    }
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



    pdf.save("DrugNfo-Interactions.pdf")
});

