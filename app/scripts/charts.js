$(function () {
  function loadData(callback){
    $.ajax({
      url: 'https://sf9pegpjp4.execute-api.us-west-2.amazonaws.com/staging/emotions',
      type: 'get',
      dataType: 'json',
      success: function (data) {
          console.info(data);
          callback(data['Items']);
      }
    });
  }

  function buildCharts(rawData) {
    var processedData = processData(rawData);
    buildSplineGraph(processedData);
    buildBarGraph('#bar-chart');
    buildDonutGraph('#donut-chart');
    buildDonutGraph('#donut-chart2');
    buildDonutGraph('#donut-chart3');
  }

  function countByTimeByEmotion(elements){
    return R.reduce(byTimeByEmotion, buildTimeSeriesGroup(elements), elements);
  }

  function byTimeByEmotion(group, element) {
    if (group[element.emotion][dateHour(element)]) {
      group[element.emotion][dateHour(element)]['count'] += 1;
    } else {
      group[element.emotion][dateHour(element)] = {
        'count': 1,
        'moment': element.moment
      };
    }
    return group;
  }

  function dateHour(element) {
    return element.moment.format("YMMDDHH");
  }

  function buildTimeSeriesGroup(rawData) {
    var min = moment(rawData[0].moment);
    var max = moment(rawData[rawData.length -1].moment);
    var groups = {"sad":{}, "meh":{}, "happy": {}};
    for (min; min <= max; min.add(1, 'h')) {
      groups.sad[min.format("YMMDDHH")] = { moment: moment(min), count: 0 };
      groups.meh[min.format("YMMDDHH")] = { moment: moment(min), count: 0 };
      groups.happy[min.format("YMMDDHH")] = { moment: moment(min), count: 0 };
    }
    console.log(groups);
    return groups;
  }

  function buildSplineGraph(rawData){
    var groupedData = countByTimeByEmotion(rawData);
    var processedData = ['happy','meh','sad'].map(function(e){
      return {
        name: e,
        data: R.values(groupedData[e]).map(function(row){
          var time = row.moment.toObject();
          return [
            Date.UTC(time.years, time.months, time.date, time.hours),
            row.count
          ];
        })
      }
    });
    console.log(processedData);
    drawSplineGraph("#line-chart", processedData);
  }

  function processData(data) {
    return data.map(function(e) {
      e.moment = moment(Number(e.timestamp));
      e.location = getLocation(e.location_id);
      e.emotionValue = getEmotionValue(e.emotion);
      return e
    });
  }

  function getLocation(location_id) {
    return ["Web","Toronto"][location_id]
  }

  function buildBarGraph(container) {
      $(container).highcharts({
          chart: {
              type: 'column'
          },
          title: {
              text: 'Monthly Average Score'
          },
          xAxis: {
              categories: [
                  '04.28.2016',
                  '04.29.2016'
              ],
              crosshair: true
          },
          yAxis: {
              min: 0,
              title: {
                  text: 'score'
              }
          },
          tooltip: {
              headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
              pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                  '<td style="padding:0"><b>{point.y:.1f}</b></td></tr>',
              footerFormat: '</table>',
              shared: true,
              useHTML: true
          },
          plotOptions: {
              column: {
                  pointPadding: 0.2,
                  borderWidth: 0
              }
          },
          series: [{
              name: 'Toronto',
              data: [1, 2]

          }, {
              name: 'King',
              data: [3, 2]

          }, {
              name: 'Web',
              data: [1, 2]

          }]
      });
  }


  function buildDonutGraph(container) {

      var colors = Highcharts.getOptions().colors,
          categories = ['MSIE', 'Firefox', 'Chrome'],
          data = [{
              y: 56.33,
              color: colors[0],
              drilldown: {
                  name: 'Toronto',
                  categories: ['TO 6.0'],
                  data: [1.06],
                  color: colors[0]
              }
          }, {
              y: 10.38,
              color: colors[1],
              drilldown: {
                  name: 'King',
                  categories: ['KG v31'],
                  data: [0.33],
                  color: colors[1]
              }
          }, {
              y: 24.03,
              color: colors[2],
              drilldown: {
                  name: 'Web',
                  categories: ['WB v30.0'],
                  data: [0.14],
                  color: colors[2]
              }
          }],
          browserData = [],
          versionsData = [],
          i,
          j,
          dataLen = data.length,
          drillDataLen,
          brightness;


      // Build the data arrays
      for (i = 0; i < dataLen; i += 1) {

          // add browser data
          browserData.push({
              name: categories[i],
              y: data[i].y,
              color: data[i].color
          });

          // add version data
          drillDataLen = data[i].drilldown.data.length;
          for (j = 0; j < drillDataLen; j += 1) {
              brightness = 0.2 - (j / drillDataLen) / 5;
              versionsData.push({
                  name: data[i].drilldown.categories[j],
                  y: data[i].drilldown.data[j],
                  color: Highcharts.Color(data[i].color).brighten(brightness).get()
              });
          }
      }

      // Create the chart
      $(container).highcharts({
          chart: {
              type: 'pie'
          },
          title: {
              text: 'Browser market share, January, 2015 to May, 2015'
          },
          subtitle: {
              text: 'Source: <a href="http://netmarketshare.com/">netmarketshare.com</a>'
          },
          yAxis: {
              title: {
                  text: 'Total percent market share'
              }
          },
          plotOptions: {
              pie: {
                  shadow: false,
                  center: ['50%', '50%']
              }
          },
          tooltip: {
              valueSuffix: '%'
          },
          series: [{
              name: 'Versions',
              data: versionsData,
              size: '80%',
              innerSize: '60%',
              dataLabels: {
                  formatter: function () {
                      // display only if larger than 1
                      return this.y > 1 ? '<b>' + this.point.name + ':</b> ' + this.y + '%' : null;
                  }
              }
          }]
      });
  }

  function getEmotionValue(emotion){
    return {"sad":0, "meh": 1, "happy": 2}[emotion]
  }

  function drawSplineGraph(container, timeData) {
    $(container).highcharts({
        chart: {
            type: 'line'
        },
        title: {
            text: 'How many people clicked!'
        },

        subtitle: {
            text: 'Irregular time data in Highcharts JS'
        },
        xAxis: {
            type: 'datetime',
            dateTimeLabelFormats: { // don't display the dummy year
                hour: '%e %I %p',
            },
            title: {
                text: 'Date'
            }
        },
        yAxis: {
            title: {
                text: 'Click Count'
            },
            min: 0
        },
        tooltip: {
            headerFormat: '<b>{series.name}</b><br>',
            pointFormat: '{point.x:%e. %H}: {point.y} clicks'
        },

        plotOptions: {
            spline: {
                marker: {
                    enabled: true
                }
            }
        },

        series: timeData
    });
  };


  loadData(buildCharts);
});
