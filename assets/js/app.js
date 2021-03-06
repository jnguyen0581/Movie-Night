// $(document).ready(function () {

// Initialize Firebase
var config = {
    apiKey: "AIzaSyB3ognBnBLe-vgaHhsZV7ksufHgzg21VFs",
    authDomain: "movie-night-464be.firebaseapp.com",
    databaseURL: "https://movie-night-464be.firebaseio.com",
    projectId: "movie-night-464be",
    storageBucket: "movie-night-464be.appspot.com",
    messagingSenderId: "123201978661"
};
firebase.initializeApp(config);

///////////////////////////////////
/////   Login/Auth stuff  ////////
/////////////////////////////////

var currentUser = "";
var currentUserId = "";
// //Handle Account Status
(function initApp() {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            currentUser = user.email;
            currentUserId = user.uid;

        } else {
            // User is signed out.
            // ...
        }
    });
})();

////////////////////////////////////////
//////   Database stuff ///////////////
//////////////////////////////////////

var database = firebase.database();
var eventKey = "";
var allEvents = "";
var thisEvent = "";
var emailReminderArray = [];

//Establish first event page on load
database.ref("/users").once("value").then(function (snap) {
    snap.forEach(function (child) {
        if (child.key === currentUserId) {
            var eventList = child.val().events;
            setThisEvent(eventList)
            eventTabLoad(eventList);
        } //end If
    }) //end forEach()
})

database.ref("/events").once("value").then(function (snap) {
    setAllEvents(snap.val());
})

database.ref("/events/" + eventKey).on("child_changed", function (snapshot) {
    thisEvent = snapshot.val();
    pageLoad();
})

function setThisEvent(eventItem) {
    var tempEventArray = [];
    $.each(eventItem, function (key, value) {
        tempEventArray.push(value);
    });
    eventKey = tempEventArray[1];
}

function setAllEvents(eventObject) {
    allEvents = eventObject;
    thisEvent = allEvents[eventKey];
    pageLoad();
}

function eventTabLoad(list) {
    var eventArray = [];
    $.each(list, function (key, value) {
        eventArray.push(value);
    });

    for (var i = 1; i < eventArray.length; i++) {
        var newTab = $("<button>").addClass("tab-button btn btn-secondary").attr("data-tab", eventArray[i]).text("Event " + i);
        $("#tab-display").append(newTab);
    } //end For
}

//On Page Load
function pageLoad() {
    $("#saved-movies").empty();
    $("#email-display").empty();
    $("#winner-display").empty();
    $("#email-display").hide();
    $("#event-name").text(thisEvent.eventName);
    $("#event-date").text(thisEvent.eventDate);

    //Adding the email reminders
    emailReminderArray = [];
    for (var i = 0; i < thisEvent.guests.length; i++) {
        var whichEmail = thisEvent.guests[i].name;
        emailReminderArray.push(whichEmail);
        var newEmail = $("<p>").addClass("email-item").attr("data-email", whichEmail).text(whichEmail);

        // var newButton = $("<button>").addClass("reminder-button btn btn-primary").attr("data-email", whichEmail).text("Reminder");
        var newLink = $("<a>").attr("href", "mailto:" + whichEmail + "?subject=You're Invited to a Movie Night&body=Hi, Please come to the next movie night. Be sure to add suggestions and vote first.").addClass("reminder-link");
        newLink.text("Remind");
        newEmail.append(newLink);

        $("#email-display").append(newEmail);
    }

    //Adding the movie suggestion list
    for (var i = 1; i < thisEvent.suggestionList.length; i++) {
        var newTitle = thisEvent.suggestionList[i].title;
        var newItem = $("<div>").addClass("suggestion-container");

        var newTitleCard = $("<div>").addClass("list-item");
        var titleTitle = $("<h3>").addClass("list-title").attr("data-item", i).attr("data-hidden", "true").text(newTitle);
        newTitleCard.append(titleTitle);
        var upVoteButton = $("<img>").addClass("upvote").attr("data-item", i).attr("src", "assets/images/thumbs-up-32.png");
        var downVoteButton = $("<img>").addClass("downvote").attr("data-item", i).attr("src", "assets/images/thumbs-down-32.png");
        newTitleCard.append(upVoteButton, downVoteButton);

        var newDropDown = $("<div>").addClass("suggestion-info movie-" + i).attr("data-title", newTitle).attr("data-item", i);
        var newPoster = $("<img>").attr("src", thisEvent.suggestionList[i].poster).addClass("poster-img");
        newDropDown.append(newPoster);
        newDropDown.append("<p>" + thisEvent.suggestionList[i].year);
        newDropDown.append("<p>" + thisEvent.suggestionList[i].plot);
        newDropDown.append("<p>Metascore: " + thisEvent.suggestionList[i].metascore);

        newItem.append(newTitleCard, newDropDown);
        newDropDown.hide();
        $("#saved-movies").append(newItem);

        var blerg = (emailReminderArray.length * 2) - i;
        $("#suggestion-list").html("<h3>Suggested Movies - Vote 2 Up and 2 Down</h3><h5>(Note: There are still " + blerg + " movies that need to be suggested.)")
    }

    //Adding the Winner
    
    var winnerWinner = 0;
    var winnerGbId = "";
    $.each(thisEvent.suggestionList, function (key, value) {
        if (winnerWinner < value.votes) {
            $("#winner-display").empty();
            winnerWinner = value.votes;
            $("#winner-display").append("<h3>" + value.title + "</h3>");
            winnerGbId = value.guideboxId;
        }
    });

    var queryURL = "https://api-public.guidebox.com/v2/movies/" + winnerGbId + "?api_key=784a0a8429f1789c7473e19007cce274f76df272&";

    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function (response) {
        if (response.in_theaters == true) {
            $("#winner-display").append("In Theaters Now");
        } 
        $.each(response.subscription_web_sources, function (key, value) {
            $("#winner-display").append("<br>");
            $("#winner-display").append("<a href=" + value.link + ">" + value.display_name + "</a>");
        });
        $.each(response.purchase_web_sources, function (key, value) {
            $("#winner-display").append("<br>");
            $("#winner-display").append("<a href=" + value.link + ">" + value.display_name + "</a>");
        });
    }) //end AJAX 
} //End pageLoad()

// Invite Friends - <a href="mailto:emadamczyk@hotmail.com?subject=You're Invited to a Movie Night&body=Hi, Please come to the next movie night. Be sure to add suggestions and vote first."></a>
// pull list of guest emails invited and use for loop to iterate and mailto
// $("#sendInvite").on("click", function () {
//     console.log("invite who?")

// })

///////////////////////////////////////
//  API CALLS AND APP FUNCTIONALITY //
/////////////////////////////////////

//grab index of current user
function currentUserAsGuest(guest) {
    return guest.name == currentUser;
}

//Get Movie Data
function getMovieData(movie) {
    var queryURL = "https://api-public.guidebox.com/v2/search?api_key=784a0a8429f1789c7473e19007cce274f76df272&type=movie&field=title&query=" + movie;

    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function (response) {
        $("#movie-display").append("<h3>Search results: </h3>");
        for (var i = 0; i < response.results.length; i++) {
            var newMovie = $("<p>").addClass("search-result").attr("data-id", response.results[i].imdb).attr("data-title", response.results[i].title).attr("data-guideboxId", response.results[i].id).text(response.results[i].title + ", " + response.results[i].release_year);
            $("#movie-display").append(newMovie);
        }
    }) //end AJAX 
} //end Get Movie Data

$("#suggestion-submit").on("click", function (event) {
    event.preventDefault();
    var title = $("#suggestion-input").val().trim();
    $("#suggestion-input").val("");
    getMovieData(title);
})

//Adding a movie to the list
$(document).on("click", ".search-result", function () {
    var newMovie = $(this).attr("data-title");
    var newId = $(this).attr("data-id");
    var newGuidebox = $(this).attr("data-guideboxId")
    var newQuery = "https://www.omdbapi.com/?apikey=168f295&i=" + newId + "&type&y=&plot=short"
    $.ajax({
        url: newQuery,
        method: "GET"
    }).then(function (response) {
        if (thisEvent.guests.find(currentUserAsGuest).suggestions.length < thisEvent.suggestionCap) {
            var newSuggestion = {
                title: response.Title,
                poster: response.Poster,
                year: response.Year,
                plot: response.Plot,
                metascore: response.Metascore,
                votes: 0,
                guideboxId: newGuidebox
            }
            thisEvent.guests.find(currentUserAsGuest).suggestions.push(newMovie);
            thisEvent.suggestionList.push(newSuggestion);
            database.ref("/events/" + eventKey).set(thisEvent);

        } else {
            $("#movie-display").append("You've entered enough, haven't you?");
        }

    }) //end AJAX 
    $("#movie-display").empty();
})

//Display Movie Info on.Click
$(document).on("click", ".list-title", function () {
    var whichMovie = $(this).attr("data-item");
    if ($(this).attr("data-hidden") === "true") {
        $(".movie-" + whichMovie).show();
        $(this).attr("data-hidden", "false");
    } else {
        $(".movie-" + whichMovie).hide();
        $(this).attr("data-hidden", "true");
    }
})

//Vote Buttons
$(document).on("click", ".upvote", function () {
    $("#movie-display").empty();
    if (thisEvent.guests.find(currentUserAsGuest).upVotesRemaining > 0) {

        var whichMovie = $(this).attr("data-item");
        thisEvent.suggestionList[whichMovie].votes++;
        thisEvent.guests.find(currentUserAsGuest).upVotesRemaining--;
        database.ref("/events/" + eventKey).set(thisEvent);
    } else {
        $("#movie-display").append("You've entered enough, haven't you?");
    }
}) //end UpVoteButton

$(document).on("click", ".downvote", function () {
    $("#movie-display").empty();
    if (thisEvent.guests.find(currentUserAsGuest).downVotesRemaining > 0) {
        var whichMovie = $(this).attr("data-item");
        thisEvent.suggestionList[whichMovie].votes--;
        thisEvent.guests.find(currentUserAsGuest).downVotesRemaining--;
        database.ref("/events/" + eventKey).set(thisEvent);
    } else {
        $("#movie-display").append("You've entered enough, haven't you?");
    }
}) //end DownVoteButton

//Event Tabs
$(document).on("click", ".tab-button", function () {
    var whichTab = $(this).attr("data-tab");
    database.ref("/events").child(whichTab).once("value").then(function (snap) {
        thisEvent = snap.val();
        eventKey = snap.key;
    })
    pageLoad();
})

//Send Reminder Emails to guests
$("#reminders").on("click", function (event) {
    event.preventDefault();
    if ($(this).attr("data-shown") === "false") {
        $("#email-display").show();
        $(this).attr("data-shown", "true");
    } else {
        $("#email-display").hide();
        $(this).attr("data-shown", "false");
    }
})

//Logout 
$("#logout").on("click", function (event) {
    event.preventDefault();
    console.log("kbye")
    firebase.auth().signOut().then(function () {
        // Sign-out successful.
        window.location = "index.html";
    }, function (error) {
        // An error happened.
    });
})

// });
