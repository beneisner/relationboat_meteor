var emotions = [];
Meteor.methods({
  getUserData: function () {
    return Meteor.user();
  },

  getPhotoEvals: function (friend, cached) {
    if (cached) {
        var temp = emotions;
        emotions = [];
        return temp;
    }
    var accessToken = Meteor.user().services.facebook.accessToken;
    var myName = Meteor.user().profile.name;
    console.log("myName: " + myName);
    console.log("accessToken: " + accessToken);


    callback = function (error, response) {
      if (error != null) {
        console.log("Frank ERROR1:" + error)
      } else {
        var contentString = response['content'];
        var content = JSON.parse(contentString);
        if (content != null) {
          listOfPics = [];
          var countPhotosFound = 0;
          var countOutstandingRequests = Math.ceil(content.photos.data.length / 50);
          var finished = false;
          var photoIDs = '';
          var id2url = {};
          var id2size = {};
          var counter = 0;
          var numImagesProcessed = 0;
          var numImages = content.photos.data.length;
          console.log('Number of photos: ' + content.photos.data.length);
          for (let pic of content.photos.data) {
            if (pic.images.length > 0) {
              var url = pic.images[0].source;
              var photoID = pic.id;
              id2url[photoID] = url;
              id2size[photoID] = {
                width: pic.images[0].width,
                height: pic.images[0].height
              };
              photoIDs += photoID + ',';
              counter++;
              numImagesProcessed++;
              if (counter >= 50 || numImagesProcessed == numImages) {

                var tagURL = 'https://graph.facebook.com/tags?ids=' + photoIDs.slice(0, -1) + '&access_token=' + accessToken;
                HTTP.get(tagURL, asyncCallback =
                  function (error, response) {
                    countOutstandingRequests--;
                    if (error != null) {
                      console.log("Frank ERROR2:" + error);
                    } else {
                      var contentString = response['content'];
                      var content = JSON.parse(contentString);
                      if (content != null) {
                        for (var photoID in content) {
                          var myX = -1;
                          var myY = -1;
                          var friendX = -1;
                          var friendY = -1;

                          for (let person of content[photoID].data) {
                            if (person.name === myName) {
                              myX = person.x;
                              myY = person.y;
                            } else if (person.name === friend) {
                              friendX = person.x;
                              friendY = person.y;
                            }
                          }
                          if (myX != -1 && typeof myX !== 'undefined' && friendX != -1 && typeof friendX !== 'undefined') {
                            listOfPics.push({
                              url: id2url[photoID],
                              x1: myX,
                              y1: myY,
                              x2: friendX,
                              y2: friendY,
                              width: id2size[photoID].width,
                              height: id2size[photoID].height
                            });
                            countPhotosFound++;
                          }
                        }

                        if (countOutstandingRequests == 0) {
                          emotions = getEmotions(listOfPics);

                        //  setTimeout(function () {
                        //    for (var i = 0; i < emotions.length; i++) {
                        //      console.log("Emotions: " + JSON.stringify(emotions[i]));
                        //    }

                        //  }, 3000);
                        }
                      }
                    }
                  });
                photoIDs = '';
                counter = 0;
              }
            }
          }
        }
      }
    }

    //var graphURL = 'https://graph.facebook.com/me';
    var graphURL = 'https://graph.facebook.com/me?fields=photos.limit(500).order(reverse_chronological){id, images}&access_token=' + accessToken;
    //	    HTTP.get(graphURL, {fields: 'photos', access_token: accessToken}, asyncCallback=callback);
    HTTP.get(graphURL, asyncCallback = callback);

    return emotions;
  },


  getMessages: function (friend) {
    var msg_query_url = 'https://graph.facebook.com/me?fields=inbox.limit(15)&access_token=CAACEdEose0cBAO0uVBTw7dHsGEx1cW7y4x2iGcq5WIfXlbICnSwvPVGQOA2k9cXcX8aXd9RChZBk3ZCAhKFMZCDI38L3UKDui2tlbQlLBiufb6ZCTcw1p3eLILQrZCi8KIZADs33qT5TSnO01LHEgQhcP4ttmQYkBMqcATiv7YZCZCz8q0lN4ZC39mImfUnkWAI4bzVnmfD2HZAcfmfldmvkzt';



    try {
      // get messages from FB
      console.log("Starting HTTP Request")
      var res = HTTP.get(msg_query_url);

      var content = JSON.parse(res.content);
      var threads = content.inbox.data;

      var selectedConv = null;

      // get thread between user and selected friend
      console.log("Checking Threads")
      for (let thread of threads) {
        var participants = thread.to.data
        if (participants.length == 2 &&
          (participants[0].name == friend || participants[1].name == friend)) {
          selectedConv = thread;
          break;
        }
      }

      // build string for indico
      console.log(selectedConv)
      var bigstring = '';
      for (let msg of selectedConv.comments.data) {
        bigstring = bigstring + ' ' + msg.message;
      }

      console.log("BIG STRING" + bigstring);

      console.log("Getting Sentiments")
      var positivity = getSentimentFromText(bigstring);

      console.log("Positivity " + positivity)
      return positivity;

    } catch (e) {
      console.log(e)
      return -1;
    }


  }


});
