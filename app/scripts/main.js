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
        // header("Access-Control-Allow-Origin: *");
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
