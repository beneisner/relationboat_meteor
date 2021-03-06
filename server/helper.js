var api_url = 'https://api.projectoxford.ai/emotion/v1.0/recognize'
var james_key = "d56bfdd4b1fc4fb4989908e4fa7d8a87"
var test_fb_url = 'https://scontent-iad3-1.xx.fbcdn.net/hphotos-xaf1/v/t1.0-9/11902360_10204809163811037_8085263968138789270_n.jpg?oh=d341f098ffbf8e817aee8e606cf52713&oe=56ADE898'
var wiki = "https://upload.wikimedia.org/wikipedia/commons/e/eb/Ash_Tree_-_geograph.org.uk_-_590710.jpg"
var indico_url = 'https://apiv2.indico.io/sentiment?key=c9d6aa07d112b8be0e9aac6ffe4196de'


getEmotions = function(pic_list) {
	var emotions_list = [];

	for (let pic of pic_list) {
		var url = pic.url;
		var x1 = pic.x1;
		var y1 = pic.y1;
		var x2 = pic.x2;
		var y2 = pic.y2;
		var width = pic.width;
		var height = pic.height;
		getEmotionFromURL(emotions_list, url, x1, y1, x2, y2, width, height);
	}

	return emotions_list;
}

getSentimentFromText = function(text) {
	datas = {
		'data': JSON.stringify(text)
	}
  
  try {
    var val = HTTP.post(indico_url, {data: datas});
    var content = val.content
    var num = JSON.parse(content).results
    return num;
  } catch (e) {
    console.log("ERROR:" + error);
    return -1;
  }
	
}

function getEmotionFromURL(emotions_list, url, x1, y1, x2, y2, width, height) {
	hdr = {
			"Content-Type":"application/json",
		  	"Ocp-Apim-Subscription-Key":"d56bfdd4b1fc4fb4989908e4fa7d8a87"
		}

	img = {
		"url": url
	}

	var content = null;

	callback = function(error, response) {
		if (error) {
			console.log("James ERROR: " + error);
		}
	 	content = JSON.parse(response['content']);
	 	var my_face = findClosestFace(content, x1, y1, width, height);
	 	var friend_face = findClosestFace(content, x2, y2, width, height);;
	 	emotions_list.push({user: my_face, friend: friend_face, image: url});
	}
	HTTP.post(api_url, {headers:hdr, data:img}, asyncCallback=callback);
}

function findClosestFace(content, x, y, width, height) {
	var closest_face = null;
	var min_dist = 100000000;
	for (let face of content) {
		var center_x = face['faceRectangle']['left'] + ((face["faceRectangle"]["width"])/2.0);
		var center_y = face['faceRectangle']['top'] + ((face['faceRectangle']['height'])/2.0);
		var x_pixels = x / 100.0 * width;
		var y_pixels = y / 100.0 * height;
		var dist = getDistance(x_pixels, y_pixels, center_x, center_y);

		if (dist < min_dist) {
			min_dist = dist;
			closest_face = face;
		}
	}
	return closest_face
}

function getDistance(x1, y1, x2, y2) {
	return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1))
}
