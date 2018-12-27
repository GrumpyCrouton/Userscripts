// ==UserScript==
// @name         Stack Reminder
// @namespace    https://github.com/GrumpyCrouton/Userscripts
// @version      2.1
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

        $('#gc_reminders_button').text('Reminders (' + posts.length + ')');

        var box = $('#gc_remind_popup_data');
        box.empty();
        $.each(posts, function( index, value ) {
            var row = '\
                    <div class="gc_content_entry">\
                        <span class="grid--cell fl1">\
                            <span style="font-size: 14px;"><a style="color: #18529A;" href="' + value.href + '">' + value.title + '</a></span><br>\
                            <span class="gc_note_span" style="font-size: 12px;color: #6a737c">Note: ' + (value.note == null ? 'No Note Added' : value.note) + '</span>\
                        </span>\
                        <a class="gc_stack_remind" data-marked="true" onclick="$(this).parent().css(\'background-color\', \'#ffa9a9\').stop().hide(\'fade\', 2000);" data-link="' + value.link + '" style="float: right;">Remove Entry</a>\
                    </div>\
            ';
            box.append(row);
        });

        if($('.gc_content_entry').length == 0) {
            box.html('<center><span style="font-size: 30px;">No posts have been saved yet.</span></center>');
        }
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

    $(document).on('click', '#gc_reminders_button', function() {
        $("#gc_modal_wrapper").show();
        $('body').css('overflow', 'hidden');
    });

    $(document).on('click', '#gc_modal_close', function() {
        $('#gc_modal_wrapper').hide();
        $('body').css('overflow', 'auto');
    });

    $(document).on('click', '#gc_modal_wrapper', function(e) {
        if(e.target == this) {
            $('#gc_modal_wrapper').hide();
            $('body').css('overflow', 'auto');
        }
    });

    $(document).on('keyup', '#gc_modal_search', function() {
        $(".gc_content_entry").each(function( index ) {
            if($(this).text().toLowerCase().match($('#gc_modal_search').val().toLowerCase())) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
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
        $("div#left-sidebar").find('ol.nav-links').eq(1).append('<li><a id="gc_reminders_button" class="pl8 js-gps-track nav-links--link"></a></li>');

        $("body").append('\
            <div id="gc_modal_wrapper">\
                <div id="gc_modal_window">\
                    <div id="gc_modal_header">\
                        <div class="popup-close" id="gc_modal_close"><a title="close this popup (or hit Esc)">×</a></div>\
                        <h2>Stack Reminder</h2>\
                    </div>\
                    <div id="gc_modal_content">\
                         <div id="gc_remind_popup_data"></div>\
                    </div>\
                    <div id="gc_modal_footer">\
                        <input type="text" id="gc_modal_search" placeholder="Search Notes..." style="margin-right:5px;"/><button style="margin-bottom: 3px;" id="gc_purge_reminders">Purge Reminders</button>\
                    </div>\
                </div>\
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
        #gc_modal_wrapper {\
            display: none;\
            position: fixed;\
            background: rgba(0,0,0,0.8);\
            width:100%;\
            height:100%;\
            z-index: 99000;\
        }\
        #gc_modal_window {\
            position: fixed;\
            box-shadow: 0 2px 4px rgba(36,39,41,0.3);\
            border: 1px solid #9fa6ad;\
            background-color: #fafafb;\
            padding: 16px;\
            min-width:60%;\
            max-width:90%;\
            height:80%;\
            z-index: 99999;\
            left: 50%;\
            top: 50%;\
            transform: translate(-50%, -50%);\
        }\
        #gc_modal_header, #gc_modal_footer {\
            height: 5%;\
        }\
        #gc_modal_content {\
            overflow: auto;\
            height:90%;\
            width:100%;\
            margin-bottom:5px;\
            padding: 10px;\
            border: 1px solid gray;\
        }\
        .gc_content_entry {\
            margin: 5px;\
            padding-bottom: 10px;\
            margin-bottom: 10px;\
            border-bottom: 1px solid gray;\
        }\
    ");

})();
