/**
 * author: guanheng88
 * version: 1.0.0
 */
$(function() {
    var menu = $(".menu-siderbar");
    var menuItem = menu.find(".nav-item");

    menuItem.find(".nav-link-parent").click(function() {
        var parentItem = $(this).parent();
        var isOpen = parentItem.hasClass("open");

        menuItem.each(function(i, element) {
            if ($(this).hasClass("open")) {
                $(this).removeClass("open");
            }
        });

        if (isOpen) {
            parentItem.removeClass("open");
        }
        else {
            parentItem.addClass("open");
        }
    });
});