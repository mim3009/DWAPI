var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');
var request    = require('request');
var path       = require("path");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

var port = 3001;

var request = request.defaults({
	headers: {
    	"content-type": "application/json",
    	"Origin": "https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net"
	},
	qs : {"client_id" : "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}
});

app.get('/', function(req, res){
	res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/login', function(req, res){
	request.post({
        url: "https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/customers/auth",
   		body: JSON.stringify({"type":"guest"})
    }, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			res.json(response);
		}
	});
});

app.get('/getProduct', function(req, res) {
	var query = req.query.query;

	request.get({
        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/product_search?q=' + query + '*&expand=images,prices,variations',
    }, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var token = response.headers.authorization;
			var parsedBody = JSON.parse(body);
			var masterIDs = [];
			for (var i = 0; i < parsedBody.hits.length; i++) {
				masterIDs.push(parsedBody.hits[i].product_id);
			}

			getAllVariants(masterIDs, token, function(products) {
			    getAllVariantsInfo(products, token, function(info) {
			    	res.json(info);
			    });
			});
		}
	})
});

app.get('/getBasket', function(req, res) {
	var token = req.query.token;
	request.post({
        url: "https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/baskets",
        headers: {
        	"Authorization": token
    	}
    }, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			res.json(response);
		}
	});
});

app.post('/addItemToBasket', function(req, res) {
	var pid = req.body.pid;
	var qty = req.body.qty;
	var token = req.body.token;
	var ifmatch = req.body.ifmatch;
	var basket_id = req.body.basket_id;

	request.post({
        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/baskets/' + basket_id + '/items',
        headers: {
        	"Authorization": token,
        	"If-Match": ifmatch
    	},
    	body: JSON.stringify({"product_id" : pid, "quantity" : +qty})
    }, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			res.json(response);
		}
	});
});

app.post('/setBasket', function(req, res) {
	var token = req.body.token;
	var ifmatch = req.body.ifmatch;
	var basket_id = req.body.basket_id;

	request.put({
        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/baskets/' + basket_id + '/billing_address',
        headers: {
        	"Authorization": token,
        	"If-Match": ifmatch
    	},
    	body: JSON.stringify({"first_name":"Roma", "last_name":"Zhyhulskyi", "city":"New York", "country_code":"US", "c_strValue":"cTest", "phone":"333-333-3333", "address1":"Henry St", "address2":"Madison St", "postal_code":"10010", "state_code":"NY"})
    }, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			ifmatch = response.headers.etag;
			request.put({
		        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/baskets/' + basket_id + '/customer',
		        headers: {
		        	"Authorization": token,
		        	"If-Match": ifmatch
		    	},
		    	body: JSON.stringify({"email":"r.zhyhulskyi@pulsarfour.com"})
		    }, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					ifmatch = response.headers.etag;
					var shipment_id = "me";
					request.put({
				        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/baskets/' + basket_id + '/shipments/' + shipment_id + '/shipping_method',
				        headers: {
				        	"Authorization": token,
				        	"If-Match": ifmatch
				    	},
				    	body: JSON.stringify({"id":"J220SM"})
				    }, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							ifmatch = response.headers.etag;
							request.put({
						        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/baskets/' + basket_id + '/shipments/' + shipment_id + '/shipping_address',
						        headers: {
						        	"Authorization": token,
						        	"If-Match": ifmatch
						    	},
						    	body: JSON.stringify({"first_name":"Roma", "last_name":"Zhyhulskyi", "city":"New York", "country_code":"US", "c_strValue":"cTest", "phone":"333-333-3333", "address1":"Henry St", "address2":"Madison St", "postal_code":"10010", "state_code":"NY"})
						    }, function (error, response, body) {
								if (!error && response.statusCode == 200) {
									res.json(response);
								}
							});
						}
					});
				}
			});
		}
	});
});

function getAllVariants(references, token, cb){
	var length = 0, count = 0;
	var productsVariants = [];
	references.forEach(function(ref){
		length++;
		request.get({
	        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/products/' + ref + '/variations',
	        headers: {
	        	"Authorization": token
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

function getAllVariantsInfo(references, token, cb){
	var length = 0, count = 0;
	var productsVariantsInfo = [];
	references.forEach(function(ref){
		length++;
		request.get({
	        url: 'http://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/products/' + ref + '?expand=availability,prices,images',
	        headers: {
	        	"Authorization": token
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

app.delete('/deleteItemFromBasket', function(req, res) {
	var token = req.body.token;
	var ifmatch = req.body.ifmatch;
	var basket_id = req.body.basket_id;
	var pid = req.body.pid;

	request.delete({
        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/baskets/' + basket_id + '/items/' + pid,
        headers: {
        	"Authorization": token,
        	"If-Match": ifmatch
    	},
    }, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			res.json(response);
		}
	});
});

app.post('/placeOrder', function(req, res) {
	var token = req.body.token;
	var ifmatch = req.body.ifmatch;
	var basket_id = req.body.basket_id;
	var amount = req.body.amount;

	request.post({
        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/baskets/' + basket_id + '/payment_instruments',
        headers: {
        	"Authorization": token,
        	"If-Match": ifmatch
    	},
    	body: JSON.stringify({"payment_method_id" : "PayPal", "amount" : +amount})
    }, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			ifmatch = response.headers.etag;
			request.post({
		        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/orders',
		        headers: {
		        	"Authorization": token,
		        	"If-Match": ifmatch
		    	},
		    	body: JSON.stringify({"basket_id":basket_id})
		    }, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					ifmatch = response.headers.etag;
					var order_no = JSON.parse(body).order_no;
					request.patch({
				        url: 'https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/dw/shop/v16_4/orders/' + order_no,
				        headers: {
				        	"Authorization": token,
				        	"If-Match": ifmatch
				    	},
				    	body: JSON.stringify({"payment_status":"paid"})
				    }, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							res.json(response);
						}
					});
				}
			});
		}
	});
});

app.listen(port);
console.log('Listening port: ' + port);

module.exports = app;