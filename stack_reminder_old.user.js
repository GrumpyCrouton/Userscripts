// ==UserScript==
// @name         Stack Reminder
// @namespace    https://github.com/GrumpyCrouton/Userscripts
// @version      1.0
// @update       https://github.com/GrumpyCrouton/Userscripts/raw/master/stack_reminder.user.js
// @description  Allows you to manage reminders about specific posts accross Stack Exchange
// @author       GrumpyCrouton
// @match        *://*.stackexchange.com/*
// @match        *://*.stackoverflow.com/*
// @match        *://*.superuser.com/*
// @match        *://*.serverfault.com/*
// @match        *://*.askubuntu.com/*
// @match        *://*.stackapps.com/*
// @match        *://*.mathoverflow.net/*
// @require      http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    var stored_object = GM_getValue("gc_stack_remind_list", "{}");

    $("div#left-sidebar").find('ol.nav-links').eq(1).append('<li><a href="#gc_remind_popup" id="gc_remind_popup_button" class="pl8 js-gps-track nav-links--link">Reminders (' + Object.keys(stored_object).length + ')</a></li>');

    $("body").append ('\
        <div id="gc_remind_popup">\
            <div class="gc_remind_popup-content">\
                <div class="header">\
                    <div class="popup-close"><a href="#" title="close this popup (or hit Esc)">×</a></div>\
                    <h2>\
                        Stack Reminder\
                    </h2>\
                </div>\
                <div class="copy">\
                    <button id="gc_purge_reminders" style="margin-bottom: 10px;">Purge Reminders</button>\
                    <div id="gc_remind_popup_data"></div>\
                </div>\
             </div>\
             <div class="overlay"></div>\
        </div>\
    ');

    $("a.short-link:contains('share')").each(function( index ) {
        $(this).parent().append(create_action_link(this.id, this.href));
    });

    $("#gc_remind_popup_button").on('click', function() {
        console.log("gc_popup_shown");

        //fill popup box
        var box = $('#gc_remind_popup_data');

        box.empty();
        $.each(stored_object, function( index, value ) {
            var row = '\
                    <div style="padding: 10px; width: 100%;border: 1px solid black; margin-bottom: 10px;" class="site-link js-gps-track grid gs8 gsx">\
                        <span class="grid--cell fl1">\
                            <span style="font-size: 14px;"><a style="color: #18529A;" href="' + value.href + '">' + value.post + '</a></span><br>\
                            <span  style="font-size: 12px;color: #6a737c">Note: ' + (value.note == null ? 'No Note Added' : value.note) + '</span>\
                        </span>\
                        <a class="gc_stack_remind" onclick="$(this).parent().remove();" data-link="' + index + '" style="float: right;">Remove</a>\
                    </div>\
            ';
            box.append(row);
        });
    });

    $(document).on('click', 'a.gc_stack_remind', function() {

        var element = $(this);
        var link = element.data('link');
        var href = element.data('href');

        if(typeof stored_object != "object" || !(link in stored_object)) { //link does not exist in remind
            var note = prompt("Reminder Flag", "");
            if(note == null || note == "") note = "No Note Added";
            add_reminder(element, $('div#question-header > h1 > a.question-hyperlink').text(), link, note, href);
        } else { //link already exists in remind
            console.log("triggered delete", link);
            remove_reminder(element, link);
        }

        $('#gc_remind_popup_button').text('Reminders (' + Object.keys(stored_object).length + ')');

    });

    $('#gc_purge_reminders').on('click', function() {
        $.each(stored_object, function(index) {
           remove_reminder(null, index);
        });
        var box = $('#gc_remind_popup_data');
        box.empty();
    });

    function add_reminder(element, post, link, note, href) {
        stored_object[link] = {post: post, note: note, href: href};
        GM_setValue("gc_stack_remind_list", stored_object);
        element.css({color: "green"});
        alter_button_count();
    }

    function remove_reminder(element, link) {
        delete stored_object[link];
        GM_setValue("gc_stack_remind_list", stored_object);
        alter_button_count();

        if(element != null) {
           element.css({color: "red"});
        }
    }

    function alter_button_count() {
        $('#gc_remind_popup_button').text('Reminders (' + Object.keys(stored_object).length + ')');
    }

    function create_action_link(link, href) {
        var color = "red";
        if(typeof stored_object == "object" && link in stored_object) {
            color = "green";
        }
        var element = "<a class='gc_stack_remind' data-href='" + href + "' data-link='" + link + "' style='color: " + color + ";'>remind</a>";
        return element;
    }

    GM_addStyle ("\
        #gc_remind_popup {\
          left: 50%;\
          margin: -250px 0 0 -32%;\
          opacity: 0;\
          position: absolute;\
          top: -50%;\
          visibility: hidden;\
          width: 50%;\
          box-shadow: 0 2px 4px rgba(36,39,41,0.3);\
          box-sizing: border-box;\
          transition: all .4s ease-in-out;\
          -moz-transition: all .4s ease-in-out;\
          -webkit-transition: all .4s ease-in-out\
          border: 1px solid #9fa6ad;\
        }\
        #gc_remind_popup:target {\
          opacity: 1;\
          top: 50%;\
          visibility: visible\
        }\
        #gc_remind_popup .copy, #gc_remind_popup .header, #gc_remind_popup .footer {\
          padding: 20px;\
        }\
        #gc_remind_popup .header {\
            padding-bottom: 0px;\
        }\
        #gc_remind_popup .copy {\
            padding-top: 0px;\
        }\
        .gc_remind_popup-content {\
          background: #fff;\
          position: relative;\
          z-index: 99999;\
        }\
        #gc_remind_popup .overlay {\
          background-color: #000;\
          background: rgba(0,0,0,.6);\
          height: 100%;\
          left: 0;\
          position: fixed;\
          top: 0;\
          width: 100%;\
          z-index: 99998\
        }\
    ");
})();
