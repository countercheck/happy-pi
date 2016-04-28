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
      },
      dataType: 'json',
      success: function (data) {
          console.info(data);
      }
    });
  }
});
