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

// realtime song add to mix
var channel = pusher.subscribe('sr-channel');
channel.bind('mix-event', function (data) {
  try {
    console.log('Song added to mix')
    var mixContainer = document.getElementById('mixContainer')
    var mixElement = document.createElement('tr');
    mixElement.setAttribute('class', 'song-request');
    mixElement.setAttribute('id', `${data.id}`);
    if (data.source === 'spotify') {
      mixElement.innerHTML = `
        <td>${data.track} - ${data.artist} <i class="fab fa-spotify" title="Open in Spotify"></i></td>
        <td>${data.reqBy}</td>
        <td> 
          <button class="delete btn btn-danger btn-sm mix" data-srID="${data.id}" data-srName="${data.track} - ${data.artist}"> Remove from Mix </button>
        </td>
      `
    }
    if (data.source === 'youtube') {
      mixElement.innerHTML = `
        <td>${data.track} <i class="fab fa-youtube" title="Open on Youtube"></i></td>
        <td>${data.reqBy}</td>
      `
    }
    mixContainer.append(mixElement)
    // Animate newly created element
    TweenMax.from(mixElement, 1, { autoAlpha: 0, ease: Power4.easeOut })

  } catch (err) {
    console.error(err)
  }
});

// Clear specific tr based off of <tr id="id">
channel.bind('mix-remove', function (data) {
  TweenMax.to(`#${data.id}`, .5, {
    autoAlpha: 0, margin: 0, onComplete: function () {
      $(`#${data.id}`).remove();
    }
  });
});

// Clear all rows of table body
channel.bind('clear-mix', function (data) {
  TweenMax.to(`#mix-table tbody tr`, .5, {
    autoAlpha: 0, margin: 0, onComplete: function () {
      $(`#mix-table tbody tr`).remove();
    }
  });
});