var app = angular.module('rehearse', []);

app.controller('StatsCtrl', function($scope, $attrs) {
       console.log('Stats ctrl activate');
    if (!$attrs.model) throw new Error("No model for StatsCtrl");
    // Pass in sessions into scope thru attrs
    console.log($attrs.model);
    var sessions = JSON.parse($attrs.model);
    console.log(sessions);
    var times = sessions.map(function(x) { return x.time; });
    var clarities = sessions.map(function(x) { return x.avgClarity; });
    var hesitations = sessions.map(function(x) { return x.hesitations; });
    var spacings = sessions.map(function(x) { return x.avgSpacing; });
    var wpms = sessions.map(function(x) { return x.wpm; });
    var trace_clarity = {
        x: times,
        y: clarities,
        mode: 'lines+markers',
        name: 'clarity',
        line: {shape: 'spline'},
        type: 'scatter'
    };
    var trace_wpm = {
        x: times,
        y: wpms,
        mode: 'lines+markers',
        name: 'WPM',
        line: {shape: 'spline'},
        type: 'scatter'
    };
    var trace_hesitation = {
        x: times,
        y: hesitations,
        mode: 'lines+markers',
        name: 'hesitation',
        line: {shape: 'spline'},
        type: 'scatter'
    };
    var trace_spacing = {
        x: times,
        y: spacings,
        mode: 'lines+markers',
        name: 'spacing',
        line: {shape: 'spline'},
        type: 'scatter'
    };
    var data = [trace_clarity, trace_hesitation, trace_wpm, trace_spacing];
    var layout = {
      legend: {
        traceorder: 'reversed',
        font: {size: 16},
        yref: 'paper'
      },
      xaxis: {
        title: 'Date'
      }
    };
    var fields = ['clarity', 'hesitation', 'wpm', 'spacing'];
    for (var i = 0; i < fields.length; i++) {
        Plotly.newPlot('plot_' + fields[i], [data[i]], layout, {showLink: false});
    }
});