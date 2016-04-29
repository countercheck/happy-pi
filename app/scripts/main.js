$(function() {
  $("#happy").click(function(){
    console.log('happy');
    logEmotion('happy');
  });

  function logEmotion(emotion){
    $.ajax({
      url: 'https://sf9pegpjp4.execute-api.us-west-2.amazonaws.com/staging/emotions',
      type: 'post',
      data: {
      },
      headers: {
        location_id: 2,
        emotion: emotion
      },
      dataType: 'json',
      success: function (data) {
          console.info("response: ", data);
      },
      error: function (data) {
        console.info("error: ", data)
      }
    });
  }
});
