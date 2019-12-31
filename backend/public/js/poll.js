// Pusher Poduction *** UNCOMMENT THIS BEFORE COMMIT ***
// var pusher = new Pusher('94254303a6a5048bf191', {
//   cluster: 'us2',
//   forceTLS: true
// });

// Pusher DEVELOPMENT
// var pusher = new Pusher('41f9377a48633b3302ff', {
//   cluster: 'us2',
//   forceTLS: true
// });



$("#menu-toggle").click(function (e) {
  e.preventDefault();
  $("#wrapper").toggleClass("toggled");
});

const Toast = Swal.mixin({
  toast: true,
  position: 'top',
  showConfirmButton: false,
  timer: 2000,
})

$(document).ready(function () {
  // Fetch active polls
  fetch(`/api/polls`)
    .then(response => {
      return response.json()
    })
    .then(data => {
      console.log(data)
      data.forEach(poll => {
        console.log(poll.active)

        if (poll.active === true) {
          console.log('Poll Open')
          var openCont = document.getElementById('openPolls');
          var pollElem = document.createElement('div');
          var choices = document.createElement('ul');
          var footer = document.createElement('div');
          var total = 0;
          pollElem.setAttribute('id', `${poll._id}`);
          pollElem.setAttribute('class', 'card bg-dark mb-3');
          choices.setAttribute('class', 'list-group list-group-flush text-dark');
          choices.setAttribute('id', `${poll.id}choices`);

          pollElem.innerHTML = `
            <div class="currText card-header">
            	<i id="${poll._id}status" class="spinner fas fa-circle-notch" style="color:limegreen"></i> ${poll.polltext}
            </div>
          `
          poll.choices.forEach(choice => {
            total = total + choice.votes;
          })

          poll.choices.forEach(choice => {
            var choiceElem = document.createElement('li')
            var perc = (100 * choice.votes) / total
            console.log(perc)
            choiceElem.setAttribute('id', `${poll._id + choice.id}`)
            choiceElem.setAttribute('class', 'list-group-item')
            choiceElem.innerHTML = `
            ${choice.text}
              <div class="progress">
                <div id="${poll._id + choice.id}bar" class="progress-bar" role="progressbar" style="width: ${perc}%">${choice.votes}(${Math.round(perc * 10) / 10}%)</div>
              </div>
            `
            choices.append(choiceElem);
          })

          footer.innerHTML = `
            <div id="${poll._id}footer" class="card-footer text-muted">
              <button class="btn btn-danger closePoll" pollid="${poll._id}">Close Poll</button>
            </div>
            `

          pollElem.append(choices)
          pollElem.append(footer)
          openCont.append(pollElem)
          TweenMax.to(`#${poll._id}status`, 3, { rotation: "360", ease: Linear.easeNone, repeat: -1 });
        }

        if (poll.active === false) {
          console.log('Poll Closed')
          var closedCont = document.getElementById('closedPolls');
          var pollElem = document.createElement('div');
          var choices = document.createElement('ul');
          var footer = document.createElement('div');
          var total = 0;
          pollElem.setAttribute('id', `${poll._id}`);
          pollElem.setAttribute('class', 'card bg-dark mb-3');
          choices.setAttribute('class', 'list-group list-group-flush text-dark');
          choices.setAttribute('id', `${poll.id}choices`);

          pollElem.innerHTML = `
            <div class="currText card-header">
            	<i id="${poll._id}status" class="spinner far fa-times-circle" style="color:red"></i> ${poll.polltext}
            </div>
          `
          poll.choices.forEach(choice => {
            total = total + choice.votes;
          })

          poll.choices.forEach(choice => {
            var choiceElem = document.createElement('li')
            var perc = (100 * choice.votes) / total
            console.log(perc)
            choiceElem.setAttribute('id', `${poll._id + choice.id}`)
            if (poll.winner === poll._id + choice.id) {
              choiceElem.setAttribute('class', 'list-group-item bg-success text-white')
            } else {
              choiceElem.setAttribute('class', 'list-group-item');
            }
            choiceElem.innerHTML = `
            ${choice.text}
              <div class="progress">
                <div id="${poll._id + choice.id}bar" class="progress-bar" role="progressbar" style="width: ${perc}%">${choice.votes}(${Math.round(perc * 10) / 10}%)</div>
              </div>
            `
            choices.append(choiceElem);
          })

          pollElem.append(choices)
          closedCont.prepend(pollElem)
        }
      });
    })
    .catch(err => {
      return
      console.error(err)
    })

  // Create poll on form submit
  $("#poll-form").submit(function (e) {
    e.preventDefault();
    var form = $(this);
    var action = form.attr("action");
    var data = form.serializeArray();
    console.log(data)
    $.ajax({
      url: action,
      dataType: 'json',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: function (poll) {
        console.log("Poll Created" + poll);
        Toast.fire({
          type: 'success',
          title: 'Poll Opened'
        })
        console.log('Poll Opened')

        var pollCont = document.getElementById('openPolls');
        var pollElem = document.createElement('div');
        var choices = document.createElement('ul');
        var footer = document.createElement('div');
        pollElem.setAttribute('id', `${poll._id}`)
        pollElem.setAttribute('class', 'card bg-dark mb-3');
        choices.setAttribute('class', 'list-group list-group-flush text-dark')

        pollElem.innerHTML = `
          <div class="currText card-header">
				  	<i id="${poll._id}status" class="spinner fas fa-circle-notch" style="color:limegreen"></i> ${poll.polltext}
				  </div>
        `
        poll.choices.forEach(choice => {
          console.log(choice)
          var choiceElem = document.createElement('li')
          choiceElem.setAttribute('id', `${poll._id + choice.id}`)
          choiceElem.setAttribute('class', 'list-group-item')
          choiceElem.innerHTML = `
          ${choice.text}
            <div class="progress">
              <div id="${poll._id + choice.id}bar" class="progress-bar" role="progressbar" style="width: 0%">0(0%)</div>
            </div>
          `
          choices.append(choiceElem);
        })

        footer.innerHTML = `
          <div id="${poll._id}footer" class="card-footer text-muted">
            <button class="btn btn-danger closePoll" pollid="${poll._id}">Close Poll</button>
          </div>
          `

        pollElem.append(choices)
        pollElem.append(footer)
        pollCont.append(pollElem)
        TweenMax.to(`#${poll._id}status`, 3, { rotation: "360", ease: Linear.easeNone, repeat: -1 });
      },
      error: function (jqXhr, textStatus, errorThrown) {
        if (jqXhr.status === 418) {
          console.error('Poll is already Running')
          Toast.fire({
            type: 'error',
            title: 'A Poll is already Running'
          })
        } else {
          console.error
        }
      }
    });
  });

  $('#pollWrap').on('click', '.closePoll.btn', function () {
    console.log($(this).attr('pollid'))
    var pollID = $(this).attr('pollid')
    swal.fire({
      title: `Are you sure you want to close this poll?`,
      text: "You won't be able to revert this!",
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.value) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', `/poll/close/${pollID}`);
        xhr.onload = function () {
          if (xhr.status === 200) {
            Toast.fire({
              type: 'success',
              title: 'Poll Closed'
            })
            console.log('Poll Closed')

          } else {
            Swal.fire(
              'Uh Oh!',
              `There was an error closing the poll. Error: ${xhr.responseText}`,
              'error'
            )
          }
        }
        xhr.send();
      }
    })
  });
});

$("#songpoll").click(function () {
  console.log('test')
  var xhr = new XMLHttpRequest();
  xhr.open('GET', `/songpoll`);
  xhr.onload = function () {
    if (xhr.status === 200) {
      console.log(JSON.parse(xhr.response))
      Toast.fire({
        type: 'success',
        title: 'Poll Opened'
      })
      console.log('Poll Opened')
      var poll = JSON.parse(xhr.response)

      var pollCont = document.getElementById('openPolls');
      var pollElem = document.createElement('div');
      var choices = document.createElement('ul');
      var footer = document.createElement('div');
      pollElem.setAttribute('id', `${poll._id}`)
      pollElem.setAttribute('class', 'card bg-dark mb-3');
      choices.setAttribute('class', 'list-group list-group-flush text-dark')

      pollElem.innerHTML = `
          <div class="currText card-header">
				  	<i id="${poll._id}status" class="spinner fas fa-circle-notch" style="color:limegreen"></i> ${poll.polltext}
				  </div>
        `
      poll.choices.forEach(choice => {
        console.log(choice)
        var choiceElem = document.createElement('li')
        choiceElem.setAttribute('id', `${poll._id + choice.id}`)
        choiceElem.setAttribute('class', 'list-group-item')
        choiceElem.innerHTML = `
          ${choice.text}
            <div class="progress">
              <div id="${poll._id + choice.id}bar" class="progress-bar" role="progressbar" style="width: 0%">0(0%)</div>
            </div>
          `
        choices.append(choiceElem);
      })

      footer.innerHTML = `
          <div id="${poll._id}footer" class="card-footer text-muted">
            <button class="btn btn-danger closePoll" pollid="${poll._id}">Close Poll</button>
          </div>
          `

      pollElem.append(choices)
      pollElem.append(footer)
      pollCont.append(pollElem)
      TweenMax.to(`#${poll._id}status`, 3, { rotation: "360", ease: Linear.easeNone, repeat: -1 });

    } else {
      Swal.fire(
        'Uh Oh!',
        `There was an error opening the poll. Error: ${xhr.responseText}`,
        'error'
      )
    }
  }
  xhr.send();

})


//Subscribe to Poll Channel
// var channel = pusher.subscribe('pollCh');
var socket = io('/polls-namescape');

socket.on('pollUpdate', function (data) {
  console.log('Poll Updated')
  var total = 0
  data.doc.choices.forEach(choice => {
    total = total + choice.votes;
  })

  data.doc.choices.forEach(choice => {
    var votes = choice.votes
    var choice = document.getElementById(`${data.doc._id + choice.id}bar`)
    var perc = (100 * votes) / total
    console.log(perc)
    choice.setAttribute('style', `width: ${perc}%`)
    choice.innerText = `${votes}(${Math.round(perc * 10) / 10}%)`

  })
  total = 0
})

// Poll close
socket.on('pollClose', function (data) {
  console.log(data.pollID)
  console.log(data.win)
  var footer = document.getElementById(`${data.pollID}footer`)
  footer.remove();
  var pollStatus = document.getElementById(`${data.pollID}status`)
  var winner = document.getElementById(`${data.win}`)
  pollStatus.setAttribute('class', 'spinner far fa-times-circle')
  pollStatus.setAttribute('style', 'color:red')
  winner.classList.add('bg-success')
  winner.classList.add('text-white')
  TweenMax.to(`#${data.pollID}status`, 1, { rotation: "0", ease: Linear.easeNone });
  document.getElementById('closedPolls').prepend(
    document.getElementById(`${data.pollID}`)
  );

})

$(document).ready(function () {
  var maxField = 10; //Input fields increment limitation
  var addButton = $('.add_button'); //Add button selector
  var rmvBtn = $('.remove_button');
  var wrapper = $('.field_wrapper'); //Input field wrapper
  var fields = 2; //Initial field counter is 1
  var choice = 3;

  //Once add button is clicked
  $(addButton).click(function () {
    if (fields < maxField) {
      $(wrapper).append(`<input type="text" class="form-control mb-2" name="choice${choice}" placeholder="Choice ${choice}" tabindex="${choice}">`); //Add field html
      fields++; //Increment field counter
      choice++;
    }
  });

  $(rmvBtn).click(function () {
    if (x > 2) {
      $(wrapper).children().last().remove();; //Remove field html
      fields--; //Decrement field counter
      choice--;
    }
  })
});


//utility function
// Generate random IDs for table elements
function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}