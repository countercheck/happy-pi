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
