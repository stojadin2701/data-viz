var tooltip = d3.select("#tooltip");
d3.json('https://dulinimendis.github.io/RodentTest/js/global_whole_network.json', function(error, data) {
    if (error) throw error;
    var matrix = whole_net = data[2]; // adjacency matrix 37 x 37 of all excitatory and inhibitory neurons

    var neurons = Object.keys(data[7]).map(function(key) {
        return data[7][key]
    }); //object with filenames and whether its excitatory or inhibitory
    //Get excitatory and inhibitory neurons indices separately
    var neuronType = neurons.map(function(a) {
        return a[1];
    });
    var neuronInds = neuronType.map(function(a, i) {
        if (a == 0 && i < matrix.length) {
            return i;
        } else return null;
    });
    var inNeuronInds = neuronInds.filter(function(a) {
        return a != null;
    });
    var neuronInds = neuronType.map(function(a, i) {
        if (a == 1 && i < matrix.length) {
            return i;
        } else return null;
    });
    var exNeuronInds = neuronInds.filter(function(a) {
        return a != null;
    });
    var sortNeuronInds = exNeuronInds.concat(inNeuronInds);

    //Sort adjacency matrix
    var temp = [];
    var vSortRow = [];
    var sortMat = [];

    for (i = 0; i < sortNeuronInds.length; i++) {
        temp = matrix[sortNeuronInds[i]];
        vSortRow = [];

        for (j = 0; j < sortNeuronInds.length; j++) {
            vSortRow.push(temp[sortNeuronInds[j]]);
        }

        sortMat.push(vSortRow.map(function(a) {
            return a;
        }));
    }
    matrix = sortMat;

    var chord = d3.layout.chord()
        .padding(.05)
        .sortSubgroups(d3.descending)
        .matrix(matrix);
    //console.log('print the chord log follows')
    var width = 600,
        height = 600,
        innerRadius = Math.min(width, height) * .25,
        outerRadius = innerRadius * 1.1;
    var fill = d3.scale.ordinal()
        .domain(d3.range(3))
        .range(["#ff8c1a", "#007acc", "#333333"]);

    var svg = d3.select(".chart").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    svg.append("g")
        .attr("class","arc")
        .selectAll("path")
        .data(chord.groups)
        .enter().append("path")
        .style("fill", function(d, i) {
            if (i < exNeuronInds.length) return fill(0);
            else return fill(1)
        })
        .style("stroke", function(d, i) {
            if (i < exNeuronInds.length) return fill(0);
            else return fill(1)
        })
        .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
        .on("mouseover", fade(.05,"visible"))
        .on("mousemove", function() {
            tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
        })
        .on("mouseout", fade(1,"hidden"));

    var ticks = svg.append("g").selectAll("g")
        .data(chord.groups)
        .enter().append("g").selectAll("g")
        .data(groupTicks)
        .enter().append("g")
        .attr("transform", function(d) {
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")" +
                "translate(" + outerRadius + ",0)";
        });
    ticks.append("line")
        .attr("x1", 1)
        .attr("y1", 0)
        .attr("x2", 5)
        .attr("y2", 0)
        .style("stroke", "#000");
    ticks.append("text")
        .attr("x", 8)
        .attr("dy", ".35em")
        .attr("transform", function(d) {
            return d.angle > Math.PI ? "rotate(180)translate(-16)" : null;
        })
        .style("text-anchor", function(d) {
            return d.angle > Math.PI ? "end" : null;
        })
        .text(function(d) {
            return d.label;
        });

    svg.append("g")
        .attr("class", "chord")
        .selectAll("path")
        .data(chord.chords)
        .enter().append("path")
        .attr("d", d3.svg.chord().radius(innerRadius))
        .style("fill", function(d) {
            if (d.target.index < exNeuronInds.length && d.source.index < exNeuronInds.length) return fill(0);
            else if (d.target.index >= exNeuronInds.length && d.source.index >= exNeuronInds.length) return fill(1);
            else return fill(2);
        })
        .style("stroke", function(d) {
            if (d.target.index < exNeuronInds.length && d.source.index < exNeuronInds.length) return fill(0);
            else if (d.target.index >= exNeuronInds.length && d.source.index >= exNeuronInds.length) return fill(1);
            else return fill(2);
        })
        .style("opacity", 0.9)
        .on("mouseover",  fadeChord(0.05,0.05,"visible"))
        .on("mousemove", function(){
            tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
        })
        .on("mouseout", fadeChord(1,0.9,"hidden"));

    // Returns an array of tick angles and labels, given a group.
    function groupTicks(d) {
        var k = (d.endAngle - d.startAngle) / d.value;
        return d3.range(0, d.value, 1000).map(function(v, i) {
            return {
                angle: v * k + d.startAngle + (d.endAngle - d.startAngle) / 2,
                label: neurons[sortNeuronInds[d.index]][1] == 0 ? "Inhibitory" : "Excitatory"
            };
        });
    }

    var conLabels = ["Excitatory-Excitatory Connections", "Inhibitory-Inhibitory Connections", "Inhibitory-Excitatory Connections"];

    var width2 = 800,
        height2 = 300;
    console.log(fill.domain())

    var svg2 = d3.select(".legendContainer").append("svg")
        .attr("width", width2)
        .attr("height", height2);

    // draw legend
    var legend = svg2.selectAll(".legend")
        .data(fill.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
            return "translate(-100," + (i * 20) + ")";
        });

    // draw legend colored rectangles
    legend.append("circle")
        .attr("r", 5)
        .attr("cx", width2 / 2)
        .attr("cy", 20)
        .style("fill", fill);

    // draw legend text
    legend.append("text")
        .attr("x", width2 / 2 + 20)
        .attr("y", 20)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(function(d, i) {
            return conLabels[i];
        });

    // Returns an event handler for fading a given chord group.
    function fade(opacity,visibility) {
        return function(g, i) {
            svg.selectAll(".chord path")
                .filter(function(d) {
                    return d.source.index != i && d.target.index != i;
                })
                .transition()
                .style("opacity", opacity);
            var a = neurons[sortNeuronInds[i]][0];
            var a = a.substring(0, a.length - 8);
            if(visibility=="visible")
                tooltip.text("Neuron ID: "+a);

            tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
            tooltip.style("visibility", visibility);
        };
    }

    function fadeChord(opacityArcs, opacityChords,visibility) {
        return function(g, i) {

            svg.selectAll(".chord path")
                .filter(function(d,j) { return j!=i; })
                .transition()
                .style("opacity", opacityChords);
            svg.selectAll(".arc path")
                .filter(function(d) { return !(d.index == g.source.index || d.index == g.target.index); })
                .transition()
                .style("opacity", opacityArcs);

            tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
            var a = neurons[sortNeuronInds[g.source.index]][0];
            var a = a.substring(0,a.length-8);
            var b = neurons[sortNeuronInds[g.target.index]][0];
            var b = b.substring(0,b.length-8);if(tooltip.style("visibility")=="hidden")
                tooltip.style("visibility", "visible");

            if(visibility=="visible")
                tooltip.text(a+" to "+b);

        };
    }
});