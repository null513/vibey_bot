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

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2000,
})

$(document).ready(function () {
  $('#sr-table').DataTable({
    fixedHeader: true,
    "ordering": false,
    "paging": false,
  });
});

$("#menu-toggle").click(function (e) {
  e.preventDefault();
  $("#wrapper").toggleClass("toggled");
});

var socket = io('/req-namescape');
socket.on('socketConnect', function (data) {
  Toast.fire({
    type: 'success',
    title: 'Socket Connected!'
  })
});

// Pusher Poduction *** UNCOMMENT THIS BEFORE COMMIT ***
// var pusher = new Pusher('94254303a6a5048bf191', {
//   cluster: 'us2',
//   forceTLS: true
// });

// // Pusher DEVELOPMENT
// var pusher = new Pusher('41f9377a48633b3302ff', {
//   cluster: 'us2',
//   forceTLS: true
// });

// Realtime song request
socket.on('sr-event', function (data) {
  try {
    console.log('New Request')
    var srContainer = document.getElementById('srContainer')
    var srElement = document.createElement('tr');
    srElement.setAttribute('class', 'song-request');
    srElement.setAttribute('id', `${data.id}`);
    if (data.source === 'spotify') {
      srElement.innerHTML = `
        <td>
          <button class="btn btn-success btn-sm mr-3 p-3 mix-add" data-srID="${data.id}">Mix +</button>
          <button class="delete btn btn-danger btn-sm" data-srID="${data.id}" data-srName="${data.track} - ${data.artist}"> <i class="fas fa-minus-circle"></i> </button>
        </td>
        <td><a class="srLink" target="_blank" href="${data.link}">${data.track} - ${data.artist}</a> <a class="spotify" target="_blank" href="${data.uri}"><i class="fab fa-spotify" title="Open in Spotify"></i></a></td>
        <td>${data.reqBy}</td>
        <td>
          <div class="timeReq" data-time="${data.timeOfReq}"></div>
        </td>
      `
    }
    if (data.source === 'youtube') {
      srElement.innerHTML = `
        <td> 
          <button class="btn btn-success btn-sm mr-3 p-3 mix-add" data-srID="${data.id}">Mix +</button> 
          <button class="delete btn btn-danger btn-sm mix" data-srID="${data.id}" data-srName="${data.track}"> <i class="fas fa-minus-circle"></i> </button>
        </td>
        <td><a class="srLink" target="_blank" href="${data.link}">${data.track}</a> <a class="youtube" target="_blank" href="${data.link}"><i class="fab fa-youtube" title="Open on Youtube"></i></a></td>
        <td>${data.reqBy}</td>
        <td>
          <div class="timeReq" data-time="${data.timeOfReq}"></div> 
        </td>
      `
    }
    if (data.source === 'text') {
      srElement.innerHTML = `
        <td> 
          <button class="btn btn-success btn-sm mr-3 mix-add" data-srID="${data.id}">Mix +</button> 
          <button class="delete btn btn-danger btn-sm mix" data-srID="${data.id}" data-srName="${data.track}"> <i class="fas fa-minus-circle"></i> </button>
        </td>
        <td>${data.track}</td>
        <td>${data.reqBy}</td>
        <td>
          <div class="timeReq" data-time="${data.timeOfReq}"></div>
        </td>
      `
    }
    srContainer.prepend(srElement)
  } catch (err) {
    console.error(err)
  }
});

// Checks how long ago song was requested
var timeDiff = setInterval(reqTime, 1000);

function reqTime() {
  $('.timeReq').each(function () {

    var ago = moment.utc(`${$(this).attr('data-time')}`).fromNow();
    $(this).text(`${ago}`)

  })
}

// realtime song add to mix
socket.on('mix-event', function (data) {
  try {
    console.log('Song added to mix')
    var mixContainer = document.getElementById('mixContainer')
    var mixElement = document.createElement('tr');
    mixElement.setAttribute('class', 'song-request');
    mixElement.setAttribute('id', `${data.id}`);
    if (data.source === 'spotify') {
      mixElement.innerHTML = `
        <td><a class="srLink" target="_blank" href="${data.link}">${data.track} - ${data.artist}</a> <a class="spotify" href="${data.uri}"><i class="fab fa-spotify" title="Open in Spotify"></i></a></td>
        <td>${data.reqBy}</td>
        <td> 
          <button class="delete btn btn-danger btn-sm mix" data-srID="${data.id}" data-srName="${data.track} - ${data.artist}"> Remove </button>
        </td>
      `
    }
    if (data.source === 'youtube') {
      mixElement.innerHTML = `
        <td><a class="srLink" target="_blank" href="${data.link}">${data.track}</a> <a class="youtube" href="${data.link}"><i class="fab fa-youtube" title="Open on Youtube"></i></a></td>
        <td>${data.reqBy}</td>
        <td> 
          <button class="delete btn btn-danger btn-sm mix" data-srID="${data.id}" data-srName="${data.track}"> Remove </button>
        </td>
      `
    }
    if (data.source === 'text') {
      mixElement.innerHTML = `
      <td>${data.track}</td>
        <td>${data.reqBy}</td>
        <td> 
          <button class="delete btn btn-danger btn-sm mix" data-srID="${data.id}" data-srName="${data.track}"> Remove </button>
        </td>
      `
    }
    mixContainer.prepend(mixElement)
  } catch (err) {
    console.error(err)
  }
});

// Flips table data
$(function () {
  $("#srContainer").each(function (elem, index) {
    var arr = $.makeArray($("tr", this).detach());
    arr.reverse();
    $(this).append(arr);
  });
});



// Add request to mix
$('#srContainer').on('click', '.mix-add.btn', function () {
  var srId = $(this).attr('data-srID')
  var xhr = new XMLHttpRequest();
  xhr.open('GET', `/mix/add/${srId}`);
  xhr.onload = function () {
    if (xhr.status === 200) {
      try {
        Toast.fire({
          type: 'success',
          title: 'Song Added to Mix!'
        })
      } catch (err) {
        console.error(err)
      }
    } else {
      Toast.fire({
        type: 'error',
        title: 'Error adding song!',
        text: '${xhr.responseText}'
      })
    }
  }
  xhr.send();
})

// Delete request from mix
$('#mixContainer').on('click', '.mix.delete', function () {
  var srId = $(this).attr('data-srID')
  var xhr = new XMLHttpRequest();
  xhr.open('GET', `/mix/remove/${srId}`);
  xhr.onload = function () {
    if (xhr.status === 200) {
      try {
        Toast.fire({
          type: 'success',
          title: 'Song Removed from mix!'
        });
      } catch (err) {
        console.error(err)
      }
    } else {
      Toast.fire({
        type: 'error',
        title: 'Error removing song from mix!',
        text: '${xhr.responseText}'
      })
    }
  }
  xhr.send();
})

// Delete individual song from mix
socket.on('mix-remove', function (data) {
  var el = document.getElementById(`${data.id}`)
  el.remove()
});

// Clear Queue 
$('#clear-queue').on('click', '.delete-queue', function () {
  swal.fire({
    title: `Are you sure you want to clear the queue?`,
    text: "You won't be able to revert this!",
    type: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!',
  }).then((result) => {
    if (result.value) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', `/requests/deleteall`);
      xhr.onload = function () {
        if (xhr.status === 200) {
          Swal.fire({
            title: 'Cleared!',
            text: `Queue has been cleared.`,
            type: 'success',
            timer: 500,
            allowOutsideClick: false,
            allowEscapeKey: false,
            onBeforeOpen: () => {
              Swal.showLoading()
            },
            onClose: () => {
              $("#sr-table tbody tr").remove();
            }
          });
        } else {
          Swal.fire(
            'Uh Oh!',
            `There was an error clearing the queue. Error: ${xhr.responseText}`,
            'error'
          )
        }
      }
      xhr.send();
    }
  })
});

// Clear Mix
$('#clear-mix').on('click', '.delete-mix', function () {
  swal.fire({
    title: `Are you sure you want to clear the mix?`,
    text: "You won't be able to revert this!",
    type: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!',
  }).then((result) => {
    if (result.value) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', `/requests/mix/deleteall`);
      xhr.onload = function () {
        if (xhr.status === 200) {
          Swal.fire({
            title: 'Cleared!',
            text: `Mix has been cleared.`,
            type: 'success',
            timer: 500,
            allowOutsideClick: false,
            allowEscapeKey: false,
            onBeforeOpen: () => {
              Swal.showLoading()
            },
            onClose: () => {
              $("#mix-table tbody tr").remove();
            }
          });
        } else {
          Swal.fire(
            'Uh Oh!',
            `There was an error clearing the mix. Error: ${xhr.responseText}`,
            'error'
          )
        }
      }
      xhr.send();
    }
  })
});


// Delete Song Request
$('#srContainer').on('click', '.delete.btn', function () {
  var srName = $(this).attr('data-srName')
  var srId = $(this).attr('data-srID')
  swal.fire({
    title: `Are you sure you want to delete ${srName}?`,
    text: "You won't be able to revert this!",
    type: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!',
  }).then((result) => {
    if (result.value) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', `/requests/delete/${srId}`);
      xhr.onload = function () {
        if (xhr.status === 200) {
          Swal.fire({
            title: 'Deleted!',
            text: `${srName} has been deleted.`,
            type: 'success',
            timer: 500,
            allowOutsideClick: false,
            allowEscapeKey: false,
            onBeforeOpen: () => {
              Swal.showLoading()
            },
            onClose: () => {
              try {
                TweenMax.to(`#${srId}`, .5, {
                  autoAlpha: 0, margin: 0, onComplete: function () {
                    $(`#${srId}`).remove();
                  }
                });
              } catch (err) {
                console.error(err)
              }
            }
          });
        } else {
          Swal.fire(
            'Uh Oh!',
            `There was an error deleteing the song request. Error: ${xhr.responseText}`,
            'error'
          )
        }
      }
      xhr.send();
    }
  })
});