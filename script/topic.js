/*

  Renders Topic pages

  Special lines start with

  title:
  this replaces the page <title> and the main heading with the value
  { }
  this draws a box around the stuff in between the braces

  topic: the title for each topic

  heading: a smaller heading. may also use h1, h2, etc.

  learning-goal:
  puts values of adjacent lines that start with this as items in learning goals list.
  a blank line or other non learning-goal: line will end the list

  big-idea:
  same as above, for a big ideas list

  <4 spaces>
  if a line starts with four/eight/twelve spaces (tab characters also work),
  it will have an added class stuck in it called 'indent1', 'indent2', etc.
  The line will be treated as any other line otherwise

  raw-html:
  all following lines until a blank line are just raw html that stuck on the page.

  other currently supported classes: quiz, assignment, resource, forum, video, extresource.

  Other lines get their own <div> with the class as specified in the string before the colon
  Can also specify some actual html tags before the colon (e.g. h1)
  Anything in a [] is stuck as the target of a link

  You may hide particular classes by passing URL parameters.
  For instance, to hide all videos, simply add the parameter (without the quotes) "novideo=true".
  It'll end up looking something like this:
  topic.html?topic=berkeley_bjc/intro/broadcast-animations-music.topic&novideo=true&noreading=true

*/

/* The allowed tags for easy entry.
 * e.g.   h1: Some Text [maybe/a/link/too]
 */
llab.tags = ["h1", "h2", "h3", "h4", "h5", "h6"];



llab.renderFull = function(data, ignored1, ignored2) {
    var FULL   = llab.selectors.FULL,
        params = llab.getURLParameters(),
        course = params.course;


    if (course) {
        if (course.indexOf("://") === -1) {
            course = llab.courses_path + course;
        }
        $(FULL).append($(document.createElement("a")).attr(
            {"class":"course_link", "href": course }
            ).html(llab.strings.goMain));
    }

    llab.file = llab.topic;

    data = data.replace(/(\r)/gm,""); // normalize line endings
    var lines = data.split("\n");
    var line;
    var in_topic = false;
    var topic;
    var item;
    var learningGoal = false;
    var bigIdea = false;
    var list;
    var raw = false;
    var text;
    var isHidden;
    var num = 0;
    var numspan;
    var numobj = {n: [-1], indent: ""};    //n is array of ints, current numbering at each level
    var url = document.URL;
    for (var i = 0; i < lines.length; i++) {
        line = lines[i];
        line = llab.stripComments(line);
        // TODO: Refactor this line
        isHidden = params.hasOwnProperty('no' + $.trim(line.slice(0, line.indexOf(':'))));
        if (line.length && !raw && !isHidden) {
            if (line.slice(0, 6) === "title:") {
                // TODO: Refractor to a set title function!
                var titleHTML = line.slice(6);
                $('.navbar-title').html(titleHTML);
                $('.title-small-screen').html(titleHTML);
                var titleText = $('.navbar-title').text();
                // SPECIAL-CASE for 'Snap' in titles.
                //titleText = titleText.replace('snap', 'Snap!');
                document.title = titleText;
                learningGoal = false;
                bigIdea = false;
            } else if (line.slice(0, 8) == "raw-html") {
                raw = true;
            } else if (line[0] == "{") {
                in_topic = true;
                topic = $(document.createElement("div")).attr({'class': 'topic'});
                $(FULL).append(topic);
                learningGoal = false;
                bigIdea = false;
            } else if (line.slice(0, 6) == "topic:") {
                // FIXME -- style
                item = $(document.createElement("div")).attr({'class': 'topic_header'}).append(line.slice(6));
                topic.append(item);
                learningGoal = false;
                bigIdea = false;
            } else if (line.slice(0, 8) == "heading:") {
                llab.increaseNumbering(0, numobj);
                item = $(document.createElement("h3"));
                item.append($(document.createElement("span")).attr({'class':'topic_number'}).append(llab.getNumberingString(numobj)));
                item.append(line.slice(8));
                topic.append(item);
                learningGoal = false;
                bigIdea = false;
            } else if (line.slice(0,12) == "    heading:") {
                llab.increaseNumbering(1, numobj);
                item = $(document.createElement("h4")).attr({'class':'indent1'});
                item.append($(document.createElement("span")).attr({'class':'topic_number'}).append(llab.getNumberingString(numobj)));
                item.append(line.slice(12));
                topic.append(item);
                learningGoal = false;
                bigIdea = false;
                // TODO second level indent?  sigh
            } else if (line[0] == "}") {
                in_topic = false;
                learningGoal = false;
                bigIdea = false;
            } else if (line.slice(0, 13) == "learning-goal") {
                bigIdea = false;
                if (learningGoal) {
                    list.append($(document.createElement("li")).append(line.slice(14)));
                } else {
                    llab.determineIndent(line, numobj);
                    line = $.trim(line);
                    learningGoal = true;
                    item = $(document.createElement("div")).attr({'class': 'learninggoals ' + numobj.indentCls});
                    list = $(document.createElement("ul"));
                    list.append($(document.createElement("li")).append(line.slice(14)));
                    item.append(list);
                    topic.append(item);
                }
            } else if (line.slice(0, 8) == "big-idea") {
                learningGoal = false;
                if (bigIdea) {
                    list.append($(document.createElement("li")).append(line.slice(9)));
                } else {
                    llab.determineIndent(line, numobj);
                    line = $.trim(line);
                    bigIdea = true;
                    item = $(document.createElement("div")).attr({'class': 'bigideas ' + numobj.indentCls});
                    list = $(document.createElement("ul"));
                    list.append($(document.createElement("li")).append(line.slice(9)));
                    item.append(list);
                    topic.append(item);
                }
            } else {
                llab.determineIndent(line, numobj);
                line = $.trim(line);
                learningGoal = false;
                bigIdea = false;
                var sepIdx = line.indexOf(":");
                if (sepIdx != -1 && llab.isTag(line.slice(0, sepIdx))) {
                    item = $(document.createElement(line.slice(0, sepIdx)));
                } else if (sepIdx != -1) {
                    item = $(document.createElement("div")).attr({'class': line.split(":")[0] + " " + numobj.indentCls});
                } else {
                    item = $(document.createElement("div"));
                }
                if (line.indexOf("[") != -1) {
                    llab.increaseNumbering(numobj.currentLevel, numobj);
                    var temp = $(document.createElement("a"));
                    var query = params;
                    text = line.slice(sepIdx + 1, line.indexOf("["));
                    temp.append($(document.createElement("span")).attr({'class':'topic_number'}).append(llab.getNumberingString(numobj)));
                    temp.append($(document.createElement("span")).attr({'class':'topic_target'}).append($.trim(text)));
                    url = (line.slice(line.indexOf("[") + 1, line.indexOf("]")));
                    if (url.indexOf("http") != -1) {
                        query = $.extend({}, query, { src: url, title: text });
                        url = llab.empty_curriculum_page_path;
                    } else if (url.indexOf(llab.rootURL) == -1 && url.indexOf("..") == -1) {
                        var slash = url[0] == "/" ? '' : '/';
                        url = llab.rootURL + slash + url;
                    }
                    url += (url.indexOf('?') !== -1 ? '&' : '?') + llab.QS.stringify(query);
                    num += 1;
                    temp.attr({'href': url});
                    item.append(temp);
                } else {
                    item.append(line.slice(sepIdx + 1));
                }
                topic.append(item);
            }
        } else if (line.length == 1) {
            learningGoal = false;
            bigIdea = false;
            raw = false;
        } else if (raw) {
            var raw_html = "";
            while (line.length > 1 && line.slice[0] != "}") {
                raw_html += " " + line;
                i++;
                line = lines[i];
            }
            topic.append(raw_html);
            raw = false;
        } else {
            learningGoal = false;
            bigIdea = false;
        }
    }
}



// Determines numbering, and the indent class of this string,
llab.determineNumbering = function(s, numobj) {
    llab.determineIndent(s, numobj);
    llab.increaseNumbering(numobj.currentLevel, numobj);
};

llab.determineIndent = function(s, numobj) {
    var count = 0,
        level;
    for (var i = 0; i < s.length; i++) {
        if (s[i] == " ") {
            count++;
        } else if (s[i] == "\t") {
            count += 4;
        } else {
            break;
        }
    }
    level = Math.floor(count/4);
    numobj.currentLevel = level;
    numobj.indentCls = "indent" + level;
};

// increases numobj.in at level by one, zeroing out sublevels
llab.increaseNumbering =function(level, numobj) {
    var current;
    for (var i = 0; i <= level; i++ ) {
        if (i == level) {
            current = numobj.n[i];
            numobj.n[i] = ( current == undefined ? 0 : current + 1 );
            numobj.n.splice(level+1, numobj.n.length);   // remove any additional levels
        } else if (numobj.n[i] == undefined) {
            numobj.n[i] = 0;
        }
    }

};

// returns string version of the current numbering
llab.getNumberingString = function(numobj) {
    return "(" + numobj.n.join('.') + ")";
}

/* Returns true iff S is an allowed html tag. */
llab.isTag = function(s) {
    return llab.tags.indexOf(s) !== -1;
}

llab.displayTopic = function() {
    llab.file = llab.getQueryParameter("topic");

    if (llab.file) {
        $.ajax({
            url : llab.topics_path + llab.file,
            type : "GET",
            dataType : "text",
            cache : true,
            success : llab.renderFull
        });
    } else {
        $(llab.selectors.FULL).prepend('<p class="error">Please specify a file in the URL.</p>');
    }
}

// Make a call to build a topic page.
// Be sure that content is set only on pages that it should be
$(document).ready(function() {
    var url = document.URL,
        isTopicFile = (url.indexOf("topic.html") !== -1 ||
            // FIXME -- this may be broken.
            url.indexOf("empty-topic-page.html") !== -1);

    if (isTopicFile) {
        llab.displayTopic();
    }
});


/*
  Error checking (do this after building page, so it won't slow it down?)

  Check the link targets if present - if they aren't there (give a 404),
  put a "broken" class on the link to render in red or something

  Maybe be smart about a mistyped youtube target?  dunno.

  Be forgiving:

  if there is no closing brace, put one there when another one opens or the page ends

  No error checking:

  No error checking on class name before the colon - it could be misspelled

  if no colon at all, just put no class on the div

*/
