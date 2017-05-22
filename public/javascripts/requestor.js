var Requestor = (function(){
	var requestor;

	return {
        getRequestor: function() {
			if (!requestor) {
				requestor = new Requestor();
			}
			return requestor;
		}
	};

    function Requestor() {
		var ifmatch = "";
		var token = "";
		var basket_id = null;

		this.getBasketID = function() {
			return basket_id;
		}

		this.makeRequest = function(method, url, callback, data = {}) {
			if (token) {
				data.token = token;
			}
			
			if (ifmatch) {
				data.ifmatch = ifmatch;
			}

			$.ajax({
				type : method,
				url: url,
		        data: data
			}).done(function(data) {
				if (data.headers && data.headers.etag) {
					ifmatch = data.headers.etag;
				}
				if (!token && data.headers && data.headers.authorization) {
					token = data.headers.authorization;
				}
				var bodyRes = null;
				if (data.body) {
					bodyRes = JSON.parse(data.body);
					if (!basket_id && bodyRes.basket_id) {
						basket_id = bodyRes.basket_id;
					}
				}
				else {
					bodyRes = data;
				}
				
				callback(bodyRes);
			}).fail(function() {
				alert("Fail to get Basket");
			});
		}
    }
})();