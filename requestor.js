var request = require('request');
var requestor = null;

module.exports = {
	getRequestor: function(client_id, domain, contentType) {
		if (!requestor) {
			requestor = new Requestor(client_id, domain, contentType)
		}
		return requestor;
	}
}; 

function Requestor(client_id, domain, contentType) {
	//need to improve this RegExp, but need to know all possible patterns
	var pattern = new RegExp('\\w+:\\/\\/[\\w-.]+');

	this.client_id = client_id;
	this.origin = pattern.exec(domain);
	this.contentType = contentType;
	
	var ifmatch = "";
	var token = "";
	var basket_id = null;

	this.getBasketID = function() {
		return basket_id;
	}

	this.makeRequest = function(method, url, callback, body) {
		
		if (this.contentType.toLowerCase() == "application/json") {
			body = body ? JSON.stringify(body) : '';
		}
		else {
			//if we need to send XML data we can expand this condition
		}

		request({
			method : method,
	        url: domain + url,
	        headers: {
	        	"content-type": this.contentType,
	        	"Authorization": token,
	        	"Origin": this.origin,
	        	"If-Match": ifmatch
	    	},
	    	body: body,
	    	qs : {"client_id" : this.client_id}
	    }, function (error, response, bodyRes) {
			if (!error && response.statusCode == 200) {
				if (response.headers.etag) {
					ifmatch = response.headers.etag;
				}
				if (!token) {
					token = response.headers.authorization;
				}
				if (!basket_id && JSON.parse(bodyRes).basket_id) {
					basket_id = JSON.parse(bodyRes).basket_id;
				}
				callback(bodyRes);
			}
		});
	}
}