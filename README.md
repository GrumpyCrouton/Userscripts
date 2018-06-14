# Userscripts
userscripts I make for various purposes


## VisualCrumbs

Makes visual changes to stackexchange sites.

Body Changes:
- Sets non-white background color. This helps to separate the sidebar from the content more
- Changes the max width of the main container to none, forcing it to stretch across more of the page to waste less space.
- Sets max width of elements with IDs "questions", "qlist-wrapper", and "content" to none, allowing it to stretch more.
- With the container and content both having no max-width, it removes any space on the right side of the content which is not the best look of the website, so this adds an artificial padding to the right side that is roughly the same as the left sidebar, which disappears if the window is resized to the point the left sidebar would be removed.
- Removes unneeded .cbt div at the bottom of questions page, it was creating an extra element in the list.
- Reformats tags displayed on search pages to take up much less space than they used to.


Question stats:
- Moves "Question Stats" into a box similar to "Hot Meta Posts"

Nav Bar:
- Makes width of search bar take up all the space possible, added this due to a meta post I saw a while back that was complaining about this.
- Left Sidebar: Adds "VISUALCRUMBS" entry into menu
- Toggle Right Sidebar hidden or shown
- Adds some padding to the left of buttons on the left nav-bar, and moves the orange line for "youarehere" to the left of the menu entry.

https://greasyfork.org/en/scripts/369480-visualcrumbs-stack-visuals

Screenshot of V2.3
![Screenshot of V2.3](https://image.ibb.co/hFB3hy/Untitled.png)

