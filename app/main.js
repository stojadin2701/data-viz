import * as d3 from 'd3';
import * as _ from 'underscore';


const networkDataFile = 'data/network_15_2017-08-01_2017-10-31__processedat_2017-11-27.csv';
const languagesDataFile = 'data/langues_15_2017-08-01_2017-10-31__processedat_2017-11-27.csv';
const w = 900,
      h = 800,
      rInner = h / 2.4,
      rOut = rInner - 20,
      padding = 0.01,
      textDist = 65;
const margin = {top: 20, right: 20, bottom: 20, left: 20},
      width = w - margin.left - margin.right,
      height = h - margin.top - margin.bottom;

// This function is a simplified version of
// https://gist.github.com/eesur/0e9820fb577370a13099#file-mapper-js-L4
function getMatrixCommonActors(data) {
    let mmap = {}, matrix = [], counter = 0;
    let values = _.uniq(_.pluck(data, "language1"));

    values.map(function (v) {
        if (!mmap[v]) {
            mmap[v] = {name: v, id: counter++, data: data}
        }
    });

    _.each(mmap, function (a) {
        if (!matrix[a.id]) matrix[a.id] = [];
        _.each(mmap, function (b) {
            let recs = _.filter(data, function (row) {
                return (row.language1 === a.name && row.language2 === b.name);
            });

            if (!recs[0]) {
                matrix[a.id][b.id] = 0
            }
            else {
                matrix[a.id][b.id] = +recs[0].common_actors
            }
        });
    });
    return matrix;
}


function rowConverter(d) {
    return {
        language1: d.language1,
        language2: d.language2,
        common_actors: parseFloat(d.common_actors)
    }
}



d3.csv(languagesDataFile, function (error, languages) {
    if (error) throw error;

    d3.csv(networkDataFile, rowConverter, function (error, data) {
        if (error) throw error;

        let matrix = getMatrixCommonActors(data);

        let svg = d3.select("#chord")
            .append("svg:svg")
            .attr("width", width)
            .attr("height", height)
            .append("svg:g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        let fill = d3.scaleOrdinal(d3.schemeCategory10);

        let chord = d3.chord()
            .padAngle(padding);

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
            .attr("d", d3.arc().innerRadius(rOut).outerRadius(rInner))
            .on("mouseover", fade(0.1))
            .on("mouseout", fade(1));


        svg.append("svg:g")
            .attr("class", "chord")
            .selectAll("path")
            .data(chord(matrix))
            .enter()
            .append("svg:path")
            .style("fill", function (d) {
                return fill(d.target.index);
            })
            .attr("d", d3.ribbon().radius(rOut))
            .style("opacity", 1);

        let wrapper = svg.append("g").attr("class", "chordWrapper");

        let g = wrapper.selectAll("g.group")
            .data(chord(matrix).groups)
            .enter().append("g")
            .attr("class", "group");

        g.append("path")
            .style("stroke", function (d) {
                return fill(d.index);
            })
            .style("fill", function (d) {
                return fill(d.index);
            });

        g.append("text")
            .each(function (d) {
                d.angle = ((d.startAngle + d.endAngle) / 2);
            })
            .attr("dy", ".35em")
            .attr("class", "titles")
            .attr("text-anchor", function (d) {
                return d.angle > Math.PI ? "end" : null;
            })
            .attr("transform", function (d) {
                return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                    + "translate(" + (Math.min(width, height) / 2 - 100 + textDist) + ")"
                    + (d.angle > Math.PI ? "rotate(180)" : "")
            })
            .text(function (d, i) {
                return languages['columns'][i];
            });

        function fade(opacity) {
            return function (g, i) {
                svg.selectAll("g.chord path")
                    .filter(function (d) {
                        return d.source.index != i && d.target.index != i;
                    })
                    .transition()
                    .style("opacity", opacity);
            }
        }

    });
});
