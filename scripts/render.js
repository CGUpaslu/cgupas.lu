//this nodejs script will read the data points from the points/ directory, and 
//generate the index.html and get-involved.html files from that.

var elements = {};
var fs = require('fs'),
  prettyjson = require('./prettyjson');
function renderDataPoint(service, dataPoint, forPopup) {
  var text = fs.readFileSync('points/' + dataPoint + '.json').toString().split('\xA0').join('');
  var obj, badge, icon, sign, score;
  try {
    obj = JSON.parse(text);
  } catch (e) {
    console.log(e);
    console.log('donnée : ' + dataPoint + ' Il y a un problème, désolé! Rafraîchir la page peut aider parfois.');
    die();
    return;
  }
  if(!obj.tosdr) {
    obj.tosdr = {};
  }
  //this is choosing the css class for the icon that will be shown to the left of the data point:
  if (obj.tosdr.point == 'good') {
    badge = 'badge-success';
    icon = 'thumbs-up';
    sign = '+';
  } else if (obj.tosdr.point == 'bad') {
    badge = 'badge-warning';
    icon = 'thumbs-down';
    sign = '-';
  } else if (obj.tosdr.point == 'blocker') {
    badge = 'badge-important';
    icon = 'remove';
    sign = '×';
  } else if (obj.tosdr.point == 'neutral') {
    badge = 'badge-neutral';
    icon = 'asterisk';
    sign = '⋅';
  } else {
    badge = '';
    icon = 'question-sign';
    sign = '?';
  }
  //return the html for this data point, for inclusion in the popup or in the main page:
  if (forPopup) {
    return {
      id:dataPoint,
      score:obj.tosdr.score,
      text:'<div class="' + obj.tosdr.point + '"><h5><span class="badge ' + badge
        + '" title="' + obj.tosdr.point + '"><i class="icon-' + icon + ' icon-white">' + sign + '</i></span> ' + obj.title + ' <a href="' + obj.discussion + '" target="_blank" class="label context">Discussion</a></h5><p>'
        + obj.tosdr.tldr + '</p></div>'
    };
  } else {
    return {
      id:dataPoint,
      score:obj.tosdr.score,
      text:'<span class="badge ' + badge + '" title="' + obj.tosdr.score + '">'
        + '<i class="icon-' + icon + ' icon-white">' + sign + '</i></span>&nbsp;' + obj.title
    };
  }
}
function getServiceObject(name) {
  //each service (website) has its own generic description data, that is stored in the services/ directory
  //of this repo. this function loads in such a file:
  var text = fs.readFileSync('services/' + name + '.json').toString();
  var obj;
  try {
    obj = JSON.parse(text);
  } catch (e) {
    console.log(e);
    console.log('Problème avec ' + name + ', désolé! Rafraîchir la page peut aider parfois.');
    die();
  }
  if (obj) {
    return obj;
  } else {
    die('no obj in services/' + name + '.json');
  }
}
function getRatingText(className) {
  var ratingText = {
    0:"Nous n’avons pas suffisamment évalué toutes les clauses. Merci de <a href=\"get-involved.html\">contribuer au projet</a>.",
    "false":"Nous n’avons pas suffisamment évalué toutes les clauses. Merci de <a href=\"get-involved.html\">contribuer au projet</a>.",
    "A":"Les CGU du service sont justes, respectent vos droits et suivent les bonnes pratiques.",
    "B":"Les CGU du service sont justes envers l’utilisateur mais pourraient être améliorées.",
    "C":"Les CGU du service sont plutôt bonnes mais certains points méritent une considération particulière.",
    "D":"Les CGU du service sont déséquilibrées ou il y a certains points importants qui nécessitent une attention particulière.",
    "E":"Les CGU du service soulèvent des doutes sérieux."
  };
  return ratingText[className];
}

function renderDetails(name, points, toslinks, obj) {
  console.log('renderDetails ' + name);
  console.log(points);
  console.log(toslinks);
  console.log(obj);
  //this renders one service (for instance 'Facebook' or 'Google') on our main index.html page:
  var header = '<h3><img src="logo/' + name + '.png" class="favlogo"><a class="modal-link" data-service-name="' + name + '" href="#">' + obj.name + '</a>';
  var rating;
  if (!obj.tosdr) {
    obj.tosdr = {rated:false};
  }
  if (obj.tosdr.rated) {
    rating = '<div id="' + name + '-rating" class="service-rating"><a title="En apprendre davantage sur la classification" href="classification.html"><span class="label ' + obj.tosdr.rated + '">Class ' + obj.tosdr.rated + '</span></a></div></h3>';
  } else {
    rating = '<div id="' + name + '-rating" class="service-rating"><a title="En apprendre davantage sur la classification" href="classification.html"><span class="label ' + obj.tosdr.rated + '">No Class Yet</span></a></div></h3>';
  }
  //we collect the data points into an array first, so that we can sort them by score (the score is the impact/importance of a data point):
  var renderables = [];
  for (var i in points) {
    renderables.push(renderDataPoint(name, points[i], false));
  }
  renderables.sort(function (a, b) {
    return (Math.abs(b.score) - Math.abs(a.score));
  });
  renderables = renderables.slice(0, 5);

  //construct the issues list from the sorted data points:
  var issues = '<section class="specificissues"><ul class="tosdr-points">';
  for (var i = 0; i < renderables.length; i++) {
    issues += '<li id="point-' + name + '-' + renderables[i].id + '">'
      + renderables[i].text
      + '</li>';
  }
  //add link to have more details at the bottom:
  issues += '</ul>'
    + '<a class="modal-link" data-service-name="' + name + '" href="#"><i class="icon  icon-th-list"></i> Plus de détails</a>'
    // add link to read the full terms (removed)
    //    + (toslinks.terms ? '<br /><a href="' + toslinks.terms.url + '" target="_blank"><i class="icon  icon-list-alt"></i> Read the full terms</a>' : '')
    + '</section>';
  //add some search terms to the data-search field. this is quite crude, but it works:
  var search = [name];
  if (obj.keywords) {
    for (var j = 0; j < obj.keywords.length; j++) {
      search.push(obj.keywords[j]);
    }
  }
  if (obj.related) {
    for (var j = 0; j < obj.related.length; j++) {
      search.push(obj.related[j]);
    }
  }
  if (obj.title) {
    search.push(obj.title);
  }
  if (obj.url) {
    search.push(obj.url);
  }
  if (obj.parent) {
    search.push(obj.parent);
  }
  return '\t<div data-search="' + search.join(',') + '" id="' + name + '-tosdr" class="span6 service-nutshell">'
    + header + rating + issues
    + '</div>\n';
}
function isEmpty(map) {
  for (var key in map) {
    if (map.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}
function renderPopup(name, obj, points, links) {
  //the popup is actually a popin, it is what you see when you click 'expand' for one of the services on index.html.
  //this is how we generate the html for them:
  console.log('Rendering popup for ' + name);
  console.log(obj);
  console.log(points);
  console.log(links);
  if(!obj.tosdr) {
    obj.tosdr = {};
  }
  var longName = obj.name,
    domain = obj.url,
    verdict = obj.tosdr.rated,
    ratingText = getRatingText(obj.tosdr.rated);
  var headerHtml = '<div class="modal-header"><button data-dismiss="modal" class="close" type="button">×</button>'
    + '<img src="logo/' + name + '.png" alt="" class="pull-left favlogo" height="36" >'
    + '<h3>' + longName
    + '<small class="service-url">Partager cette évaluation <input class="share-link" type="text" value="http://cgupas.lu/#' + name + '" readonly /></small>'
    + '</h3></div>\n';
  var classHtml = '<div class="tosdr-rating"><label class="label ' + verdict + '">'
    + (verdict ? 'Class ' + verdict : 'Non classé') + '</label><p>' + ratingText + '</p></div>\n';
  var renderables = [];
  //sort the data points by importance:
  for (var i in points) {
    renderables.push(renderDataPoint(name, points[i], true));
  }
  renderables.sort(function (a, b) {
    return (Math.abs(b.score) - Math.abs(a.score));
  });
  var pointsHtml = '';
  for (var i = 0; i < renderables.length; i++) {
    pointsHtml += '<li id="popup-point-' + name + '-' + renderables[i].id + '" class="point">' + renderables[i].text + '</li>\n';
  }
  var bodyHtml = '<div class="modal-body">' + classHtml + '<section class="specificissues"> <ul class="tosdr-points">' + pointsHtml + '</ul></section>\n';
  if (isEmpty(links)) {
    bodyHtml += '<section><a href="/get-involved.html" class="btn">Aidez-nous à archiver leurs CGU »</a></section>\n';
  } else {
    bodyHtml += '<section><h4>Lire les CGU</h4><ul class="tosback2">\n';
    for (var i in links) {
      bodyHtml += '<li><a href="' + links[i].url + '">' + (links[i].name ? links[i].name : i) + '</a></li>\n';
    }
    bodyHtml += '</ul></section>\n';
  }
  bodyHtml += '</div>';
  return headerHtml + bodyHtml;
}
function go() {
  var text = fs.readFileSync('index/services.json').toString();
  var popups = {};
  var servicesList = '';
  //get a list of services we will want to display on index.html:
  try {
    var services = JSON.parse(text);
  } catch (e) {
    console.log('services.json file not readable', e);
  }
  console.log(services);
  var last, lastObj;
  var serviceNames = [];
  for (var i in services) {
    serviceNames.push(i);
  }
  console.log(serviceNames);
  //sort services by their Alexa rank ('big' websites first, 'small' ones at the bottom)
  serviceNames.sort(function (a, b) {
    if (typeof(services[a].alexa) == 'undefined') {
      services[a].alexa = 1000000;
    }
    if (typeof(services[b].alexa) == 'undefined') {
      services[b].alexa = 1000000;
    }
    return services[a].alexa - services[b].alexa;
  });
  //now sort services by whether or not they have a class (ones that do first, 'no class yet' ones at the bottom)
  console.log('by Alexa', serviceNames);
  var serviceNamesRated = [],
    serviceNamesNotRated = [];
  for(var i=0; i<serviceNames.length; i++) {
    if(typeof(services[serviceNames[i]].class)=='string') {
      console.log(serviceNames[i], 'yes');
      serviceNamesRated.push(serviceNames[i]);
    } else {
      console.log(serviceNames[i], 'no');
      serviceNamesNotRated.push(serviceNames[i]);
    }
  }
  serviceNames = serviceNamesRated.concat(serviceNamesNotRated);
  console.log('by rated', serviceNames);
  //twitter is used as an example on /get-involved.html, so we store its html in a variable to render it there:
  var twitterService = null;
  for (var i = 0; i < serviceNames.length; i++) {
    var serviceName = serviceNames[i];

    var obj = getServiceObject(serviceName);
    //if(obj.alexa >= 1000000) {
    //  continue;
    //}

    if(serviceName == 'twitter') {
      twitterService = renderDetails(serviceName, services[serviceName].points, services[serviceName].links, obj);
    }

    if (last) {
      servicesList +=
        renderDetails(last, services[last].points, services[last].links, lastObj)
        + renderDetails(serviceName, services[serviceName].points, services[serviceName].links, obj);
      last = undefined;
    } else {
      last = serviceName;
      lastObj = obj;
    }
    popups[serviceName] = renderPopup(serviceName, obj, services[serviceName].points, services[serviceName].links);
  }
  if (last) {
    servicesList += '\t<div class="row-fluid">\n\t'
      + renderDetails(last, services[serviceName].points, services[serviceName].links, lastObj)
      + '\t</div>\n';
  }
  fs.writeFileSync('index.html',
    fs.readFileSync('index-template.html').
      toString().
      replace('<!-- ##services-content## -->', '<div id="services-list" class="row">\n' + servicesList + '</div>\n')
  );
  fs.writeFileSync('js/services.js', "var popupsContent = " + prettyjson(popups) + ";");
  fs.writeFileSync('get-involved.html',
    fs.readFileSync('get-involved-template.html').
      toString().
      replace('<!-- ##github-service-content## -->', '<div id="services-list" class="row">\n' + twitterService + '</div>\n')
  );
}
go();
