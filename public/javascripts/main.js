var tripsDataset;
var popEmpDataset;
var populationBreakdown;
var dwellingTypeDataset;
var selectedZone;

require([
    "esri/map","dojo/dom-construct", "esri/layers/FeatureLayer",
    "esri/dijit/Popup", "esri/dijit/Legend","esri/symbols/SimpleLineSymbol",
    "esri/InfoTemplate", "esri/symbols/SimpleFillSymbol", "esri/renderers/ClassBreaksRenderer",
    "esri/symbols/SimpleMarkerSymbol", "esri/Color", "dojo/domReady!"
], function(Map, domConstruct,FeatureLayer, Popup, Legend,SimpleLineSymbol,InfoTemplate,SimpleFillSymbol,ClassBreaksRenderer,SimpleMarkerSymbol,Color
) {
    d3.queue().defer(d3.json,'./outputData/output.json')
              .defer(d3.csv,'./data/RTM3_Pop_Emp_2015.csv')
              .defer(d3.csv,'./data/Population_2015_RTM3.csv')
              .defer(d3.csv,'./data/DwellingType_2015_RTM3.csv')
              .await(loadData);
    function loadData(error,outputData,popEmpData,popBreak,dwellingData){
        tripsDataset = outputData;
        popEmpDataset = convertPopEmpData(popEmpData);
        populationBreakdown = convertPopEmpData(popBreak);
        dwellingTypeDataset = convertPopEmpData(dwellingData);
        var map = new Map("mapDiv", {
            basemap: "gray-vector",
            center: [-113.4909, 53.5444],
            zoom: 8,
            minZoom:6,
        });

        var travelZoneLayer = new FeatureLayer("https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/newestTAZ/FeatureServer/0",{
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["*"],
            infoTemplate:new InfoTemplate("Attributes", "Travel Zone:${TAZ_New}")
        });
        //LRT layer
        var lrtFeatureLayer = new FeatureLayer("https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/LRT/FeatureServer/0",{
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["*"],
        });

        map.on('load',function(){
            map.addLayer(travelZoneLayer);
            map.addLayer(lrtFeatureLayer);
            selectedZone = '101';
            drawChart(selectedZone);
        });

        var symbol = new SimpleFillSymbol();
        var renderer = new ClassBreaksRenderer(symbol, function(feature){
            return 1;
        });

        //legend. If you want to change legend scale or legend color, this part of code needs to be modified
        renderer.addBreak(0, 10, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([65,105,225,0.9]),1)).setColor(new Color([255, 255, 255,0.2])));
        travelZoneLayer.setRenderer(renderer);
        travelZoneLayer.redraw();

        //add onclick event of district layer
        travelZoneLayer.on('click',function(e){
            selectedZone=e.graphic.attributes["TAZ_New"];//get selected zone
            // Draw the chart and set the chart values
            drawChart(selectedZone);
        });
        var dwellingChart = Highcharts.chart('dwelling', {
                chart: {
                    polar: true,
                    type: 'line'
                },
                title: {
                    text: 'Dwelling Type',
                    x: -80
                },
                pane: {
                    size: '80%'
                },
                xAxis: {
                    min: 0,
                    categories: [],
                    tickmarkPlacement: 'on',
                    lineWidth: 0
                },
                yAxis: {
                    gridLineInterpolation: 'polygon',
                    lineWidth: 0,
                    min: 0
                },
                tooltip: {
                    shared: true,
                },
                legend: {
                    align: 'bottom',
                    verticalAlign: 'top',
                    y: 70,
                    layout: 'vertical'
                },
                series: [{
                    name: 'Number of Household',
                    data: [],
                    pointPlacement: 'on'
                }],
                credits: {
                    enabled: false
                }
        });
        var autoOwnershipChart=Highcharts.chart('autoOwnership', {
            chart: {
                type: 'column'
            },
            title: {
                text: 'Auto Ownership'
            },
            xAxis: {
                categories: '',
                title: {
                    text: null
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Amount',
                    align: 'high'
                },
                labels: {
                    overflow: 'justify'
                }
            },
            tooltip: {
                shared: true,
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'top',
                x: -40,
                y: 80,
                floating: true,
                borderWidth: 1,
                backgroundColor: ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
                shadow: true
            },
            credits: {
                enabled: false
            },
            series: [{
                type: 'column',
                data:  '',
                showInLegend: false
            }],
            // exporting: {
            //     enabled: false
            // }
        });
        var modeChart = Highcharts.chart('mode', {
            chart: {
                inverted: false,
                polar: true
            },
            title: {
                text: 'Travel Mode'
            },

            xAxis: {
                categories: []
            },
            series: [{
                type: 'column',
                colorByPoint: true,
                data: [],
                showInLegend: false
            }],
            legend: {
                enabled: true
            },
            credits: {
                enabled: false
            }
        });
        var incomeChart = Highcharts.chart('income', {
            chart: {
                type: 'column'
            },
            title: {
                text: 'Income Group'
            },
            xAxis: {
                type: 'category'
            },
            legend: {
                enabled: false
            },

            plotOptions: {
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0
                },
                series: {
                    borderWidth: 0,
                    dataLabels: {
                        enabled: true,
                        format: '{point.y:.1f}%'
                    }
                }
            },

            tooltip: {
                headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
                pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y:0.2f}%</b> of total<br/>'
            },

            series: [
                {
                    type: 'column',
                    colorByPoint: true,
                    data: []
                }
            ],
            credits: {
                enabled: false
            }

        });
        var HHChart = Highcharts.chart('HHSize', {
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type: 'pie'
            },
            title: {
                text: 'Household Size'
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                        style: {
                            color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                        }
                    }
                }
            },
            series: [{
                name: 'Percentage',
                colorByPoint: true,
                data:[]
            }],
            credits: {
                enabled: false
            }
        });
        var tripsByPurposeChart = Highcharts.chart('tripsByPurpose', {
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: 0,
                plotShadow: false
            },
            title: {
                text: 'Trips By Purpose',
                // align: 'center',
                // verticalAlign: 'middle',
                y: 40
            },
            // tooltip: {
            //     pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            // },
            plotOptions: {
                pie: {
                    dataLabels: {
                        enabled: true,
                        distance: -50,
                        style: {
                            fontWeight: 'bold',
                            color: 'white'
                        }
                    },
                    startAngle: -90,
                    endAngle: 90,
                    center: ['50%', '75%'],
                    size: '110%'
                }
            },
            series: [{
                type: 'pie',
                name: 'Trips Amount',
                innerSize: '50%',
                data: []
            }],
            credits: {
                enabled: false
            }
        });

        function drawChart(selectedZone){
            dwellingChart.series[0].setData(getKeysValuesOfObject(dwellingTypeDataset[selectedZone])[1]);
            dwellingChart.xAxis[0].setCategories(getKeysValuesOfObject(dwellingTypeDataset[selectedZone])[0]);

            if(dwellingChart.yAxis[0].getExtremes().dataMax === 0){
                dwellingChart.yAxis[0].setExtremes(0,10);
            }
            else{
                dwellingChart.yAxis[0].setExtremes();
            }

            var autoArray= [];
            var largerThanFive = 0;
            if(typeof(tripsDataset[selectedZone])=== 'undefined'){
                alert('There is no trip data of your selected zone!');
                // $("#testDiv").dialog({
                //
                //     modal: true,
                //     open: function(event, ui){
                //         setTimeout("$('#testDiv').dialog('close')",1500);
                //     }
                // });
                //  return false
            }
            for(var i in tripsDataset[selectedZone]['Own']){
                if(i>=5){
                    largerThanFive+=tripsDataset[selectedZone]['Own'][i];
                }
                else{
                    autoArray.push([i,tripsDataset[selectedZone]['Own'][i]]);
                }
            }
            autoArray.push(['5+',largerThanFive]);
            autoOwnershipChart.series[0].setData(getKeysValuesOfTripsObject(autoArray)[1]);
            autoOwnershipChart.xAxis[0].setCategories(getKeysValuesOfTripsObject(autoArray)[0]);
            var modeArray= [];
            for(var i in tripsDataset[selectedZone]['Mode']){
                modeArray.push([i,tripsDataset[selectedZone]['Mode'][i]]);
            }
            modeChart.series[0].setData(getKeysValuesOfTripsObject(modeArray)[1]);
            modeChart.xAxis[0].setCategories(getKeysValuesOfTripsObject(modeArray)[0]);
            var incomeSum=0;
            for (var i in tripsDataset[selectedZone]['IncGrp']){
                incomeSum += tripsDataset[selectedZone]['IncGrp'][i];
            }
            var incomeArray = [];
            for(var i in tripsDataset[selectedZone]['IncGrp']){
                incomeArray.push([i,tripsDataset[selectedZone]['IncGrp'][i]*100/incomeSum]);
            }
            incomeChart.series[0].setData(incomeArray);

            var HHSizeArray = [];
            for(var i in tripsDataset[selectedZone]['HHSize']){
                HHSizeArray.push([i,tripsDataset[selectedZone]['HHSize'][i]])
            }
            HHChart.series[0].setData(HHSizeArray);

            var tripsByPurposeArray = [];
            for(var i in tripsDataset[selectedZone]['TourPurp']){
                tripsByPurposeArray.push([i,tripsDataset[selectedZone]['TourPurp'][i]])
            }
            tripsByPurposeChart.series[0].setData(tripsByPurposeArray);

            drawDistanceChart();
        }
    }
});
function drawDistanceChart(){
    Highcharts.setOptions({
        chart: {
            inverted: true,
            marginLeft: 135,
            type: 'bullet'
        },
        title: {
            text: null
        },
        legend: {
            enabled: false
        },
        yAxis: {
            gridLineWidth: 0
        },
        plotOptions: {
            series: {
                borderWidth: 0,
                color: '#000',
            }
        },
        credits: {
            enabled: false
        },
        exporting: {
            enabled: false
        }
    });
    $('#avgDist').show();
    $('#avgGHG').show();
    $('#totalEmp').show();
    $('#totalPop').show();
    $('#avgDist').height('25%');
    $('#avgGHG').height('25%');
    $('#totalEmp').height('25%');
    $('#totalPop').height('25%');
    var totalDist = 0;
    for(var k in tripsDataset[selectedZone]['Dist']){
        totalDist += tripsDataset[selectedZone]['Dist'][k]
    }
    var totalAmount = 0;
    for(var k in tripsDataset[selectedZone]['TourPurp']) {
        totalAmount += tripsDataset[selectedZone]['TourPurp'][k]
    }

    var distChart = Highcharts.chart('avgDist', {
        chart: {
            marginTop: 20
        },
        yAxis: {
            plotBands: [{
                from: 0,
                to: 30,
                color: '#666'
            }, {
                from: 30,
                to: 60,
                color: '#999'
            }, {
                from: 60,
                to: 900,
                color: '#bbb'
            }],
            labels: {
                format: '{value}'
            },
            title: null
        },
        xAxis: {
            categories: ['Average Travel  <br/>Distance (km)']
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.y:.2f}</b>'
        },

        series: [{
            name:'Distance',
            data: [{
                y: totalDist/totalAmount,
                target: 30,
            }
            ]
        }],

    });

    distChart.xAxis[0].labelGroup.element.childNodes.forEach(function(label)
    {
        label.style.cursor = "pointer";
        label.onclick = function() {
            // distChart.destroy();
            $('#avgDist').show();
            $('#avgDist').height('100%');
            $('#totalEmp').hide();
            $('#avgGHG').hide();
            $('#totalPop').hide();
            var distByPurpose = [];
            for(var purp in tripsDataset[selectedZone]['TourPurp']){
                distByPurpose.push([purp,tripsDataset[selectedZone]['Dist'][purp]/tripsDataset[selectedZone]['Person#'][purp]])
            }
            var drillDownDistChart = Highcharts.chart('avgDist', {
                chart: {
                    type: 'column'
                },
                title: {
                    text: 'Average Distance By Purpose'
                },
                xAxis: {
                    type: 'category',
                    labels: {
                        rotation: -45,
                        style: {
                            fontSize: '13px',
                            fontFamily: 'Verdana, sans-serif'
                        }
                    }
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: ' Travel distance (km)'
                    }
                },
                legend: {
                    enabled: false
                },
                series: [{
                    type:'column',
                    name: 'Population',
                    data: distByPurpose,
                    dataLabels: {
                        enabled: true,
                        format: '{point.y:.1f}', // one decimal
                        y: 0, // 10 pixels down from the top
                        style: {
                            fontSize: '8px',

                        }
                    }
                }]
            });
            drillDownDistChart.xAxis[0].labelGroup.element.childNodes.forEach(function(label)
            {
                label.style.cursor = "pointer";
                label.onclick = function() {drawDistanceChart()}
            })
        }
    });

    var ghgChart = Highcharts.chart('avgGHG', {
        chart: {
            marginTop: 20
        },
        xAxis: {
            categories: ['Average Greenhouse  <br/>Gas (kg)']
        },
        yAxis: {
            plotBands: [{
                from: 0,
                to: 10,
                color: '#666'
            }, {
                from: 10,
                to: 10000000,
                color: '#999'
            }],
            title: null
        },
        series: [{
            name:'Gas Weight',
            data: [{
                y: totalDist/totalAmount*0.327,
                target: 10,
            }
            ]
        }],
        tooltip: {
            pointFormat: '{series.name}: <b>{point.y:.2f}</b>'
        },
    });
    ghgChart.xAxis[0].labelGroup.element.childNodes.forEach(function(label)
    {
        label.style.cursor = "pointer";
        label.onclick = function() {

            $('#avgGHG').show();
            $('#avgGHG').height('100%');
            $('#avgDist').hide();
            $('#totalEmp').hide();
            $('#totalPop').hide();
            var ghgByPurpose = [];
            for(var purp in tripsDataset[selectedZone]['TourPurp']){
                ghgByPurpose.push([purp,tripsDataset[selectedZone]['Dist'][purp]*0.327/tripsDataset[selectedZone]['Person#'][purp]])
            }
            var drillDownGHGChart = Highcharts.chart('avgGHG', {
                chart: {
                    type: 'column'
                },
                title: {
                    text: 'Average Greenhouse Gas By Purpose'
                },
                xAxis: {
                    type: 'category',
                    labels: {
                        rotation: -45,
                        style: {
                            fontSize: '13px',
                            fontFamily: 'Verdana, sans-serif'
                        }
                    }
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: ' GHG emission(kg)'
                    }
                },
                legend: {
                    enabled: false
                },
                series: [{
                    data: ghgByPurpose,
                    dataLabels: {
                        enabled: true,
                        format: '{point.y:.1f}', // one decimal
                        y: 0, // 10 pixels down from the top
                        style: {
                            fontSize: '8px',
                        }
                    }
                }]
            });
            drillDownGHGChart.xAxis[0].labelGroup.element.childNodes.forEach(function(label)
            {
                label.style.cursor = "pointer";
                label.onclick = function() {drawDistanceChart()}
            })
        }
    });

    var totalEmp = Highcharts.chart('totalEmp', {
        chart: {
            marginTop: 20
        },
        xAxis: {
            categories: ['Total Jobs']
        },
        yAxis: {
            plotBands: [{
                from: 0,
                to: 500,
                color: '#666'
            }, {
                from: 500,
                to: 100000000,
                color: '#999'
            }],
            title: null
        },
        series: [{
            data: [{
                y: Number(popEmpDataset[selectedZone]['Jobs']),
                target: 500,
            }]
        }],
        tooltip: {
            pointFormat: '<b>{point.y}</b> (with target at {point.target})'
        }
    });
    totalEmp.xAxis[0].labelGroup.element.childNodes.forEach(function(label)
    {
        label.style.cursor = "pointer";
        label.onclick = function() {
            $('#totalEmp').show();
            $('#totalEmp').height('100%');
            $('#avgDist').hide();
            $('#avgGHG').hide();
            $('#totalPop').hide();
            var ghgByPurpose = [];
            for(var purp in tripsDataset[selectedZone]['TourPurp']){
                ghgByPurpose.push([purp,tripsDataset[selectedZone]['Dist'][purp]*0.327/tripsDataset[selectedZone]['Person#'][purp]])
            }
            var drillDownGHGChart = Highcharts.chart('totalEmp', {
                chart: {
                    type: 'column'
                },
                title: {
                    text: 'I donnot know what to draw'
                },
                xAxis: {
                    type: 'category',
                    labels: {
                        rotation: -45,
                        style: {
                            fontSize: '13px',
                            fontFamily: 'Verdana, sans-serif'
                        }
                    }
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: ' GHG emission(kg)'
                    }
                },
                legend: {
                    enabled: false
                },
                series: [{

                    data: ghgByPurpose,
                    dataLabels: {
                        enabled: true,
                        format: '{point.y:.1f}', // one decimal
                        y: 0, // 10 pixels down from the top
                        style: {
                            fontSize: '8px',
                        }
                    }
                }]
            });
            drillDownGHGChart.xAxis[0].labelGroup.element.childNodes.forEach(function(label)
            {
                label.style.cursor = "pointer";
                label.onclick = function() {drawDistanceChart()}
            })
        }
    });

    var popOfSelectedZone = 0;
    for(var i in populationBreakdown[selectedZone]){
        popOfSelectedZone+=Number(populationBreakdown[selectedZone][i])
    }
    var totalPop = Highcharts.chart('totalPop', {
        chart: {
            marginTop: 20,
        },
        xAxis: {
            categories: ['Total Population']
        },
        yAxis: {
            plotBands: [{
                from: 0,
                to: 500,
                color: '#666'
            }, {
                from: 500,
                to: 100000000,
                color: '#999'
            }],
            title: null
        },
        series: [{
            data: [{
                y:popOfSelectedZone ,
                target: 500,
            }
            ]
        }],
        tooltip: {
            pointFormat: '<b>{point.y}</b> (with target at {point.target})'
        }
    });

    totalPop.xAxis[0].labelGroup.element.childNodes.forEach(function(label)
    {
        label.style.cursor = "pointer";
        label.onclick = function() {
            $('#totalPop').show();
            $('#totalPop').height('100%');
            $('#avgDist').hide();
            $('#avgGHG').hide();
            $('#totalEmp').hide();
            var popDrilldown =Highcharts.chart('totalPop', {
                chart: {
                    marginLeft: 3,

                    type: 'variablepie',
                },
                title: {
                    text: 'Age Distribution'
                },
                tooltip: {
                    headerFormat: '',
                    pointFormat: '<span style="color:{point.color}">\u25CF</span> <b> {point.name}</b><br/>' +
                    'Age: <b>{point.name}</b><br/>' +
                    'Population: <b>{point.z}</b><br/>'
                },
                plotOptions: {
                    variablepie: {
                        size:'60%',
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: true,
                            format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                            style: {
                                color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                            },
                        },
                        events: {
                            click: function (event) {
                                drawDistanceChart()
                            }
                        }
                    }
                },
                series: [{

                    innerSize: '20%',
                    data: [{
                        name: '0~4',
                        y: Number(populationBreakdown[selectedZone]['age04']),
                        z: 4
                    }, {
                        name: '5~9',
                        y: Number(populationBreakdown[selectedZone]['age59']),
                        z: 9
                    }, {
                        name: '10~14',
                        y:  Number(populationBreakdown[selectedZone]['age1014']),
                        z: 14
                    }, {
                        name: '15~19',
                        y: Number(populationBreakdown[selectedZone]['age1519']),
                        z: 19
                    }, {
                        name: '20~24',
                        y: Number(populationBreakdown[selectedZone]['age2024']),
                        z: 24
                    }, {
                        name: '25~34',
                        y: Number(populationBreakdown[selectedZone]['age2534']),
                        z: 34
                    }, {
                        name: '35~44',
                        y: Number(populationBreakdown[selectedZone]['age3544']),
                       z: 44
                    },
                    {
                        name: '45~54',
                        y: Number(populationBreakdown[selectedZone]['age4554']),
                        z: 54
                    },
                    {
                        name: '55~64',
                        y: Number(populationBreakdown[selectedZone]['age5564']),
                       z:64
                    },
                    {
                        name: '65~74',
                        y: Number(populationBreakdown[selectedZone]['age6574']),
                        z: 74
                    },
                    {   color:'red',
                        name: '75+',
                        y: Number(populationBreakdown[selectedZone]['age75a']),
                        z:84
                    }]
                }]
            });
        }
    });
}

//seperate an object into a list of values and a list of keys
function getKeysValuesOfTripsObject(obj){
    var keys = [];
    var values = [];
    for(var k in obj){
        keys.push(obj[k][0]);
        values.push(Number(obj[k][1]));
    }
    return [keys,values];
}
function getKeysValuesOfObject(obj){
    var keys = [];
    var values = [];
    for(var k in obj){
        keys.push(k)
        values.push(Number(obj[k]))
    }
    return [keys,values];
}
function convertPopEmpData(popEmpDataset) {
    var TAZTitle = 'TAZ1669';
    var tmpData = {};
    for(var k in popEmpDataset){
        var result = {};
        for(var title in popEmpDataset[k]){
            if(title!== TAZTitle){
                result[title] = popEmpDataset[k][title]
            }
        }
        tmpData[popEmpDataset[k][TAZTitle]] = result;
    }
    return tmpData
}