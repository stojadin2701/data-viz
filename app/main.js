import * as d3 from 'd3';

var chord = d3.chord()
    .padAngle(.05);

var matrix = [[0, 5871, 8010, 2868],
    [5871, 0, 1614, 6171],
    [8010, 1614, 0, 940],
    [2868, 990, 940, 0]];

var w = 600, h = 600, r0 = Math.min(w, h) * .41, r1 = r0 * 1.1;

var fill = d3.scaleOrdinal()
    .domain(d3.range(4))
    .range(["#000000", "#FFDD89", "#957244", "#F26223"]);

var svg = d3.select("#chord")
    .append("svg:svg")
    .attr("width", w)
    .attr("height", h)
    .append("svg:g")
    .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");

svg.append("svg:g")
    .selectAll("path")
    .data(chord(matrix).groups)
    .enter()
    .append("svg:path")
    .style("fill", function (d) {
        return fill(d.index);
    })
    .style("stroke", function (d) {
        return fill(d.index);
    })
    .attr("d", d3.arc().innerRadius(r0).outerRadius(r1))
    .on("mouseover", fade(.1))
    .on("mouseout", fade(1));


svg.append("svg:g")
    .attr("class", "chord")
    .selectAll("path")
    .data(chord(matrix).slice(0, 9))
    .enter()
    .append("svg:path")
    .style("fill", function (d) {
        return fill(d.target.index);
    })
    .attr("d", d3.ribbon().radius(r0))
    .style("opacity", 1);

function fade(opacity) {
    return function (g, i) {
        svg.selectAll("g.chord path")
            .filter(function (d) {
                return d.source.index != i && d.target.index != i;
            })
            .transition()
            .style("opacity", opacity);
    };
}