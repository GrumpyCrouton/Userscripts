// ==UserScript==
// @name         Stack Reminder
// @namespace    https://github.com/GrumpyCrouton/Userscripts
// @version      3.1
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

    var site_image_link = $('[rel="apple-touch-icon image_src"]')[0].href.split('?v=');
    var site_name = site_image_link[0].split('Sites/')[1].split('/img')[0];
    var site_tag = site_image_link[1];

    var api_key = GM_getValue("gc_api_key", false);
    if(api_key != false) {
        post_request(
            "validate_apikey",
            "api_key=" + api_key,
        );
    } else {
        request_apikey(GM_getValue("gc_api_key", ''));
    }

    //***** EVENT HANDLERS *****//

    $(document).on('click', 'a.gc_stack_remind', function() {

        var element = $(this);
        var marked = element.data('marked');
        var link = element.data('link');
        var href = element.data('href');

        if(marked) {
            post_request(
                "unmark_post",
                "api_key=" + api_key + "&link=" + link,
            );
        } else {

            var title = $('div#question-header > h1 > a.question-hyperlink').text();
            var note = prompt("Type a short note about this post", "");
            if(note == null || note == "") note = "No Note Added";

            post_request(
                "mark_post",
                "api_key=" + api_key + "&title=" + title + "&link=" + link + "&note=" + note + "&href=" + href + "&site_name=" + site_name + "&site_tag=" + site_tag,
            );
        }

    });

    $(document).on('click', '.gc_interface_delete', function() {
        $(this).parents().eq(2).css('background-color', '#ffa9a9');
    });

    $(document).on('click', '#gc_purge_reminders', function() {
        if (confirm('Are you sure you want to purge your reminders?')) {
            post_request(
                "purge_posts",
                "api_key=" + api_key,
            );
        }
    });

    $(document).on('click', '#gc_reminders_button', function() {
        $("#gc_modal_wrapper").show();
        $('body').css('overflow', 'hidden');
    });

    $(document).on('click', '#gc_modal_close, #gc_modal_wrapper', function(e) {
        if(e.target == this) {
            $('#gc_modal_wrapper').hide();
            $('body').css('overflow', 'auto');
        }
    });

    $(document).on('keyup', '#gc_modal_search', function() {

        $('.gc_tab_changer').css("background-color", "#7fc1f1");
        $('#gc_remind_tabs').children().hide();

        $('#gc_tab_changer_reminder_button').css("background-color", "#0095ff");
        $('#gc_remind_popup_data').show();

        $('.gc_content_entry').show();
        show_only_site($('#gc_modal_site').val(), false);
        $(".gc_content_entry:visible").each(function( index ) {
            if($(this).text().toLowerCase().match($('#gc_modal_search').val().toLowerCase())) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });

    $(document).on('change', '#gc_modal_site', function() {
        show_only_site($(this).val());
    });

    $(document).on('click', '.gc_tab_changer', function() {
        var tab = $(this).data('tab');

        $('.gc_tab_changer').css("background-color", "#7fc1f1");
        $('#gc_remind_tabs').children().hide();

        $(this).css("background-color", "#0095ff");
        $('#' + tab).show();
    });

    //***** API FUNCTIONS *****//

    var post_functions = {};
    post_functions.validate_apikey = function(response) {
        var data = JSON.parse(response.response);
        if(data.status == "fail") {
            request_apikey(GM_getValue("gc_api_key", ''));
            return;
        }

        //attach custom DOM elements
        $("div#left-sidebar").find('ol.nav-links').eq(1).append('<li><a id="gc_reminders_button" class="pl8 js-gps-track nav-links--link"></a></li>');

        var site_options = null;
        var options_added = [];
        $.each(data.posts, function( index, value ) {
            if(!options_added.includes(value.site)) {
                options_added.push(value.site);

                var selected = value.site == site_name ? 'selected' : '';

                if(value.site != null) {
                     site_options += '<option ' + selected + ' value="' + value.site + '">Show Only ' + value.site[0].toUpperCase() + value.site.substr(1) + '</option>';
                }
            }
        });


        $("body").append('\
            <div id="gc_modal_wrapper">\
                <div id="gc_modal_window">\
                    <div id="gc_modal_header">\
                        <div class="popup-close"><a id="gc_modal_close" title="close this popup (or hit Esc)">×</a></div>\
                        <h2>Stack Reminder</h2>\
                        <div style="border-bottom: 1px solid #b1b1b182">\
                             <button data-tab="gc_remind_popup_data" id="gc_tab_changer_reminder_button" class="gc_tab_changer">Reminder List</button>\
                             <button data-tab="gc_remind_settings_tab" class="gc_tab_changer" style="background-color: #7fc1f1;">Settings</button>\
                         </div>\
                    </div>\
                    <div id="gc_modal_content">\
                         <div id="gc_remind_tabs">\
                             <div class="gc_tab_content" id="gc_remind_popup_data"></div>\
                             <div class="gc_tab_content" style="display: none;" id="gc_remind_settings_tab">\
                                  <aside class="gc_remind_option s-notice s-notice__success"><h2>API Key</h2><input style="width: 100%;" type="text" disabled value="' + api_key + '"/><p class="gc_note">Visit the <a href="http://stack-remind.grumpycrouton.com">Stack Remind Backend</a> to change this.</p></aside>\
                                  <aside class="gc_remind_option s-notice s-notice__info"><h2>Feature Request</h2><p class="gc_note">Have an idea for Stack Reminder? Use the button below to send it to the developer.</p><button id="gc_suggestion_button">Send a Suggestion</button></aside>\
                                  <aside class="gc_remind_option s-notice s-notice__warning"><h2>Purge Reminders</h2><button style="margin-bottom: 3px;" id="gc_purge_reminders">Remove <strong>ALL</strong> Entries From Your List</button></aside>\
                                  <aside class="gc_remind_option s-notice s-notice__success"><h2>Coming Soon</h2><p class="gc_note">Soon, you\'ll be able to manage your reminder list directly through the <a href="http://stack-remind.grumpycrouton.com">Stack Remind Backend</a>, as well as have the ability to view the status of your submitted suggestions. </p></aside>\
                             </div>\
                         </div>\
                    </div>\
                    <div id="gc_modal_footer">\
                        <input type="text" id="gc_modal_search" placeholder="Search Notes..." style="margin-right:5px;"/>\
                        <select id="gc_modal_site" class="s-input" style="margin-right:5px;max-width: 200px;">\
                            <option value="all">Show All Sites</option>' + site_options + '\
                        </select>\
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
    post_functions.send_suggestion = function(response) {}

    //***** FUNCTIONS *****//

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

        $("a.js-share-link").each(function( index ) {
            var marked = false;
            if(posts.filter(p => p.link == this.id).length > 0) {
                marked = true;
            }
            $(this).parent().append(create_action_link(this.id, this.href, marked));
        });

        $('#gc_reminders_button').html('Reminders <span class="s-badge s-badge__mini">' + posts.length + '</span>');

        var box = $('#gc_remind_popup_data');
        box.empty();
        $.each(posts, function( index, value ) {

            var site_icon = value.site ? '<img style="width: 32px" src="https://cdn.sstatic.net/Sites/' + value.site + '/img/apple-touch-icon.png?v=+ value.fav_tag +"><span class="gc_site_icon" style="display: none">' + value.site + '</span></img>' : '<span class="gc_site_icon">' + value.site + '</span>';

            var row= '\
                <div class="grid gc_content_entry">\
                    <div class="grid--cell">' + site_icon + '</div>\
                    <div class="grid--cell fl1">\
                        <span style="font-size: 14px;"><strong>' + value.title + '</strong></span> <br> \
                        <span class="gc_note_span" style="font-size: 12px;color: #6a737c">' + (value.note == null ? 'No Note Added' : value.note) + '</span><br>\
                        <span class="gc_note_span" style="font-size: 12px;color: #18529A">\
                            <a href="' + value.href + '">open</a> |\
                            <a href="' + value.href + '" class="gc_stack_remind gc_interface_delete" data-marked="true" data-link="' + value.link + '">open & delete</a> |\
                            <a class="gc_stack_remind gc_interface_delete" data-marked="true" data-link="' + value.link + '">delete</a>\
                        </span>\
                    </div>\
                </div>\
            ';

            box.append(row);
        });

        if($('.gc_content_entry').length == 0) {
            box.html('<center><span style="font-size: 30px;">No posts have been saved yet.</span></center>');
        }

        show_only_site($('#gc_modal_site').val());

    }

    function show_only_site(search, show_hidden = true) {
        if(search == "") return;

        if(search == "all") {
            $(".gc_site_icon").parents().eq(1).show();
            return;
        }

        $(".gc_site_icon").each(function(index) {
            if($(this).text() == search) {
                 if(show_hidden) {
                     $(this).parents().eq(1).show();
                 }
            } else {
                 $(this).parents().eq(1).hide();
            }
        });
    }

    function create_action_link(link, href, marked) {

        var color = '';
        if(marked) color = 'color: #dc3131';

        var element = "<a class='gc_stack_remind' data-marked='" + marked + "' data-href='" + href + "' data-link='" + link + "' style='" + color + ";'>" + (marked ? 'don\'t remind' : 'remind') + "</a>";
        return element;
    }

     $(document).on('click', '#gc_suggestion_button', function() {
        send_suggestion();
    });

    function send_suggestion() {
        var suggestion = prompt('Enter a Suggestion for Stack Reminder');
        if(suggestion != null && suggestion != "") {
            post_request(
                "send_suggestion",
                "api_key=" + api_key + "&suggestion=" + suggestion,
            );
        }
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
            height: 10%;\
        }\
        #gc_modal_content {\
            overflow: auto;\
            height:85%;\
            width:100%;\
            margin-bottom:5px;\
        }\
        .gc_content_entry {\
            padding-bottom: 5px;\
            margin-bottom: 10px;\
            border-bottom: 1px dashed #a7a4a470;\
        }\
        .gc_content_entry:last-child {\
           border-bottom: 0px;\
        }\
        .gc_tab_content {\
            margin-top: 10px;\
        }\
        .gc_remind_option {\
            margin-bottom: 5px;\
        }\
        .gc_note {\
            margin: 0px;\
            color: gray;\
        }\
    ");

})();
