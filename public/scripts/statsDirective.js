var app = angular.module('rehearse', []);

app.controller('StatsCtrl', function($scope) {
    console.log('Stats ctrl activate');
    // if (!$attrs.model) throw new Error("No model for StatsCtrl");

    // Pass in sessions into scope thru attrs
    var sessions = JSON.parse($scope.sessions);
    console.log(sessions);
    var times = sessions.map(function(x) { return x.time; });
    var clarities = sessions.map(function(x) { return x.clarity; });
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
    var data = [trace_clarity, trace_wpm];

    var layout = {
      legend: {
        y: 0.5,
        traceorder: 'reversed',
        font: {size: 16},
        yref: 'paper'
      }};

    Plotly.newPlot('plot', data, layout, {showLink: false});
});