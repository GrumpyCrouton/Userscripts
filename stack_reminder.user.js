// ==UserScript==
// @name         Stack Reminder
// @namespace    https://github.com/GrumpyCrouton/Userscripts
// @version      2.0
// @update       https://github.com/GrumpyCrouton/Userscripts/raw/master/stack_reminder.user.js
// @description  Allows you to manage reminders about specific posts across Stack Exchange
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
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    var $ = window.jQuery;

    var api_key = GM_getValue("gc_api_key", false);
    if(api_key != false) {
        post_request(
            "validate_apikey",
            "api_key=" + api_key,
        );
    } else {
        request_apikey(GM_getValue("gc_api_key", ''));
    }

    function request_apikey(current_key) {
        var api_key_input = prompt('Please enter API key from https://stack-remind.grumpycrouton.com', GM_getValue("gc_api_key", ''));
        if(api_key_input != null && api_key_input != "") {
            api_key = api_key_input;
            GM_setValue("gc_api_key", api_key);
            location.reload();
        }
    }

    function post_request(url, data) {
        GM_xmlhttpRequest({
            method: "POST",
            url: "https://stack-remind.grumpycrouton.com/api/" + url,
            data: data,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            onload: function(response) {
                post_functions[url](response);
            }
        });
    }

    function process_page(posts) {

        $('.gc_stack_remind').remove();

        $("a.short-link:contains('share')").each(function( index ) {
            var marked = false;
            if(posts.filter(p => p.link == this.id).length > 0) {
                marked = true;
            }
            $(this).parent().append(create_action_link(this.id, this.href, marked));
        });

        $('#gc_remind_popup_button').text('Reminders (' + posts.length + ')');

        var box = $('#gc_remind_popup_data');
        box.empty();
        $.each(posts, function( index, value ) {
            var row = '\
                    <div style="padding: 10px; width: 100%;border: 1px solid black; margin-bottom: 10px;" class="site-link js-gps-track grid gs8 gsx">\
                        <span class="grid--cell fl1">\
                            <span style="font-size: 14px;"><a style="color: #18529A;" href="' + value.href + '">' + value.title + '</a></span><br>\
                            <span  style="font-size: 12px;color: #6a737c">Note: ' + (value.note == null ? 'No Note Added' : value.note) + '</span>\
                        </span>\
                        <a class="gc_stack_remind" data-marked="true" onclick="$(this).parent().remove();" data-link="' + value.link + '" style="float: right;">Remove</a>\
                    </div>\
            ';
            box.append(row);
        });
    }

    $(document).on('click', 'a.gc_stack_remind', function() {

        var element = $(this);
        var marked = element.data('marked');
        var link = element.data('link');
        var href = element.data('href');

        if(marked) {

            console.log('post unmarked', link);

            post_request(
                "unmark_post",
                "api_key=" + api_key + "&link=" + link,
            );

        } else {

            var title = $('div#question-header > h1 > a.question-hyperlink').text();
            var note = prompt("Type a short note about this post", "");
            if(note == null || note == "") note = "No Note Added";

            console.log('post marked', link);

            post_request(
                "mark_post",
                "api_key=" + api_key + "&title=" + title + "&link=" + link + "&note=" + note + "&href=" + href,
            );
        }

    });

    $(document).on('click', '#gc_purge_reminders', function() {
        post_request(
            "purge_posts",
            "api_key=" + api_key,
        );
    });

    function create_action_link(link, href, marked) {

        var color = 'red';
        if(marked) color = 'green';

        var element = "<a class='gc_stack_remind' data-marked='" + marked + "' data-href='" + href + "' data-link='" + link + "' style='color: " + color + ";'>" + (marked ? 'don\'t remind me' : 'remind me') + "</a>";
        return element;
    }

    var post_functions = {};
    post_functions.validate_apikey = function(response) {
        var data = JSON.parse(response.response);
        if(data.status == "fail") {
            request_apikey(GM_getValue("gc_api_key", ''));
            return;
        }

        //attach custom DOM elements
        $("div#left-sidebar").find('ol.nav-links').eq(1).append('<li><a href="#gc_remind_popup" id="gc_remind_popup_button" class="pl8 js-gps-track nav-links--link"></a></li>');

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

        process_page(data.posts);
    }

    post_functions.mark_post = function(response) {
        var data = JSON.parse(response.response);
        process_page(data.posts);
    }

    post_functions.unmark_post = function(response) {
        var data = JSON.parse(response.response);
        process_page(data.posts);
    }

    post_functions.purge_posts = function(response) {
        var data = JSON.parse(response.response);
        process_page(data.posts);
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
