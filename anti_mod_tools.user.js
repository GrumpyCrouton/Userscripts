// ==UserScript==
// @name         Anti-Moderation Tools (SE Strike Script)
// @namespace    https://github.com/GrumpyCrouton/Userscripts
// @version      0.2
// @description  Disables moderator abilities on SE sites.
// @author       GrumpyCrouton
// @match        *://stackoverflow.com/*
// @match        *://meta.stackoverflow.com/*
// @match        *://superuser.com/*
// @match        *://meta.superuser.com/*
// @match        *://serverfault.com/*
// @match        *://meta.serverfault.com/*
// @match        *://askubuntu.com/*
// @match        *://meta.askubuntu.com/*
// @match        *://mathoverflow.net/*
// @match        *://meta.mathoverflow.net/*
// @match        *://*.stackexchange.com/*
// @match        *://answers.onstartups.com/*
// @match        *://meta.answers.onstartups.com/*
// @match        *://stackapps.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var disable_upvote = true;
    var disable_answering = false;
    var disable_asking = false;

    var elements_to_remove = [

        //menu bar
        'li.review-button-item', //review queue button

        //general site
        'button.js-vote-down-btn', //question/answer downvote
        'a.edit-post', //edit button
        'a.close-question-link', //close button
        'a.flag-post-link', //flag button
        'a.js-comment-flag', //comment flag button
        'a.suggest-edit-post', //suggest edit button

        //comments
        'div.comment-flagging', // comment flag button

        //revisions page
        'a.js-rollback-revision', //rollback button
        'a[title="edit this revision"]', //edit button

    ];

    if(disable_upvote) {
        elements_to_remove.push('button.js-vote-up-btn'); //question/answer upvote
        elements_to_remove.push('div.comment-voting'); //comment upvote
    }
    if(disable_answering) elements_to_remove.push('form#post-form');
    if(disable_asking) elements_to_remove.push('a[href$=ask]');

    $.each(elements_to_remove, function(index, value) {
        $(value).remove();
    });

})();
