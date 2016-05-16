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
    buildClickGraph('#line-chart', processedData);
    buildPercentageGraph('#bar-chart', processedData);
    var donutData = getDonutData(processedData);
    buildDonutGraph('#donut-chart', donutData['Toronto']);
    buildDonutGraph('#donut-chart2', donutData['London']);
    buildDonutGraph('#donut-chart3', donutData['Web']);
  }

  function countByHourByEmotion(elements){
    return R.reduce(byHourByEmotion, buildTimeSeriesGroup(elements, "YMMDDHH", emotionNames()), elements);
  }

  function avgScoreByDayLocation(elements){
    return R.reduce(avgScoreByDayByLocation, buildTimeSeriesGroup(elements, "YMMDD", locationNames()), elements);
  }

  function getDonutData(elements){
    return R.reduce(byEmotionbyLocation, buildLocationCounts(), elements);
  }

  function emotionNames() {
    return ["sad", "meh", "happy"];
  }

  function byEmotionbyLocation(group, element) {
    group[element.location][element.emotion] += 1;
    return group;
  }

  function buildLocationCounts(){
    return {
      'Toronto': {
        name: 'Toronto',
        happy: 0,
        meh: 0,
        sad: 0
      },
      'London': {
        name: 'London',
        happy: 0,
        meh: 0,
        sad: 0
      },
      'Web': {
        name: 'Web',
        happy: 0,
        meh: 0,
        sad: 0
      }
    };
  }

  function byHourByEmotion(group, element) {
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

  function avgScoreByDayByLocation(group, element) {
    if (group[element.location][dateDay(element)]) {
      group[element.location][dateDay(element)]['score'] += element.emotionValue;
      group[element.location][dateDay(element)]['count'] += 1;
    } else {
      group[element.location][dateDay(element)] = {
        'score': element.emotionValue,
        'count': 1,
        'moment': element.moment
      };
    }
    console.log(group)
    return group;
  }

  function dateHour(element) {
    return element.moment.format("YMMDDHH");
  }

  function dateDay(element) {
    return element.moment.format("YMMDD");
  }

  function buildTimeSeriesGroup(rawData, timeFormat, groupNames) {
    var min = moment(rawData[0].moment);
    var max = moment(rawData[rawData.length -1].moment);
    var groups = R.reduce(function(object, param) {
      object[param] = {};
      return object
    }, {}, groupNames);
    for (min; min <= max; min.add(1, 'h')) {
      groupNames.forEach(function(name){
        groups[name][min.format(timeFormat)] = { moment: moment(min), count: 0, score: 0 };
      });
    }
    return groups;
  }

  function buildPercentageGraph(container, rawData){
    var groupedData = avgScoreByDayLocation(rawData);
    var processedData = locationNames().map(function(e){
      return {
        name: e,
        data: R.values(groupedData[e]).map(function(row){
          var time = row.moment.toObject();
          return [
            Date.UTC(time.years, time.months, time.date),
            (row.score / row.count || 0) / 2 * 100
          ];
        })
      }
    });
    console.log(processedData);
    drawSplineGraph(container, processedData, { title: 'Happiness by Day', subtitle: 'Average happiness (as a percentage of maximum happiness) by day, broken down by location', xLabel: 'Day', yLabel: 'Average happiness' });
  }

  function buildClickGraph(container, rawData, options){
    var groupedData = countByHourByEmotion(rawData);
    var processedData = emotionNames().map(function(e){
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

    drawSplineGraph(container, processedData, { title: 'Clicks per Hour', subtitle: 'Clicks per hour, broken down by happiness of each click', xLabel: 'Day', yLabel: 'clicks' });
  }

  function processData(data) {
    return data.map(function(e) {
      e.moment = moment(Number(e.timestamp));
      e.location = locationNames()[e.location_id];
      e.emotionValue = getEmotionValue(e.emotion);
      return e
    });
  }

  function locationNames() {
    return ["Web","Toronto","London"];
  }


  function buildDonutGraph(container, data) {
      // Create the chart
      $(container).highcharts({
          chart: {
              type: 'pie',
              height: 300
          },
          credits: {
            enabled: false
          },
          title: {
              text: data.name,
              verticalAlign: 'bottom',
            y: -70
          },
          yAxis: {
              title: {
                  text: 'Happiness breakdown'
              }
          },
          plotOptions: {
              pie: {
                  shadow: false,
                  center: ['50%', '50%']
              }
          },
          series: [{
              name: 'Count',
              data: [{
                y: data.happy,
                name: 'Happy'
              },
              {
                y: data.meh,
                name: 'Meh'
              },
              {
                y: data.sad,
                name: 'Sad'
              }],
              size: '70%',
              innerSize: '60%',
              dataLabels: {
                distance: -1,
                  formatter: function () {
                      // display only if larger than 1
                      return this.y > 1 ? '<b>' + this.point.name + ':</b> ' + this.y : null;
                  }
              }
          }]
      });
  }

  function getEmotionValue(emotion){
    return {"sad":0, "meh": 1, "happy": 2}[emotion];
  }

  function drawSplineGraph(container, timeData, options) {
    $(container).highcharts({
        chart: {
            type: 'line'
        },
        credits: {
            enabled: false
        },
        title: {
            text: options.title
        },

        subtitle: {
            text: options.subtitle
        },
        xAxis: {
            type: 'datetime',
            title: {
                text: options.xTitle
            }
        },
        yAxis: {
            title: {
                text: options.yTitle
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
