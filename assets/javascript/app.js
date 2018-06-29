var config = {
  apiKey: "AIzaSyAcsQo2o9khUU0gXNYoJVnjO0TH2JkQhgc",
  authDomain: "trainscheduler-1438d.firebaseapp.com",
  databaseURL: "https://trainscheduler-1438d.firebaseio.com",
  storageBucket: "trainscheduler-1438d.appspot.com",
  messagingSenderId: "1028735041014"
};
firebase.initializeApp(config);
var database = firebase.database();


var data;

// Get new data when database change is dected
database.ref().on("value", function(snapshot) {

  // get new firebase data
  data = snapshot.val();

  // Update table
  refreshTable();

});

$("#addTrainBtn").on('click', function(){

  // get values from form
  var trainName = $("#nameInput").val().trim();
  var trainDestination = $("#destinationInput").val().trim();
  var trainFirstArrivalTime = $("#firstArrivalInput").val().trim();
  var trainFreq = $("#frequencyInput").val().trim();

  if(trainName == "" || trainName == null){
    alert("Please enter a Train Name!");
    return false;
  }
  if(trainDestination == "" || trainDestination == null){
    alert("Please enter a Train Destination!");
    return false;
  }
  if(trainFirstArrivalTime == "" || trainFirstArrivalTime == null){
    alert("Please enter a First Arrival Time!");
    return false;
  }
  if(trainFreq == "" || trainFreq == null || trainFreq < 1){
    alert("Please enter an arrival frequency (in minutes)!" + "\n" + "It must be an integer greater than zero.");
    return false;
  }
  // checking for Military Time
  if(trainFirstArrivalTime.length != 5 || trainFirstArrivalTime.substring(2,3) != ":"){
    alert("Please use Military Time! \n" + "Example: 01:00 or 13:00");
    return false;
  }
    // checking if numbers are to right and left of :
  else if( isNaN(parseInt(trainFirstArrivalTime.substring(0, 2))) || isNaN(parseInt(trainFirstArrivalTime.substring(3))) ){
    alert("Please use Military Time! \n" + "Example: 01:00 or 13:00");
    return false;
  }
    // checking if within 0-23 range
  else if( parseInt(trainFirstArrivalTime.substring(0, 2)) < 0 || parseInt(trainFirstArrivalTime.substring(0, 2)) > 23 ){
    alert("Please use Military Time! \n" + "Example: 01:00 or 13:00");
    return false;
  }
    // checking if within 0-59 range
  else if( parseInt(trainFirstArrivalTime.substring(3)) < 0 || parseInt(trainFirstArrivalTime.substring(3)) > 59 ){
    alert("Please use Military Time! \n" + "Example: 01:00 or 13:00");
    return false;
  }

  // gets date of new submission on click
  var today = new Date();
  var thisMonth = today.getMonth() + 1;
  var thisDate = today.getDate();
  var thisYear = today.getFullYear();


  var dateString = "";
  var dateString = dateString.concat(thisMonth, "/", thisDate, "/", thisYear);


  var trainFirstArrival = dateString.concat(" ", trainFirstArrivalTime);


  // adds new data to firebase
  database.ref().push({
    name: trainName,
    destination: trainDestination,
    firstArrival: trainFirstArrival,
    frequency: trainFreq
  });


  // clear input form fields
  $("#nameInput").val("");
  $("#destinationInput").val("");
  $("#firstArrivalInput").val("");
  $("#frequencyInput").val("");

  return false;
});


// Updates HTML table
function refreshTable(){

  // Clear old table data
  $('.table-body-row').empty();

  var arrayOfObjects = [];

  var arrayOfTimes = [];

  // append firebase data to HTML table
  $.each(data, function(key, value){


    // Collect value from firebase
    var trainName = value.name;
    var trainDestination = value.destination;
    var trainFreq = value.frequency;

    var trainFirstArrivalTime = value.firstArrival;

    var trainNextDeparture;
    var trainMinutesAway;


    var convertedDate = moment(new Date(trainFirstArrivalTime));

    // calculate minutes away
    var minuteDiffFirstArrivalToNow = moment(convertedDate).diff( moment(), "minutes")*(-1);

      // if train didn't arrive yet
      if(minuteDiffFirstArrivalToNow <= 0){

        // departure is current time minus arrival time
        trainMinutesAway = moment(convertedDate).diff( moment(), "minutes");

        // next departure is first departure time
        trainNextDepartureDate = convertedDate;

      }

      else{

        // next departure is  frequency - remainder of minutes from last departure
        trainMinutesAway = trainFreq - (minuteDiffFirstArrivalToNow % trainFreq);

        // next departure is current time + minutes away
        var trainNextDepartureDate = moment().add(trainMinutesAway, 'minutes');
      }
      //----------------------------------------------------------------

    // reformatting to AM/PM
    trainNextDeparture = trainNextDepartureDate.format("hh:mm A");
    //-----------------------------------------------------------------------------


    // new object for train locally
    var newObject = {
      name: trainName,
      destination: trainDestination,
      freq: trainFreq,
      nextDeparture: trainNextDeparture,
      minAway: trainMinutesAway
    };

    arrayOfObjects.push(newObject);

    arrayOfTimes.push(trainMinutesAway);

  });

  // sort time array from smallest to largest
  arrayOfTimes.sort(function(a, b){return a-b});

  // take away any duplicate values in array
  $.unique(arrayOfTimes)

  // Loop through all the time values and append the values to the HTML Table in order of departure time
  for(var i = 0; i < arrayOfTimes.length; i++){

    // check all times
    for(var j = 0; j < arrayOfObjects.length; j++){

      // minutes to departure is the next lowest value
      if(arrayOfObjects[j].minAway == arrayOfTimes[i]){

        // append objects to table
        // append new row from firebase
        var newRow = $('<tr>');
        newRow.addClass("table-body-row");

        // new data from firebase
        var trainNameTd = $('<td>');
        var destinationTd = $('<td>');
        var frequencyTd = $('<td>');
        var nextDepartureTd = $('<td>');
        var minutesAwayTd = $('<td>');

          // add text to cells
        trainNameTd.text(arrayOfObjects[j].name);
        destinationTd.text(arrayOfObjects[j].destination);
        frequencyTd.text(arrayOfObjects[j].freq);
        nextDepartureTd.text(arrayOfObjects[j].nextDeparture);
        minutesAwayTd.text(arrayOfObjects[j].minAway);

          // add cells to new row
        newRow.append(trainNameTd);
        newRow.append(destinationTd);
        newRow.append(frequencyTd);
        newRow.append(nextDepartureTd);
        newRow.append(minutesAwayTd);

        // append rows to table
        $('.table').append(newRow);

      }
    }
  }
}


// time is updated every second (1000 ms)
var timeStep = setInterval(currentTime, 1000);

function currentTime(){
  var timeNow = moment().format("hh:mm:ss A");
  $("#current-time").text(timeNow);

// refresh every minute
  var secondsNow = moment().format("ss");

  if(secondsNow == "00"){
    refreshTable();
  }

}
