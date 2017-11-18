import * as d3 from 'd3';


let wHist = 600;
let hHist = 250;
const barPadding = 0.05;

const marginHist = {top: 20, right: 10, bottom: 20, left: 10};
const widthHist = 600 - marginHist.left - marginHist.right,
    heightHist = 300 - marginHist.top - marginHist.bottom;

const maxValue = 100;
const nDataHist = 20;

var dataset = [];
for (var i = 0; i < nDataHist; i++) {
    var newNumber = Math.floor(Math.random() * 100);
    dataset.push(newNumber);
}

let xScaleHist = d3.scaleBand()
    .domain(d3.range(dataset.length))
    .range([0, widthHist])
    .round(true)
    .paddingInner(barPadding);

let yScaleHist = d3.scaleLinear()
    .domain([0, maxValue + 10])
    .range([0, heightHist]);

let hist = d3.select("#hist")
    .append("svg")
    .attr("width", wHist + marginHist.left + marginHist.right)
    .attr("height", hHist + marginHist.top + marginHist.bottom);

hist.selectAll("rect")
    .data(dataset)
    .enter()
    .append("rect")
    .attr("x", function (d, i) {
        return xScaleHist(i);
    })
    .attr("y", function (d) {
        return heightHist - yScaleHist(d);
    })
    .attr("width", xScaleHist.bandwidth())
    .attr("height", function (d) {
        return yScaleHist(d);
    })
    .attr("fill", function (d) {
        return "rgb(0, 0, " + Math.round(d * 5) + ")";
    })
    .on("mouseover", function () {
        d3.select(this)
            .attr("fill", "orange")
    })
    .on("mouseout", function (d) {
        d3.select(this)
            .transition()
            .duration(300)
            .attr("fill", "rgb(0, 0, " + (d * 10) + ")");
    });

hist.selectAll("text")
    .data(dataset)
    .enter()
    .append("text")
    .text(function (d) {
        return d;
    })
    .attr("text-anchor", "middle")
    .attr("x", function (d, i) {
        return xScaleHist(i) + xScaleHist.bandwidth() / 2;
    })
    .attr("y", function (d) {
        return heightHist - yScaleHist(d) - 5;
    })
    .attr("font-family", "sans-serif")
    .attr("font-size", "11px")
    .attr("fill", "black");

d3.select("#update_hist")
    .on("click", function () {
        const numValues = dataset.length;
        dataset = [];
        for (var i = 0; i < numValues; i++) {
            var newNumber = Math.floor(Math.random() * 100);
            dataset.push(newNumber);
        }

        hist.selectAll("rect")
            .data(dataset)
            .transition()
            .duration(3000)
            .ease(d3.easeLinear)
            .attr("y", function (d) {
                return heightHist - yScaleHist(d);
            })
            .attr("height", function (d) {
                return yScaleHist(d);
            })
            .attr("fill", function (d) {
                return "rgb(0, 0, " + Math.round(d * 5) + ")"
            });

        hist.selectAll("text")
            .data(dataset)
            .transition()
            .duration(3000)
            .ease(d3.easeLinear)
            .text(function (d) {
                return d;
            })
            .attr("text-anchor", "middle")
            .attr("y", function (d) {
                return heightHist - yScaleHist(d) - 5;
            })
            .attr("font-family", "sans-serif")
            .attr("font-size", "11px")
            .attr("fill", "black");
    });

d3.select("#add_hist")
    .on("click", function () {
        let newValue = Math.floor(Math.random() * 100);
        dataset.push(newValue);

        xScaleHist.domain(d3.range(dataset.length));

        let bars = hist.selectAll("rect").data(dataset);

        bars.enter()
            .append("rect")
            .attr("x", widthHist)
            .attr("y", function (d) {
                return heightHist - yScaleHist(d);
            })
            .attr("width", xScaleHist.bandwidth())
            .attr("height", function (d) {
                return yScaleHist(d);
            })
            .attr("fill", function (d) {
                return "rgb(0, 0, " + Math.round(d * 5) + ")"
            })
            .merge(bars)
            .transition()
            .duration(500)
            .attr("x", function (d, i) {
                return xScaleHist(i);
            })
            .attr("y", function (d) {
                return heightHist - yScaleHist(d);
            })
            .attr("width", xScaleHist.bandwidth())
            .attr("height", function (d) {
                return yScaleHist(d);
            });

        let text = hist.selectAll("text").data(dataset);

        text.enter()
            .append("text")
            .text(function (d) {
                return d;
            })
            .attr("text-anchor", "middle")
            .attr("x", function (d, i) {
                return xScaleHist(i) + xScaleHist.bandwidth() / 2;
            })
            .merge(text)
            .transition()
            .duration(500)
            .attr("text-anchor", "middle")
            .attr("x", function (d, i) {
                return xScaleHist(i) + xScaleHist.bandwidth() / 2;
            })
            .attr("y", function (d) {
                return heightHist - yScaleHist(d) - 5;
            })
            .attr("font-family", "sans-serif")
            .attr("font-size", "11px")
            .attr("fill", "black");
    });


d3.select("#remove_hist")
    .on("click", function () {
        dataset.pop();
        xScaleHist.domain(d3.range(dataset.length));

        let bars = hist.selectAll("rect").data(dataset);

        bars.exit()
            .transition()
            .duration(500)
            .attr("x", widthHist)
            .remove();

        let text = hist.selectAll("text").data(dataset);

        text.exit()
            .transition()
            .duration(500)
            .text(function (d) {
                return d
            })
            .attr("x", widthHist)
            .remove();

        hist.selectAll("rect")
            .data(dataset)
            .transition()
            .duration(500)
            .attr("x", function (d, i) {
                return xScaleHist(i);
            })
            .attr("y", function (d) {
                return heightHist - yScaleHist(d);
            })
            .attr("width", xScaleHist.bandwidth())
            .attr("height", function (d) {
                return yScaleHist(d);
            })
            .attr("fill", function (d) {
                return "rgb(0, 0, " + Math.round(d * 5) + ")";
            });

        hist.selectAll("text")
            .data(dataset)
            .data(dataset)
            .transition()
            .duration(500)
            .attr("text-anchor", "middle")
            .attr("x", function (d, i) {
                return xScaleHist(i) + xScaleHist.bandwidth() / 2;
            })
    });
