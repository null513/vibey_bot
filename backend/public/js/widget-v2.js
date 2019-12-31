
var socket = io('/req-namescape');


socket.on('mix-event', function (data) {
  console.log('Song added to mix')
  var mixContainer = document.getElementById('mixContainer')
  var mixElement = document.createElement('div');
  mixElement.setAttribute('class', 'mix-request');
  mixElement.setAttribute('id', `${data.id}`);
  mixElement.innerHTML = `${data.track} - <u>${data.reqBy}</u>`

  mixContainer.appendChild(mixElement)
  $(".mix-request").textFit()
  // Animate newly created element
  TweenMax.from(mixElement, 2, {
    y: 1000, autoAlpha: 0, ease: Power4.easeOut, onComplete: function () {

    }
  })

});

// remove requst based off of div id
socket.on('mix-remove', function (data) {
  console.log('removed song')
  TweenMax.to(`#${data.id}`, .5, {
    autoAlpha: 0, margin: 0, onComplete: function () {
      $(`#${data.id}`).remove();
    }
  });
});

// Clear all rows of table body
socket.on('clear-mix', function (data) {
  TweenMax.to(`.mix-request`, 1, {
    autoAlpha: 0, margin: 0, onComplete: function () {
      $(`.mix-request`).remove();
    }
  });
});

// Fit Text to sticky note
$(".mix-request").textFit()