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

$(document).ready(function () {
  $("#menu-toggle").click(function (e) {
    e.preventDefault();
    $("#wrapper").toggleClass("toggled");
  });

  fetch(`/api/goods`)
    .then(response => {
      return response.json()
    })
    .then(data => {
      var goodCont = document.getElementById('goodnews')
      var news = document.createElement('div')
      news.setAttribute()
    })
})