var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');
var request    = require('request');
var path       = require("path");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

var port = 3001;
var client_id = "?client_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
var token = "";
var origin = "https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net";
var basket_id = "";
var ifmatch = "";

app.get('/', function(req, res){
	request.post({
        url: "https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/customers/auth" + client_id,
        headers: {
        	"content-type": "application/json",
        	"Origin": origin
    	},
   		body: JSON.stringify({"type":"guest"})
    }, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			token = response.headers.authorization;
			
			request.post({
		        url: "https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/baskets" + client_id,
		        headers: {
		        	"content-type": "application/json",
		        	"Authorization": token,
		        	"Origin": origin
		    	}
		    }, function (error2, response2, body2) {
				if (!error2 && response2.statusCode == 200) {
					basket_id = (JSON.parse(body2).basket_id);
					res.sendFile(path.join(__dirname + '/index.html'));
				}
			});
		}
	});
});

app.get('/getProduct', function(req, res) {
	var query = req.query.query;

	request.get({
        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/product_search?q=' + query + '*&expand=images,prices,variations&client_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        headers: {
        	"content-type": "application/json",
        	"Authorization": token,
        	"Origin": origin,
        	"If-Match": ifmatch
    	}
    }, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var parsedBody = JSON.parse(body);
			var masterIDs = [];
			for (var i = 0; i < parsedBody.hits.length; i++) {
				masterIDs.push(parsedBody.hits[i].product_id);
			}

			getAllVariants(masterIDs, function(products) {
			    getAllVariantsInfo(products, function(info) {
			    	res.json(info);
			    });
			});
		}
	})
});

function getAllVariants(references, cb){
	var length = 0, count = 0;
	var productsVariants = [];
	references.forEach(function(ref){
		length++;
		request.get({
	        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/products/' + ref + '/variations' + client_id,
	        headers: {
	        	"content-type": "application/json",
	        	"Authorization": token,
	        	"Origin": origin,
	        	"If-Match": ifmatch
	    	}
	    }, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var parsedBody = JSON.parse(body);
				for (var j = 0; j < parsedBody.variants.length; j++) {
					productsVariants.push(parsedBody.variants[j].product_id);
				}
				if (++count === length) {
		          	cb(productsVariants);
		        }
			}
		});
  	});
}

function getAllVariantsInfo(references, cb){
	var length = 0, count = 0;
	var productsVariantsInfo = [];
	references.forEach(function(ref){
		length++;
		request.get({
	        url: 'http://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/products/' + ref + '?expand=availability,prices,images&client_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
	        headers: {
	        	"content-type": "application/json",
	        	"Authorization": token,
	        	"Origin": origin,
	        	"If-Match": ifmatch
	    	}
	    }, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var parsedBody = JSON.parse(body);
				if (parsedBody.inventory.orderable) {
					var productInfo = {
						id : parsedBody.id,
						name : parsedBody.name,
						color : parsedBody.c_color,
						size : parsedBody.c_size,
						imgLink : parsedBody.image_groups[1].images[0].link,
						price : parsedBody.price,
						count : parsedBody.inventory.ats
					};
					productsVariantsInfo.push(productInfo);
				}
				if (++count === length) {
		          	cb(productsVariantsInfo);
		        }
			}
		});
  	});
}

app.get('/getBasket', function(req, res) {
	request.get({
        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/baskets/' + basket_id + '' + client_id,
        headers: {
        	"content-type": "application/json",
        	"Authorization": token,
        	"Origin": origin,
        	"If-Match": ifmatch
    	}
    }, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			ifmatch = response.headers.etag;
			res.end(body);
		}
	})
});

app.get('/loadBasket', function(req, res) {
	request.get({
        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/baskets/' + basket_id + '' + client_id,
        headers: {
        	"content-type": "application/json",
        	"Authorization": token,
        	"Origin": origin
    	}
    }, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			ifmatch = response.headers.etag;
			res.end(body);
		}
	});
});

app.post('/addItemToBasket', function(req, res) {
	var pid = req.body.pid;
	var qty = req.body.qty;

	request.post({
        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/baskets/' + basket_id + '/items' + client_id,
        headers: {
        	"content-type": "application/json",
        	"Authorization": token,
        	"Origin": origin,
        	"If-Match": ifmatch
    	},
    	body: JSON.stringify({"product_id" : pid, "quantity" : +qty})
    }, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			ifmatch = response.headers.etag;
			res.end(body);
		}
	});
});

app.post('/setBasket', function(req, res) {
	request.put({
        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/baskets/' + basket_id + '/billing_address' + client_id,
        headers: {
        	"content-type": "application/json",
        	"Authorization": token,
        	"Origin": origin,
        	"If-Match": ifmatch
    	},
    	body: JSON.stringify({"first_name":"Roma", "last_name":"Zhyhulskyi", "city":"New York", "country_code":"US", "c_strValue":"cTest", "phone":"333-333-3333", "address1":"Henry St", "address2":"Madison St", "postal_code":"10010", "state_code":"NY"})
    }, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			ifmatch = response.headers.etag;
			request.put({
		        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/baskets/' + basket_id + '/customer' + client_id,
		        headers: {
		        	"content-type": "application/json",
		        	"Authorization": token,
		        	"Origin": origin,
		        	"If-Match": ifmatch
		    	},
		    	body: JSON.stringify({"email":"r.zhyhulskyi@pulsarfour.com"})
		    }, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					ifmatch = response.headers.etag;
					var shipment_id = "me";
					request.put({
				        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/baskets/' + basket_id + '/shipments/' + shipment_id + '/shipping_method' + client_id,
				        headers: {
				        	"content-type": "application/json",
				        	"Authorization": token,
				        	"Origin": origin,
				        	"If-Match": ifmatch
				    	},
				    	body: JSON.stringify({"id":"J220SM"})
				    }, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							ifmatch = response.headers.etag;
							request.put({
						        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/baskets/' + basket_id + '/shipments/' + shipment_id + '/shipping_address' + client_id,
						        headers: {
						        	"content-type": "application/json",
						        	"Authorization": token,
						        	"Origin": origin,
						        	"If-Match": ifmatch
						    	},
						    	body: JSON.stringify({"first_name":"Roma", "last_name":"Zhyhulskyi", "city":"New York", "country_code":"US", "c_strValue":"cTest", "phone":"333-333-3333", "address1":"Henry St", "address2":"Madison St", "postal_code":"10010", "state_code":"NY"})
						    }, function (error, response, body) {
								if (!error && response.statusCode == 200) {
									ifmatch = response.headers.etag;
									res.end(body);
								}
							});
						}
					});
				}
			});
		}
	});
});

app.post('/placeOrder', function(req, res) {
	var amount = req.body.amount;
	request.post({
        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/baskets/' + basket_id + '/payment_instruments' + client_id,
        headers: {
        	"content-type": "application/json",
        	"Authorization": token,
        	"Origin": origin,
        	"If-Match": ifmatch
    	},
    	body: JSON.stringify({"payment_method_id" : "PayPal", "amount" : +amount})
    }, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			ifmatch = response.headers.etag;
			request.post({
		        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/orders' + client_id,
		        headers: {
		        	"content-type": "application/json",
		        	"Authorization": token,
		        	"Origin": origin,
		        	"If-Match": ifmatch
		    	},
		    	body: JSON.stringify({"basket_id":basket_id})
		    }, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					ifmatch = response.headers.etag;
					var order_no = JSON.parse(body).order_no;
					request.patch({
				        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/orders/' + order_no + '' + client_id,
				        headers: {
				        	"content-type": "application/json",
				        	"Authorization": token,
				        	"Origin": origin,
				        	"If-Match": ifmatch
				    	},
				    	body: JSON.stringify({"payment_status":"paid"})
				    }, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							ifmatch = response.headers.etag;
							res.end(body);
						}
					});
				}
			});
		}
	});
});

app.delete('/deleteItemFromBasket', function(req, res) {
	var pid = req.body.pid;
	request.delete({
        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/baskets/' + basket_id + '/items/' + pid + '' + client_id,
        headers: {
        	"content-type": "application/json",
        	"Authorization": token,
        	"Origin": origin,
        	"If-Match": ifmatch
    	},
    }, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			ifmatch = response.headers.etag;
			res.end(body);
		}
	});
});

app.listen(port);
console.log('Listening port: ' + port);

module.exports = app;