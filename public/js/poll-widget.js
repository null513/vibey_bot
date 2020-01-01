
// Pusher Poduction *** UNCOMMENT THIS BEFORE COMMIT ***
var pusher = new Pusher('94254303a6a5048bf191', {
  cluster: 'us2',
  forceTLS: true
});

// // Pusher DEVELOPMENT
// var pusher = new Pusher('41f9377a48633b3302ff', {
//   cluster: 'us2',
//   forceTLS: true
// });

//Subscribe to Poll Namescape
var socket = io('/polls-namescape');

var pollColors = ["#003066", "#e7267f", "#9e34eb", "#E100CD", "#00A2BB", "#bc5706", "#d7b005"]

var wintl = new TimelineLite();
wintl
  .to('#pollwin', 0.1, { x: -500 })
  .to('#pollwin', 1, { x: 0 })
  .to('#pollwin', 1, { x: -500, delay: 10 });

wintl.pause(.1)

// Chart
$(document).ready(function () {

  // Init Chart
  new Chartkick.PieChart("chart-1", [], { donut: true, colors: pollColors, legend: false });
  // Fetch active polls
  $.getJSON("/api/polls", function (data, textStatus, jqXHR) {
    console.log(data)
    if (data.length > 0) {
      var poll = data[data.length - 1]
      if (poll.active === true) {
        let chart = Chartkick.charts["chart-1"]
        var data = []
        var textCont = document.getElementById("polltext");
        var textElem = document.createElement("div");
        var choices = document.createElement('ul');

        textElem.setAttribute('class', 'card text-white bg-info ml-3 mt-3')
        choices.setAttribute('class', 'list-group list-group-flush text-dark');
        textElem.innerHTML = `
    <div class="card-header"><h2>${poll.polltext}</h2></div>
  `

        poll.choices.forEach(function (choice, i) {
          var cI = i + 1
          var choiceElem = document.createElement('li')
          choiceElem.setAttribute('class', 'list-group-item bg-info text-white')
          choiceElem.innerHTML = `<div class="choiceColor mr-2" style="background-color: ${pollColors[i]};"></div> <h4>!c ${cI} = ${choice.text}</h4>`
          choices.append(choiceElem);

          console.log(choice)
          var choiceArr = [`${choice.text}`, choice.votes]
          data.push(choiceArr)
        })
        textElem.append(choices)
        textCont.append(textElem)

        chart.updateData(data)

        TweenMax.from(`#poll`, 1, { x: -500, autoAlpha: 0 });
        wintl.pause(.1)

      } else {
        TweenMax.to(`#poll`, 0.1, { x: -500, autoAlpha: 0 });
      }
    } else {

    }

  });

});

socket.on('pollOpen', function (data) {
  console.log('Poll Open')
  let chart = Chartkick.charts["chart-1"]
  let poll = data.poll
  var data = []
  var textCont = document.getElementById("polltext");
  var textElem = document.createElement("div");
  var choices = document.createElement('ul');

  textElem.setAttribute('class', 'card text-white bg-info ml-3 mt-3')
  choices.setAttribute('class', 'list-group list-group-flush text-dark');
  textElem.innerHTML = `
          <div class="card-header"><h2>${poll.polltext}</h2></div>
        `

  poll.choices.forEach(function (choice, i) {
    var cI = i + 1
    var choiceElem = document.createElement('li')
    choiceElem.setAttribute('class', 'list-group-item bg-info text-white')
    choiceElem.innerHTML = `<div class="choiceColor mr-2" style="background-color: ${pollColors[i]};"></div> <h4>!c ${cI} = ${choice.text}</h4>`
    choices.append(choiceElem);

    var choiceArr = [`${choice.text}`, choice.votes];
    data.push(choiceArr);
  });
  // chart.destroy();
  // console.log(chart)
  textElem.append(choices)
  textCont.append(textElem)
  chart.updateData(data)
  wintl.pause(0.1)
  TweenMax.to(`#poll`, 1, { x: 0, autoAlpha: 1 });

});

socket.on('pollUpdate', function (data) {
  console.log(data.doc)
  var chart = Chartkick.charts["chart-1"]
  var newData = []

  data.doc.choices.forEach(choice => {
    var choiceArr = [`${choice.text}`, choice.votes]
    newData.push(choiceArr)
  })
  chart.updateData(newData)
  newData = []
});

socket.on('pollClose', function (data) {
  console.log('Poll Closed')
  var winCont = document.getElementById('pollwin')
  winCont.innerHTML = `
  <div class="card text-white bg-success ml-3">
  <div class="card-header"><h2>The winner is:</h2></div>
  <div class="card-body">
    <h1 class="card-title">${data.winText}</h1>
  </div>
</div>
  `
  wintl.play()
  TweenMax.to(`#poll`, 1, { x: -500, autoAlpha: 0, onComplete: clearText() });
  function clearText() {
    document.getElementById('polltext').innerHTML = '';
  }
});

